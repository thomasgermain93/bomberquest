#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const severityRank = { P0: 0, P1: 1, P2: 2 };

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

function toSeverity(value) {
  const raw = String(value || '').toUpperCase();
  if (raw in severityRank) return raw;
  if (raw === 'CRITICAL' || raw === 'BLOCKER') return 'P0';
  if (raw === 'HIGH' || raw === 'MAJOR') return 'P1';
  return 'P2';
}

function isAutoFixable(issue) {
  const fix = issue?.fix;
  if (!fix || fix.kind !== 'replace_text') {
    return { ok: false, reason: 'missing fix.replace_text payload' };
  }

  const file = fix.file || '';
  const allowedFile = /^src\/.+\.(tsx|ts|css)$/i.test(file);
  if (!allowedFile) {
    return { ok: false, reason: `file not in allowed scope: ${file || 'unknown'}` };
  }

  if (typeof fix.find !== 'string' || typeof fix.replace !== 'string') {
    return { ok: false, reason: 'fix.find/fix.replace must be strings' };
  }

  if (fix.find.length === 0) {
    return { ok: false, reason: 'fix.find must be non-empty' };
  }

  return { ok: true };
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function buildPlan(radarReport, baselineReport) {
  const issues = Array.isArray(radarReport?.issues) ? radarReport.issues : [];
  const actions = [];
  const skipped = [];

  for (const issue of issues) {
    const severity = toSeverity(issue.severity || issue.priority);
    const eligibility = isAutoFixable(issue);

    const item = {
      issueId: issue.id ?? issue.number ?? issue.key ?? 'unknown',
      title: issue.title || issue.summary || 'Untitled UI issue',
      severity,
      type: issue.type || issue.rule || 'unknown',
      source: issue.source || 'ui-radar',
      file: issue?.fix?.file,
      fix: issue?.fix,
      rationale: issue.rationale || issue.description || '',
    };

    if (eligibility.ok) {
      actions.push(item);
    } else {
      skipped.push({ ...item, reason: eligibility.reason });
    }
  }

  actions.sort((a, b) => {
    const bySeverity = severityRank[a.severity] - severityRank[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return String(a.issueId).localeCompare(String(b.issueId));
  });

  return {
    generatedAt: new Date().toISOString(),
    radarMeta: {
      reportPath: radarReport?.meta?.reportPath || null,
      reportGeneratedAt: radarReport?.generatedAt || null,
      issuesTotal: issues.length,
    },
    baselineMeta: baselineReport
      ? {
          baselineGeneratedAt: baselineReport.generatedAt || null,
          baselineRef: baselineReport.ref || baselineReport.commit || null,
        }
      : null,
    guardrails: {
      maxFilesTouched: 4,
      maxChangedLines: 200,
      allowedFileRegex: '^src/.+\\.(tsx|ts|css)$',
      supportedFixKind: ['replace_text'],
    },
    summary: {
      autoFixable: actions.length,
      manualOnly: skipped.length,
      bySeverity: {
        P0: actions.filter((a) => a.severity === 'P0').length,
        P1: actions.filter((a) => a.severity === 'P1').length,
        P2: actions.filter((a) => a.severity === 'P2').length,
      },
    },
    actions,
    skipped,
  };
}

function main() {
  const args = parseArgs(process.argv);
  const radarPath = args.radar;
  const outPath = args.out || 'artifacts/ui-auto-repair/repair-plan.json';

  if (!radarPath) {
    console.error('Missing required --radar <path>');
    process.exit(2);
  }

  const radar = loadJson(path.resolve(radarPath));
  const baseline = args.baseline ? loadJson(path.resolve(args.baseline)) : null;
  const plan = buildPlan(radar, baseline);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  console.log(`Plan written: ${outPath}`);
  console.log(`Auto-fixable: ${plan.summary.autoFixable}, manual: ${plan.summary.manualOnly}`);
}

main();
