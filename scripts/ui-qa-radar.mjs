#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, 'reports', 'ui-radar');
const SHOTS_DIR = path.join(REPORT_DIR, 'screenshots');
const DEV_PORT = Number(process.env.UI_RADAR_PORT || 4173);
const BASE_URL = process.env.UI_RADAR_BASE_URL || `http://127.0.0.1:${DEV_PORT}`;

const scenarios = [
  { key: 'landing', label: 'Landing / Index marketing', path: '/', expectedTexts: ['BomberQuest'] },
  { key: 'game-hub', label: 'Game: Hub', path: '/game', expectedTexts: ['BOMBERQUEST', 'Hub'] },
  {
    key: 'game-fusion',
    label: 'Game: Fusion tab',
    path: '/game',
    expectedTexts: ['Fusion'],
    actions: [{ type: 'clickTestId', testId: 'tab-fusion' }],
  },
  {
    key: 'game-heroes',
    label: 'Game: Heroes tab',
    path: '/game',
    expectedTexts: ['Héros'],
    actions: [{ type: 'clickTestId', testId: 'tab-heroes' }],
  },
  { key: 'bestiary', label: 'Wiki Bestiary', path: '/wiki/bestiaire', expectedTexts: ['Bestiaire'] },
  { key: 'summon', label: 'Summon / Fusion screen', path: '/summon', expectedTexts: ['Invocation', 'Invoquer'] },
  {
    key: 'summon-fusion-tab',
    label: 'Summon: Fusion tab state',
    path: '/summon',
    expectedTexts: ['Fusion'],
    actions: [{ type: 'clickTestId', testId: 'tab-summon' }],
  },
];

const severityRank = { P0: 0, P1: 1, P2: 2 };

function classifyFinding(kind, details) {
  if (kind === 'offViewport' && details.interactive) return 'P0';
  if (kind === 'stateActionUnavailable' || kind === 'missingState') return 'P1';
  if (kind === 'contrast' && details.contrast < 2.2) return 'P1';
  if (kind === 'overflow') return 'P1';
  if (kind === 'offViewport') return 'P1';
  if (kind === 'overlap') return 'P1';
  return 'P2';
}

function summarize(kind) {
  return {
    overflow: 'Overflow/clipping détecté',
    truncatedText: 'Texte potentiellement tronqué',
    offViewport: 'Élément hors viewport',
    contrast: 'Contraste texte douteux',
    overlap: 'Chevauchement / spacing incohérent',
    stateActionUnavailable: 'État UI non accessible automatiquement',
    missingState: 'État/UI attendu introuvable',
  }[kind] || kind;
}

async function waitForServer(url, maxMs = 45_000) {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok || res.status === 404) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error(`Timeout waiting for dev server: ${url}`);
}

async function runAction(page, action) {
  if (action.type === 'clickText') {
    const locator = page.getByText(action.text, { exact: false }).first();
    if (await locator.count()) {
      await locator.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(400);
      return { ok: true };
    }
    return { ok: false, reason: `text '${action.text}' not found` };
  }
  if (action.type === 'clickTestId') {
    const locator = page.getByTestId(action.testId);
    if (await locator.count()) {
      await locator.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(400);
      return { ok: true };
    }
    return { ok: false, reason: `testId '${action.testId}' not found` };
  }
  return { ok: false, reason: `unknown action ${action.type}` };
}

async function scanScenario(browser, scenario) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const url = `${BASE_URL}${scenario.path}`;
  const actionResults = [];

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  for (const action of scenario.actions || []) {
    actionResults.push(await runAction(page, action));
  }

  const pageText = await page.locator('body').innerText().catch(() => '');
  const stateFindings = [];

  if ((scenario.expectedTexts || []).length > 0) {
    const matched = scenario.expectedTexts.some((t) => pageText.toLowerCase().includes(t.toLowerCase()));
    if (!matched) {
      stateFindings.push({
        kind: 'missingState',
        selector: scenario.path,
        text: pageText.slice(0, 120),
        details: { expectedTexts: scenario.expectedTexts },
      });
    }
  }

  for (const [idx, actionResult] of actionResults.entries()) {
    if (!actionResult.ok) {
      stateFindings.push({
        kind: 'stateActionUnavailable',
        selector: scenario.path,
        text: '',
        details: { action: scenario.actions?.[idx], reason: actionResult.reason },
      });
    }
  }

  const screenshot = path.join(SHOTS_DIR, `${scenario.key}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });

  const scan = await page.evaluate(() => {
    const out = [];
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const isVisible = (el) => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    const isInteractive = (el) => ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) || el.getAttribute('role') === 'button';

    const cssPath = (el) => {
      const parts = [];
      let node = el;
      let depth = 0;
      while (node && node.nodeType === Node.ELEMENT_NODE && depth < 4) {
        let s = node.tagName.toLowerCase();
        if (node.id) s += `#${node.id}`;
        else if (node.classList.length) s += `.${Array.from(node.classList).slice(0, 2).join('.')}`;
        parts.unshift(s);
        node = node.parentElement;
        depth++;
      }
      return parts.join(' > ');
    };

    const parseRgb = (v) => {
      const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
    };

    const luminance = (rgb) => {
      const a = rgb.map((x) => {
        const c = x / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    };

    const contrastRatio = (fg, bg) => {
      const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
      return (l1 + 0.05) / (l2 + 0.05);
    };

    const els = Array.from(document.querySelectorAll('body *')).filter(isVisible).slice(0, 600);

    for (const el of els) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 140);

      if (el.scrollWidth - el.clientWidth > 2 && style.overflowX !== 'visible') {
        out.push({ kind: 'overflow', selector: cssPath(el), text, details: { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth } });
      }
      if (el.scrollHeight - el.clientHeight > 2 && style.overflowY !== 'visible') {
        out.push({ kind: 'overflow', selector: cssPath(el), text, details: { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight } });
      }

      const lineClamp = Number(style.webkitLineClamp || 0);
      if ((style.textOverflow === 'ellipsis' || lineClamp > 0) && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2)) {
        out.push({ kind: 'truncatedText', selector: cssPath(el), text, details: { lineClamp } });
      }

      if (rect.right < 0 || rect.bottom < 0 || rect.left > vw || rect.top > vh || rect.left < -2 || rect.top < -2 || rect.right > vw + 2 || rect.bottom > vh + 2) {
        out.push({ kind: 'offViewport', selector: cssPath(el), text, details: { rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }, interactive: isInteractive(el) } });
      }

      if (text.length > 3) {
        const fg = parseRgb(style.color || '');
        let bgNode = el;
        let bg = null;
        while (bgNode && !bg) {
          const c = parseRgb(window.getComputedStyle(bgNode).backgroundColor || '');
          if (c && window.getComputedStyle(bgNode).backgroundColor !== 'rgba(0, 0, 0, 0)') bg = c;
          bgNode = bgNode.parentElement;
        }
        if (fg && bg) {
          const ratio = contrastRatio(fg, bg);
          if (ratio < 3.2) {
            out.push({ kind: 'contrast', selector: cssPath(el), text, details: { contrast: Number(ratio.toFixed(2)) } });
          }
        }
      }
    }

    // spacing anomaly heuristic: overlaps between sibling-ish blocks
    const blocks = els.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 40 && r.height > 20;
    }).slice(0, 140);

    const intersect = (a, b) => {
      const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return x * y;
    };

    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < Math.min(blocks.length, i + 12); j++) {
        const a = blocks[i].getBoundingClientRect();
        const b = blocks[j].getBoundingClientRect();
        const area = intersect(a, b);
        if (!area) continue;
        const minArea = Math.min(a.width * a.height, b.width * b.height);
        if (area / minArea > 0.35) {
          out.push({
            kind: 'overlap',
            selector: `${cssPath(blocks[i])}  ⟂  ${cssPath(blocks[j])}`,
            text: ((blocks[i].textContent || '') + ' | ' + (blocks[j].textContent || '')).trim().slice(0, 140),
            details: { overlapRatio: Number((area / minArea).toFixed(2)) }
          });
        }
      }
    }

    return out;
  });

  await page.close();
  return { scenario, url, screenshot: path.relative(ROOT, screenshot), findings: [...stateFindings, ...scan], actionResults };
}

async function main() {
  await fs.mkdir(SHOTS_DIR, { recursive: true });

  const dev = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(DEV_PORT)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });

  let devLogs = '';
  dev.stdout.on('data', (d) => { devLogs += d.toString(); });
  dev.stderr.on('data', (d) => { devLogs += d.toString(); });

  try {
    await waitForServer(BASE_URL);
    const browser = await chromium.launch({ headless: true });
    const results = [];

    for (const scenario of scenarios) {
      try {
        results.push(await scanScenario(browser, scenario));
      } catch (error) {
        results.push({
          scenario,
          url: `${BASE_URL}${scenario.path}`,
          screenshot: null,
          findings: [{ kind: 'scanError', selector: scenario.path, text: '', details: { message: String(error.message || error) } }],
          actionResults: [],
        });
      }
    }

    await browser.close();

    const consolidated = [];
    for (const r of results) {
      for (const finding of r.findings) {
        if (finding.kind === 'scanError') {
          consolidated.push({
            severity: 'P1',
            category: 'scanError',
            title: `Scan failed: ${r.scenario.label}`,
            page: r.scenario.path,
            selector: finding.selector,
            evidence: { screenshot: r.screenshot, details: finding.details },
          });
          continue;
        }

        const severity = classifyFinding(finding.kind, finding.details || {});
        consolidated.push({
          severity,
          category: finding.kind,
          title: summarize(finding.kind),
          page: r.scenario.path,
          scenario: r.scenario.label,
          selector: finding.selector,
          excerpt: finding.text,
          evidence: {
            screenshot: r.screenshot,
            details: finding.details || {},
          },
        });
      }
    }

    consolidated.sort((a, b) => (severityRank[a.severity] - severityRank[b.severity]) || a.category.localeCompare(b.category));

    const jsonReport = {
      generatedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      scenarios: results.map((r) => ({
        key: r.scenario.key,
        label: r.scenario.label,
        path: r.scenario.path,
        screenshot: r.screenshot,
        actionResults: r.actionResults,
      })),
      summary: {
        totalFindings: consolidated.length,
        bySeverity: {
          P0: consolidated.filter((f) => f.severity === 'P0').length,
          P1: consolidated.filter((f) => f.severity === 'P1').length,
          P2: consolidated.filter((f) => f.severity === 'P2').length,
        },
      },
      findings: consolidated,
    };

    const jsonPath = path.join(REPORT_DIR, 'ui-radar-report.json');
    await fs.writeFile(jsonPath, JSON.stringify(jsonReport, null, 2), 'utf8');

    const topFindings = consolidated.slice(0, 30).map((f, i) =>
      `${i + 1}. [${f.severity}] ${f.title} — ${f.scenario} (${f.page})\n   - selector: ${f.selector}\n   - preuve: ${f.evidence?.screenshot || 'n/a'}\n   - détail: ${JSON.stringify(f.evidence?.details || {})}`
    ).join('\n');

    const md = `# UI QA Radar report\n\n- Generated at: ${jsonReport.generatedAt}\n- Base URL: ${BASE_URL}\n- Scenarios scanned: ${jsonReport.scenarios.length}\n- Findings: ${jsonReport.summary.totalFindings} (P0=${jsonReport.summary.bySeverity.P0}, P1=${jsonReport.summary.bySeverity.P1}, P2=${jsonReport.summary.bySeverity.P2})\n\n## Scanned pages/states\n${jsonReport.scenarios.map((s) => `- ${s.label} ( ${s.path} ) → ${s.screenshot || 'no screenshot'}`).join('\n')}\n\n## Top prioritized findings\n${topFindings || '- Aucun finding détecté'}\n\n## Notes\n- Heuristics-based MVP: peut inclure des faux positifs (troncature volontaire, overlays, etc.).\n- Utiliser le JSON pour trier/filtrer automatiquement en CI.\n`;

    await fs.writeFile(path.join(REPORT_DIR, 'ui-radar-report.md'), md.replaceAll('\u0000', '`'), 'utf8');
    console.log(`UI radar done. Report: ${path.relative(ROOT, jsonPath)}`);
  } finally {
    try {
      process.kill(-dev.pid, 'SIGTERM');
      setTimeout(() => {
        try { process.kill(-dev.pid, 'SIGKILL'); } catch {}
      }, 1200).unref();
    } catch {
      try { dev.kill('SIGTERM'); } catch {}
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
