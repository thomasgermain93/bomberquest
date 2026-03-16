import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = process.cwd();
const planScript = path.join(repoRoot, 'scripts/ui-auto-repair/plan-from-radar.mjs');
const runLoopScript = path.join(repoRoot, 'scripts/ui-auto-repair/run-loop.mjs');

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ui-auto-repair-'));
}

describe('ui auto-repair scripts', () => {
  test('plan-from-radar lit findings', () => {
    const dir = mkTmpDir();
    const radarPath = path.join(dir, 'radar.json');
    const outPath = path.join(dir, 'plan.json');

    fs.writeFileSync(
      radarPath,
      JSON.stringify({
        findings: [
          {
            id: 1,
            title: 'Fix CTA',
            severity: 'P1',
            fix: {
              kind: 'replace_text',
              file: 'src/pages/Landing.tsx',
              find: 'old',
              replace: 'new',
            },
          },
        ],
      }),
      'utf8',
    );

    execFileSync('node', [planScript, '--radar', radarPath, '--out', outPath], { cwd: repoRoot });

    const plan = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    expect(plan.radarMeta.issuesTotal).toBe(1);
    expect(plan.actions).toHaveLength(1);
  });

  test('plan-from-radar reste compatible avec issues', () => {
    const dir = mkTmpDir();
    const radarPath = path.join(dir, 'radar-legacy.json');
    const outPath = path.join(dir, 'plan-legacy.json');

    fs.writeFileSync(
      radarPath,
      JSON.stringify({
        issues: [
          {
            id: 2,
            title: 'Legacy format issue',
            severity: 'P2',
            fix: {
              kind: 'replace_text',
              file: 'src/pages/Index.tsx',
              find: 'foo',
              replace: 'bar',
            },
          },
        ],
      }),
      'utf8',
    );

    execFileSync('node', [planScript, '--radar', radarPath, '--out', outPath], { cwd: repoRoot });

    const plan = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    expect(plan.radarMeta.issuesTotal).toBe(1);
    expect(plan.actions).toHaveLength(1);
  });

  test('run-loop dry-run respecte --report', () => {
    const dir = mkTmpDir();
    const planPath = path.join(dir, 'plan.json');
    const reportPath = path.join(dir, 'custom-report.json');

    fs.writeFileSync(
      planPath,
      JSON.stringify({
        actions: [
          {
            issueId: 3,
            fix: {
              kind: 'replace_text',
              file: 'src/pages/Landing.tsx',
              find: 'foo',
              replace: 'bar',
            },
          },
        ],
        skipped: [],
      }),
      'utf8',
    );

    execFileSync('node', [runLoopScript, '--dry-run=true', '--plan', planPath, '--report', reportPath], {
      cwd: repoRoot,
    });

    expect(fs.existsSync(reportPath)).toBe(true);
    const summary = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    expect(summary.result.dryRun).toBe(true);
    expect(summary.planPath).toBe(planPath);
  });
});
