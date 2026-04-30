const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, 'assets', 'sprites', 'animation-sweep-report.json');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (_) {}
    await sleep(300);
  }
  throw new Error(`Server not ready: ${url}`);
}

async function collectStates(page, ms, bucket) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const snap = await page.evaluate(() => window.__TEST__?.state?.() || null);
    if (snap) {
      for (const p of snap.players || []) bucket.hunters.add(p.state || 'unknown');
      for (const e of snap.enemies || []) {
        bucket.enemies.add(`${e.type}:${e.state}`);
        if (e.kind === 'boss' || e.type === 'boss') bucket.bosses.add(`${e.name || e.type}:${e.state}`);
      }
      if (snap.run?.boss?.id) bucket.bossMeta.add(`${snap.run.boss.id}:phase=${snap.run.boss.phase}`);
    }
    await sleep(50);
  }
}

(async () => {
  const server = spawn('node', ['scripts/static-server.mjs'], { cwd: ROOT, stdio: 'ignore' });
  let browser;
  try {
    await waitForServer('http://127.0.0.1:4173/');

    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });

    await page.waitForFunction(() => !!window.__TEST__, null, { timeout: 15000 });
    await page.evaluate(() => window.__TEST__.commands.oneForAll());
    await sleep(500);

    const seen = {
      hunters: new Set(),
      enemies: new Set(),
      bosses: new Set(),
      bossMeta: new Set(),
    };

    await collectStates(page, 1000, seen); // baseline idle

    // Hunter action sweep
    await page.keyboard.down('KeyD');
    await collectStates(page, 800, seen);
    await page.keyboard.up('KeyD');

    await page.keyboard.press('Space');
    await collectStates(page, 600, seen);

    await page.keyboard.press('KeyJ');
    await collectStates(page, 700, seen);

    await page.keyboard.press('KeyK');
    await collectStates(page, 900, seen);

    await page.keyboard.press('ShiftLeft');
    await collectStates(page, 700, seen);

    await page.keyboard.press('KeyE');
    await collectStates(page, 1200, seen);

    await page.evaluate(() => window.__TEST__.commands.fillSurge());
    await page.evaluate(() => window.__TEST__.commands.castUltimate(0));
    await collectStates(page, 1600, seen);

    // Damage/down/revive cycle
    await page.evaluate(() => window.__TEST__.commands.damagePlayer(0, 9999));
    await collectStates(page, 1400, seen);
    await page.evaluate(() => window.__TEST__.commands.revivePlayer(0));
    await collectStates(page, 1000, seen);

    // Enemy + boss sweep
    await page.evaluate(() => window.__TEST__.commands.enterCityBreach());
    await page.evaluate(() => window.__TEST__.commands.fastForwardZone());
    await collectStates(page, 5000, seen);

    for (let i = 0; i < 4; i += 1) {
      await page.evaluate(() => { window.__TEST__.commands.killAllEnemies(); window.__TEST__.commands.fastForwardZone(); });
      await collectStates(page, 2500, seen);
    }

    // Force to boss route if available
    await page.evaluate(() => {
      for (let i = 0; i < 6; i += 1) {
        window.__TEST__.commands.killAllEnemies();
        window.__TEST__.commands.fastForwardZone();
        window.__TEST__.commands.advanceRoute();
      }
    });
    await collectStates(page, 6000, seen);

    // Poke enemies for hurt/dead states
    for (let i = 0; i < 6; i += 1) {
      await page.evaluate(() => { window.__TEST__.commands.damageEnemy(0, 9999); window.__TEST__.commands.killAllEnemies(); });
      await collectStates(page, 900, seen);
    }

    const report = {
      generatedAt: new Date().toISOString(),
      hunterStatesSeen: [...seen.hunters].sort(),
      enemyStatesSeen: [...seen.enemies].sort(),
      bossStatesSeen: [...seen.bosses].sort(),
      bossMetaSeen: [...seen.bossMeta].sort(),
    };

    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
    console.log(`wrote ${REPORT_PATH}`);
    console.log(JSON.stringify(report, null, 2));
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
})();
