#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium, devices } from 'playwright';

const PORT = process.env.UI_BASELINE_PORT || String(43000 + Math.floor(Math.random() * 1000));
const BASE_URL = process.env.UI_BASELINE_BASE_URL || `http://127.0.0.1:${PORT}`;
const OUT_DIR = process.env.UI_BASELINE_OUT_DIR || 'docs/evidence/issue-132/baseline';
const CLEAN = process.argv.includes('--clean');

const desktop = { name: 'desktop', viewport: { width: 1440, height: 900 } };
const mobile = { name: 'mobile', ...devices['iPhone 13'] };

const targets = [
  { key: 'index', path: '/', settleMs: 1200 },
  { key: 'bestiary', path: '/bestiary', settleMs: 1200 },
  { key: 'summon', path: '/summon', settleMs: 1200 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await sleep(500);
  }
  throw new Error(`Timeout: serveur indisponible sur ${url}`);
}

function startDevServer() {
  const child = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', PORT, '--strictPort'], {
    stdio: 'inherit',
    env: process.env,
    detached: true,
  });
  return child;
}

async function safeClick(page, selectors) {
  for (const selector of selectors) {
    const loc = page.locator(selector).first();
    if (await loc.count()) {
      await loc.click({ timeout: 2000 });
      return true;
    }
  }
  return false;
}

async function captureSuite(browser, profile) {
  const context = await browser.newContext(profile.name === 'mobile' ? mobile : desktop);
  const page = await context.newPage();
  const profileDir = path.join(OUT_DIR, profile.name);
  await mkdir(profileDir, { recursive: true });

  for (const target of targets) {
    await page.goto(`${BASE_URL}${target.path}`, { waitUntil: 'networkidle' });
    await sleep(target.settleMs);
    await page.screenshot({ path: path.join(profileDir, `${target.key}.png`), fullPage: true });
  }

  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await sleep(1200);
  await safeClick(page, [
    'button:has-text("INVOQUER UN HÉROS")',
    'button:has-text("Invoquer")',
  ]);
  await sleep(800);
  await page.screenshot({ path: path.join(profileDir, 'index-summon-modal.png'), fullPage: true });

  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await sleep(1200);
  await safeClick(page, [
    'button:has-text("Forge de Fusion")',
    'button:has-text("Fusion")',
  ]);
  await sleep(1200);
  await page.screenshot({ path: path.join(profileDir, 'fusion.png'), fullPage: true });

  await context.close();
}

async function main() {
  if (CLEAN) {
    await rm(OUT_DIR, { recursive: true, force: true });
  }
  await mkdir(OUT_DIR, { recursive: true });

  const devServer = startDevServer();
  let failed = false;

  const shutdown = () => {
    try {
      if (devServer.pid) {
        process.kill(-devServer.pid, 'SIGTERM');
      }
    } catch {}
    if (!devServer.killed) {
      try { devServer.kill('SIGTERM'); } catch {}
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await waitForServer(BASE_URL);
    const browser = await chromium.launch({ headless: true });

    await captureSuite(browser, desktop);
    await captureSuite(browser, mobile);

    await browser.close();
    console.log(`✅ Baseline UI générée dans ${OUT_DIR}`);
  } catch (error) {
    failed = true;
    console.error('❌ Échec capture baseline UI:', error);
  } finally {
    shutdown();
  }

  if (failed) process.exit(1);
}

main();
