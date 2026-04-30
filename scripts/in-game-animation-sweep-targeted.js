const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, 'assets', 'sprites', 'animation-sweep-targeted-report.json');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { const r = await fetch(url); if (r.ok) return true; } catch (_) {}
    await sleep(250);
  }
  throw new Error('server timeout');
}

async function sample(page, ms, seen) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const s = await page.evaluate(() => window.__TEST__?.state?.() || null);
    if (s) {
      for (const p of s.players || []) seen.hunter.add(p.state || 'unknown');
      for (const e of s.enemies || []) seen.enemy.add(`${e.type}:${e.state}`);
    }
    await sleep(40);
  }
}

(async () => {
  const server = spawn('node', ['scripts/static-server.mjs'], { cwd: ROOT, stdio: 'ignore' });
  let browser;
  try {
    await waitForServer('http://127.0.0.1:4173/');
    browser = await chromium.launch({ headless: true });
    const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.__TEST__, null, { timeout: 15000 });

    await page.evaluate(() => window.__TEST__.commands.oneForAll());
    await page.evaluate(() => window.__TEST__.commands.enterCityBreach());
    await page.evaluate(() => window.__TEST__.commands.fastForwardZone());
    await sleep(500);

    const seen = { hunter: new Set(), enemy: new Set() };
    await sample(page, 800, seen);

    await page.keyboard.press('KeyK');
    await sample(page, 900, seen);

    await page.evaluate(() => window.__TEST__.commands.castAdvanced(0));
    await sample(page, 1400, seen);

    await page.keyboard.press('KeyF');
    await sample(page, 800, seen);

    await page.evaluate(() => window.__TEST__.commands.damagePlayer(0, 99999));
    await sample(page, 900, seen);
    await page.evaluate(() => window.__TEST__.commands.revivePlayer(0));
    await sample(page, 1200, seen);

    for (let i = 0; i < 6; i += 1) {
      await page.evaluate(() => { window.__TEST__.commands.killAllEnemies(); window.__TEST__.commands.fastForwardZone(); window.__TEST__.commands.advanceRoute(); });
      await sample(page, 700, seen);
    }
    for (let i = 0; i < 10; i += 1) {
      await page.evaluate(() => window.__TEST__.commands.damageEnemy(0, 300));
      await sample(page, 200, seen);
    }

    const hs = seen.hunter;
    const es = seen.enemy;
    const checks = [
      ['ATTACK_HEAVY', hs.has('ATTACK_HEAVY')],
      ['SPELL_ADVANCED', hs.has('SPELL_ADVANCED')],
      ['DOWNED/DEAD_PLAYER', hs.has('DOWNED') || hs.has('DEAD')],
      ['REVIVE', hs.has('REVIVE')],
      ['WEAPON_SWAP', hs.has('WEAPON_SWAP')],
      ['BOSS:ATTACK', [...es].some(s => s.includes('BOSS:ATTACK'))],
      ['BOSS:HURT', [...es].some(s => s.includes('BOSS:HURT'))],
    ].map(([state, pass]) => ({ state, pass }));

    const report = {
      generatedAt: new Date().toISOString(),
      checks,
      hunterStatesSeen: [...hs].sort(),
      enemyStatesSeen: [...es].sort(),
    };
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
})();
