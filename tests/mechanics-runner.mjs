import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = loadPlaywright();

const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUT_DIR = 'test-results';

function assert(condition, message, details = undefined) {
  if (!condition) {
    const suffix = details === undefined ? '' : `\n${JSON.stringify(details, null, 2)}`;
    throw new Error(`${message}${suffix}`);
  }
}

function loadPlaywright() {
  try {
    return require('playwright');
  } catch {
    const cacheRoot = join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
    if (!existsSync(cacheRoot)) throw new Error('Playwright is not installed. Run: npx.cmd playwright --version');

    const cached = readdirSync(cacheRoot, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => join(cacheRoot, entry.name, 'node_modules', 'playwright'))
      .find(path => existsSync(path));
    if (!cached) throw new Error('Playwright is not installed. Run: npx.cmd playwright --version');
    return require(cached);
  }
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let i = 0; i < 50; i += 1) {
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) return;
    } catch {
      // Server is still booting.
    }
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${BASE_URL}`);
}

async function hold(page, key, ms = 100) {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
}

async function clearCurrentZone(page, zoneId) {
  await page.evaluate((id) => window.__TEST__.commands.enterZone(id), zoneId);
  await page.waitForFunction((id) => window.__TEST__.state().run.currentZone === id, zoneId, { timeout: 10000 });
  let bossSeen = false;

  for (let i = 0; i < 28; i += 1) {
    await page.evaluate(() => {
      window.__TEST__.commands.killAllEnemies();
      window.__TEST__.commands.fastForwardZone();
    });
    await page.waitForTimeout(250);

    const state = await page.evaluate(() => window.__TEST__.state());
    bossSeen = bossSeen || !!state.run.boss.name;
    if (state.run.currentZone === 'hub' || state.run.runComplete) break;
  }

  const postLoop = await page.evaluate(() => window.__TEST__.state());
  if (postLoop.run.currentZone !== 'hub' && !postLoop.run.runComplete) {
    await page.evaluate((id) => window.__TEST__.commands.forceZoneClear(id), zoneId);
  }

  await page.waitForFunction(
    () => window.__TEST__.state().run.currentZone === 'hub' || window.__TEST__.state().run.runComplete === true,
    null,
    { timeout: 20000 }
  );
  assert(bossSeen, `Boss did not appear while clearing ${zoneId}`);
}

const server = spawn(process.execPath, ['scripts/static-server.mjs'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let browser;

try {
  await mkdir(OUT_DIR, { recursive: true });
  await waitForServer();

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => {
    failedRequests.push(`${request.url()} ${request.failure()?.errorText || ''}`.trim());
  });

  await page.goto(`${BASE_URL}/?test=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__TEST__?.ready === true, null, { timeout: 10000 });
  await page.waitForTimeout(250);

  await hold(page, 'Digit2');
  await hold(page, 'Digit3');
  await hold(page, 'Digit4');
  await page.waitForFunction(() => window.__TEST__.state().players.length === 4);

  let state = await page.evaluate(() => window.__TEST__.state());
  assert(state.run.isCoOp, 'RunState did not enter co-op after joining slots', state.run);
  assert(
    JSON.stringify(state.players.map(player => player.hunterId)) === JSON.stringify(['dabik', 'benzu', 'sereisa', 'vesol']),
    'Joined hunters are not the expected Phase 3 roster',
    state.players
  );

  await page.evaluate(() => window.__TEST__.commands.enterZone('city-breach'));
  await page.waitForFunction(() => window.__TEST__.state().run.currentZone === 'city-breach');
  await page.waitForFunction(() => window.__TEST__.state().enemies.length > 0, null, { timeout: 10000 });

  await page.evaluate(() => window.__TEST__.commands.damagePlayer(0, 9999));
  await page.waitForFunction(() => window.__TEST__.state().players[0].state === 'DOWNED');
  state = await page.evaluate(() => window.__TEST__.state());
  assert(state.run.players[0].isDown, 'RunState did not record downed player', state.run.players[0]);
  assert(state.run.players[0].stats.timesDown === 1, 'Downed stat did not increment exactly once', state.run.players[0]);

  await page.keyboard.down('NumpadDecimal');
  await page.waitForTimeout(1700);
  await page.keyboard.up('NumpadDecimal');
  await page.waitForFunction(() => !window.__TEST__.state().players[0].isDown);
  state = await page.evaluate(() => window.__TEST__.state());
  assert(state.players[0].hp > 0, 'Revived player did not regain HP', state.players[0]);
  assert(!state.run.players[0].isDown, 'RunState still marks revived player as down', state.run.players[0]);

  await page.waitForFunction(() => ['IDLE', 'MOVE'].includes(window.__TEST__.state().players[0].state));
  await page.evaluate(() => {
    const player = window.__huntix.scene.hunters.players[0];
    const enemy = window.__huntix.scene.spawner.getActiveEnemies()[0];
    player.facing = 1;
    enemy.hp = 1;
    enemy.freeze(1);
    enemy.position.x = player.position.x + 0.9;
    enemy.position.y = player.combatCenterY;
  });
  await hold(page, 'KeyJ', 250);
  await page.waitForFunction(() => window.__TEST__.state().run.players[0].stats.kills >= 1);
  state = await page.evaluate(() => window.__TEST__.state());
  assert(state.run.players[0].xp > 0, 'Kill did not grant XP', state.run.players[0]);
  assert(state.run.players[0].essence > 0, 'Kill did not grant Essence', state.run.players[0]);
  assert(state.run.players[0].stats.damageDealt > 0, 'Damage dealt stat did not update', state.run.players[0]);

  await page.evaluate(() => window.__TEST__.commands.fillSurge());
  await page.waitForFunction(() => window.__TEST__.state().players.every(player => ['IDLE', 'MOVE'].includes(player.state)));
  const ultResults = await page.evaluate(() => [0, 1, 2, 3].map(i => window.__TEST__.commands.castUltimate(i)));
  assert(JSON.stringify(ultResults) === JSON.stringify([true, true, true, true]), 'Not all ultimates fired', ultResults);
  state = await page.evaluate(() => window.__TEST__.state());
  assert(state.players.every(player => player.surge === 0), 'Ultimates did not consume all surge', state.players);
  assert(state.run.players.every(player => player.stats.spellsCast >= 1), 'Ultimate casts did not record spell stats', state.run.players);

  await clearCurrentZone(page, 'city-breach');
  state = await page.evaluate(() => window.__TEST__.state());
  assert(state.run.zonesCleared >= 1, 'City Breach did not increment zones cleared', state.run);
  assert(state.run.currentZone === 'hub', 'City Breach did not return to hub', state.run);

  for (const zoneId of ['ruin-den', 'shadow-core', 'thunder-spire']) {
    await clearCurrentZone(page, zoneId);
    state = await page.evaluate(() => window.__TEST__.state());
    assert(state.run.zonesCleared >= ['ruin-den', 'shadow-core', 'thunder-spire'].indexOf(zoneId) + 2, `${zoneId} did not increment zones cleared`, state.run);
  }

  await page.waitForFunction(() => window.__TEST__.state().run.runComplete === true, null, { timeout: 20000 });
  state = await page.evaluate(() => window.__TEST__.state());
  assert(state.run.runComplete, 'Run did not complete after Thunder Spire', state.run);
  assert(state.mode === 'END_SCREEN', 'End screen did not activate after final boss', state);

  await page.screenshot({ path: join(OUT_DIR, 'phase4-run.png') });

  const relevantConsoleErrors = consoleErrors.filter(text => !text.includes('vibej.am'));
  const relevantRequestFailures = failedRequests.filter(text => !text.includes('vibej.am'));
  assert(pageErrors.length === 0, 'Browser page errors were reported', pageErrors);
  assert(relevantConsoleErrors.length === 0, 'Browser console errors were reported', relevantConsoleErrors);
  assert(relevantRequestFailures.length === 0, 'Browser request failures were reported', relevantRequestFailures);

  process.stdout.write('PASS phase4 mechanics smoke\n');
} finally {
  if (browser) await browser.close();
  server.kill();
}
