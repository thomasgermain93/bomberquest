#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const [k, inline] = token.split('=');
    const key = k.slice(2);
    const value = inline ?? argv[i + 1];
    if (inline === undefined) i += 1;
    args[key] = value;
  }
  return args;
}

function run(cmd, cmdArgs, opts = {}) {
  const result = spawnSync(cmd, cmdArgs, { encoding: 'utf8', ...opts });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function applyReplaceText(fix) {
  const filePath = path.resolve(fix.file);
  const initial = fs.readFileSync(filePath, 'utf8');
  if (!initial.includes(fix.find)) {
    return { ok: false, reason: `pattern not found in ${fix.file}` };
  }

  const replaced = initial.replace(fix.find, fix.replace);
  if (replaced === initial) {
    return { ok: false, reason: `replacement produced no change in ${fix.file}` };
  }

  fs.writeFileSync(filePath, replaced, 'utf8');
  return { ok: true, file: fix.file };
}

function gitDiffStats() {
  const result = run('git', ['diff', '--numstat']);
  const lines = result.stdout.split('\n').filter(Boolean);
  let total = 0;
  for (const l of lines) {
    const [a, d] = l.split('\t');
    total += (Number(a) || 0) + (Number(d) || 0);
  }
  return { totalChangedLines: total, raw: lines };
}

function writeSummary(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function rollbackFiles(files) {
  if (!files.length) return;
  run('git', ['checkout', '--', ...files]);
}

function main() {
  const args = parseArgs(process.argv);
  const planPath = args.plan || 'artifacts/ui-auto-repair/repair-plan.json';
  const summaryPath = args.summary || 'artifacts/ui-auto-repair/repair-summary.json';
  const dryRun = String(args['dry-run'] || 'false') === 'true';
  const maxFiles = Number(args['max-files'] || 4);
  const maxDiffLines = Number(args['max-diff-lines'] || 200);

  const plan = JSON.parse(fs.readFileSync(path.resolve(planPath), 'utf8'));
  const actions = Array.isArray(plan.actions) ? plan.actions : [];

  const touched = new Set();
  const applied = [];
  const skipped = [];
  let guardrailStop = null;

  for (const action of actions) {
    const fix = action.fix;
    if (!fix || fix.kind !== 'replace_text') {
      skipped.push({ issueId: action.issueId, reason: 'unsupported fix kind' });
      continue;
    }

    if (!/^src\/.+\.(tsx|ts|css)$/i.test(fix.file || '')) {
      skipped.push({ issueId: action.issueId, reason: `file out of allowed scope: ${fix.file}` });
      continue;
    }

    const projectedCount = touched.has(fix.file) ? touched.size : touched.size + 1;
    if (projectedCount > maxFiles) {
      guardrailStop = `max files touched reached (${maxFiles})`;
      break;
    }

    if (dryRun) {
      touched.add(fix.file);
      applied.push({ issueId: action.issueId, file: fix.file, dryRun: true });
      continue;
    }

    const appliedFix = applyReplaceText(fix);
    if (!appliedFix.ok) {
      skipped.push({ issueId: action.issueId, reason: appliedFix.reason });
      continue;
    }

    touched.add(fix.file);
    applied.push({ issueId: action.issueId, file: fix.file });

    const diffStats = gitDiffStats();
    if (diffStats.totalChangedLines > maxDiffLines) {
      guardrailStop = `diff too large (${diffStats.totalChangedLines} > ${maxDiffLines})`;
      break;
    }
  }

  if (!dryRun && guardrailStop) {
    rollbackFiles([...touched]);
  }

  let build = { ok: null, status: null };
  if (!dryRun && !guardrailStop && applied.length > 0) {
    build = run('npm', ['run', 'build']);
    if (!build.ok) {
      rollbackFiles([...touched]);
      guardrailStop = 'build failed';
    }
  }

  const diff = gitDiffStats();
  const summary = {
    generatedAt: new Date().toISOString(),
    planPath,
    guardrails: {
      maxFiles,
      maxDiffLines,
      triggered: guardrailStop,
    },
    result: {
      dryRun,
      appliedCount: applied.length,
      skippedCount: skipped.length,
      touchedFiles: [...touched],
      build,
      totalChangedLines: diff.totalChangedLines,
    },
    beforeAfter: {
      inputIssues: actions.length + (plan.skipped?.length || 0),
      autoFixCandidates: actions.length,
      appliedIssueIds: applied.map((a) => a.issueId),
      skipped,
    },
  };

  writeSummary(summaryPath, summary);
  console.log(`Summary written: ${summaryPath}`);

  if (guardrailStop) {
    console.error(`Stopped by guardrail: ${guardrailStop}`);
    process.exit(1);
  }

  if (!dryRun && applied.length > 0 && !build.ok) {
    process.exit(1);
  }
}

main();
