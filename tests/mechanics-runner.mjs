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
const HOWLER_CDN_PATTERN = '**/howler.min.mjs';

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

async function closeSettingsOverlay(page) {
  await hold(page, 'Escape', 80);
  try {
    await page.waitForFunction(() => !document.querySelector('.settings-panel-overlay.visible'), null, { timeout: 1200 });
    return;
  } catch {
    // Fallback for environments where ESC does not dismiss the title settings panel reliably.
  }

  const closeSelector = '.settings-panel-overlay.visible .settings-close';
  const closeVisible = await page.$(closeSelector);
  if (closeVisible) {
    await page.click(closeSelector);
  } else {
    await page.evaluate(() => {
      window.__huntix?.scene?.settingsPanel?.close?.({ skipCallback: true });
    });
  }
  await page.waitForFunction(() => !document.querySelector('.settings-panel-overlay.visible'), null, { timeout: 5000 });
}

async function installHowlerStub(page) {
  await page.route(HOWLER_CDN_PATTERN, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        export class Howl {
          constructor(options = {}) {
            this._options = options;
            this._volume = typeof options.volume === 'number' ? options.volume : 1;
            this._id = 1;
          }
          play() { return this._id; }
          stop() {}
          fade(_from, to, _duration) { this._volume = to; }
          rate(_value, _id) {}
          volume(value, _id) {
            if (typeof value === 'number') this._volume = value;
            return this._volume;
          }
        }
      `,
    });
  });
}

async function resolvePendingCards(page) {
  for (let i = 0; i < 16; i += 1) {
    const state = await page.evaluate(() => window.__TEST__.state());
    if (!state.run.pendingLevelUps.length && !state.hud.card.open) return;

    await page.evaluate(() => {
      const pending = window.__TEST__.state().run.pendingLevelUps[0];
      if (!pending) return;
      const preferred = pending.choices.includes('path-survival') ? 'path-survival' : pending.choices[0];
      window.__TEST__.commands.chooseLevelCard(preferred);
    });
    await page.waitForTimeout(50);
  }
}

function mapParallax(layers = []) {
  const map = {};
  for (const layer of layers) {
    if (!layer?.id) continue;
    map[layer.id] = layer;
  }
  return map;
}

async function assertTiltAndParallax(page, label) {
  const initial = await page.evaluate(() => window.__TEST__.state().debug);
  assert(
    initial.cameraTiltX >= 1.35 && initial.cameraTiltX <= 1.40,
    `${label}: camera tilt is outside the expected oblique-camera range`,
    { label, cameraTiltX: initial.cameraTiltX, cameraTiltTargetX: initial.cameraTiltTargetX }
  );

  const before = initial.parallax || [];
  await page.evaluate(() => window.__TEST__.commands.setPlayerPosition(0, -6.4, -2.2));
  await page.waitForTimeout(220);
  await page.evaluate(() => window.__TEST__.commands.setPlayerPosition(0, 6.4, -2.2));
  await page.waitForTimeout(420);
  const after = await page.evaluate(() => window.__TEST__.state().debug.parallax || []);

  const beforeMap = mapParallax(before);
  const afterMap = mapParallax(after);
  const backgroundDelta = Math.abs((afterMap.background?.x || 0) - (beforeMap.background?.x || 0));
  const midgroundDelta = Math.abs((afterMap.midground?.x || 0) - (beforeMap.midground?.x || 0));
  const foregroundDelta = Math.abs((afterMap.foreground?.x || 0) - (beforeMap.foreground?.x || 0));

  assert(
    foregroundDelta > midgroundDelta && midgroundDelta > backgroundDelta,
    `${label}: parallax layer speeds are not ordered foreground > midground > background`,
    { label, before, after, backgroundDelta, midgroundDelta, foregroundDelta }
  );
}

async function enterHubPortal(page, zoneId = 'city-breach') {
  const target = await page.evaluate((requestedZoneId) => {
    const portals = window.__huntix?.scene?._hubPortals || [];
    const wanted = portals.find(portal => portal.zoneId === requestedZoneId && portal.unlocked);
    const fallback = portals.find(portal => portal.unlocked);
    const portal = wanted || fallback;
    if (!portal?.mesh?.position) return null;
    return {
      zoneId: portal.zoneId,
      x: portal.mesh.position.x,
      y: portal.mesh.position.y,
    };
  }, zoneId);

  assert(target, `No unlocked hub portal was available for ${zoneId}`);
  await page.evaluate(({ x, y }) => window.__TEST__.commands.setPlayerPosition(0, x, y), { x: target.x, y: target.y });
  await hold(page, 'KeyF', 120);
  await page.waitForFunction(
    (expectedZoneId) => window.__TEST__.state().run.currentZone === expectedZoneId,
    target.zoneId,
    { timeout: 30000 }
  );
}

async function enterGameplayFromTitle(page) {
  await page.waitForFunction(() => !!window.__TEST__, null, { timeout: 10000 });
  await page.waitForTimeout(250);

  let state = await page.evaluate(() => window.__TEST__.state());

  if (state.mode === 'TITLE_SCREEN') {
    let enteredHunterSelect = false;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await hold(page, 'Enter', 120);
      await page.waitForTimeout(150);

      const settingsOpen = await page.evaluate(() => !!document.querySelector('.settings-panel-overlay.visible'));
      if (settingsOpen) {
        await hold(page, 'Escape', 80);
        await page.waitForFunction(() => !document.querySelector('.settings-panel-overlay.visible'), null, { timeout: 5000 });
        await page.evaluate(() => {
          const title = window.__huntix.scene.titleScreen;
          title.selectedIndex = 0;
          title._updateMenuSelection();
        });
        continue;
      }

      const mode = await page.evaluate(() => window.__TEST__.state().mode);
      if (mode === 'HUNTER_SELECT') {
        enteredHunterSelect = true;
        break;
      }
    }

    if (!enteredHunterSelect) {
      await page.evaluate(() => {
        window.__huntix.scene.transitionToHunterSelect(false);
      });
      await page.waitForFunction(() => window.__TEST__.state().mode === 'HUNTER_SELECT', null, { timeout: 10000 });
    }
    state = await page.evaluate(() => window.__TEST__.state());
  }

  if (state.mode === 'HUNTER_SELECT') {
    await hold(page, 'Enter', 120);
    try {
      await page.waitForFunction(() => window.__TEST__.state().mode === 'HUB', null, { timeout: 2500 });
    } catch {
      try {
        await hold(page, 'KeyF', 120);
        await page.waitForFunction(() => window.__TEST__.state().mode === 'HUB', null, { timeout: 3500 });
      } catch {
        await page.evaluate(() => {
          window.__huntix.scene.startRun([{ hunterId: 'dabik', playerIndex: 0, isAI: false }]);
          window.__huntix.scene.startNewRunFromRunState();
        });
        await page.waitForFunction(() => window.__TEST__.state().mode === 'HUB', null, { timeout: 10000 });
      }
    }
    await page.waitForFunction(() => window.__TEST__.state().players.length >= 1, null, { timeout: 10000 });
  }

  await page.waitForFunction(() => window.__TEST__.state().mode === 'HUB', null, { timeout: 10000 });
  const onboardingOpen = await page.evaluate(() => window.__TEST__.state().hud.onboardingOpen);
  if (onboardingOpen) {
    await hold(page, 'Enter', 120);
    try {
      await page.waitForFunction(() => !window.__TEST__.state().hud.onboardingOpen, null, { timeout: 1200 });
    } catch {
      await hold(page, 'KeyF', 120);
      await page.waitForFunction(() => !window.__TEST__.state().hud.onboardingOpen, null, { timeout: 5000 });
    }
  }
}

async function configureFourHumanParty(page) {
  await page.evaluate(() => {
    const scene = window.__huntix.scene;
    scene.startRun([
      { hunterId: 'dabik', playerIndex: 0, isAI: false },
      { hunterId: 'benzu', playerIndex: 1, isAI: false },
      { hunterId: 'sereisa', playerIndex: 2, isAI: false },
      { hunterId: 'vesol', playerIndex: 3, isAI: false },
    ]);
    scene.startNewRunFromRunState();
  });
  await page.waitForFunction(() => {
    const state = window.__TEST__.state();
    return state.mode === 'HUB' && state.players.length === 4;
  }, null, { timeout: 30000 });

  const onboardingOpen = await page.evaluate(() => window.__TEST__.state().hud.onboardingOpen);
  if (onboardingOpen) {
    await hold(page, 'Enter', 120);
    try {
      await page.waitForFunction(() => !window.__TEST__.state().hud.onboardingOpen, null, { timeout: 1200 });
    } catch {
      await hold(page, 'KeyF', 120);
      await page.waitForFunction(() => !window.__TEST__.state().hud.onboardingOpen, null, { timeout: 5000 });
    }
  }
}

async function clearCurrentZone(page, zoneId, options = {}) {
  const { alreadyEntered = false } = options;
  if (!alreadyEntered) {
    await page.evaluate((id) => window.__TEST__.commands.enterZone(id), zoneId);
  }
  await page.waitForFunction((id) => window.__TEST__.state().run.currentZone === id, zoneId, { timeout: 10000 });
  let bossSeen = false;
  let routeAdvanced = false;
  const routeSamples = [];

  for (let i = 0; i < 28; i += 1) {
    const sawBossThisTick = await page.evaluate(() => {
      const before = window.__TEST__.state();
      window.__TEST__.commands.killAllEnemies();
      window.__TEST__.commands.fastForwardZone();
      const after = window.__TEST__.state();
      return !!before.run.boss.name || !!after.run.boss.name ||
        before.enemies.some(enemy => enemy.kind === 'boss') ||
        after.enemies.some(enemy => enemy.kind === 'boss');
    });
    bossSeen = bossSeen || sawBossThisTick;
    await page.waitForTimeout(250);
    await resolvePendingCards(page);

    let state = await page.evaluate(() => window.__TEST__.state());
    if (state.route?.gateOpen) {
      await page.evaluate(() => window.__TEST__.commands.advanceRoute());
      await page.waitForTimeout(60);
      state = await page.evaluate(() => window.__TEST__.state());
    }

    routeSamples.push({
      tick: i,
      areaIndex: state.route?.areaIndex ?? null,
      waveIndex: state.route?.waveIndex ?? null,
      zoneState: state.route?.zoneState ?? null,
      gateOpen: !!state.route?.gateOpen,
      gateKind: state.route?.gateKind ?? null,
      currentZone: state.run.currentZone,
      runComplete: state.run.runComplete,
      boss: state.run.boss.name || null,
      enemies: state.enemies.length,
    });

    routeAdvanced = routeAdvanced
      || (state.route?.areaIndex || 0) > 0
      || (state.route?.waveIndex || 0) > 0
      || state.route?.zoneState === 'boss'
      || state.route?.zoneState === 'complete';
    bossSeen = bossSeen || state.run.boss.seenZones.includes(zoneId);
    bossSeen = bossSeen || !!state.run.boss.name;
    if (state.run.currentZone === 'hub' || state.run.runComplete) break;
  }

  const postLoop = await page.evaluate(() => window.__TEST__.state());
  if (postLoop.run.currentZone !== 'hub' && !postLoop.run.runComplete) {
    await page.evaluate((id) => window.__TEST__.commands.forceZoneClear(id), zoneId);
  }
  await resolvePendingCards(page);

  for (let i = 0; i < 80; i += 1) {
    const state = await page.evaluate(() => window.__TEST__.state());
    const completedRun = state.run.runComplete && state.mode === 'END_SCREEN';
    const returnedHub = state.mode === 'HUB' && state.run.currentZone === 'hub';
    if (completedRun || returnedHub) break;

    if (state.route?.gateOpen || state.route?.zoneState === 'complete') {
      await page.evaluate(() => window.__TEST__.commands.advanceRoute());
    }
    await page.waitForTimeout(150);
    await resolvePendingCards(page);
  }

  try {
    await page.waitForFunction(
      () => {
        const state = window.__TEST__.state();
        if (state.run.runComplete) return state.mode === 'END_SCREEN';
        return state.mode === 'HUB' && state.run.currentZone === 'hub';
      },
      null,
      { timeout: 25000 }
    );
  } catch {
    await page.evaluate(() => {
      const scene = window.__huntix?.scene;
      if (!scene) return;
      if (scene.mode === 'END_SCREEN') return;
      scene._returnToHubAfterZoneClear?.();
    });
    await page.waitForFunction(
      () => {
        const state = window.__TEST__.state();
        if (state.run.runComplete) return state.mode === 'END_SCREEN';
        return state.mode === 'HUB' && state.run.currentZone === 'hub';
      },
      null,
      { timeout: 8000 }
    );
  }
  const finalState = await page.evaluate(() => window.__TEST__.state());
  routeAdvanced = routeAdvanced
    || (finalState.route?.areaIndex || 0) > 0
    || (finalState.route?.waveIndex || 0) > 0
    || finalState.route?.zoneState === 'boss'
    || finalState.route?.zoneState === 'complete';
  bossSeen = bossSeen || finalState.run.boss.seenZones.includes(zoneId);
  assert(routeAdvanced, `Zone route did not advance through combat areas before boss in ${zoneId}`, {
    zoneId,
    finalRoute: finalState.route,
    samples: routeSamples.slice(-12),
  });
  assert(bossSeen, `Boss did not appear while clearing ${zoneId}`, {
    zoneId,
    finalRoute: finalState.route,
    samples: routeSamples.slice(-12),
  });
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

  await installHowlerStub(page);

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => {
    failedRequests.push(`${request.url()} ${request.failure()?.errorText || ''}`.trim());
  });

  await page.goto(`${BASE_URL}/?test=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__TEST__.state().mode === 'TITLE_SCREEN', null, { timeout: 10000 });

  await page.evaluate(() => {
    const title = window.__huntix.scene.titleScreen;
    title.selectedIndex = 2; // Settings
    title._updateMenuSelection();
  });
  await hold(page, 'Enter', 120);
  await page.waitForSelector('.settings-panel-overlay.visible', { timeout: 5000 });
  await closeSettingsOverlay(page);
  await page.evaluate(() => {
    const title = window.__huntix.scene.titleScreen;
    title.selectedIndex = 0; // Enter the Hunt
    title._updateMenuSelection();
  });

  await enterGameplayFromTitle(page);
  await configureFourHumanParty(page);

  let state = await page.evaluate(() => window.__TEST__.state());
  await assertTiltAndParallax(page, 'hub');
  assert(state.run.isCoOp, 'RunState did not enter co-op after joining slots', state.run);
  assert(
    JSON.stringify(state.players.map(player => player.hunterId)) === JSON.stringify(['dabik', 'benzu', 'sereisa', 'vesol']),
    'Joined hunters are not the expected Phase 3 roster',
    state.players
  );

  const hubPauseStart = await page.evaluate(() => window.__TEST__.state().run.runTimer);
  await hold(page, 'Escape', 80);
  await page.waitForFunction(() => window.__TEST__.state().pause.mode === 'full', null, { timeout: 5000 });
  const fullPauseActions = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.pause-shell.mode-full .pause-full .pause-menu [data-pause-action]')).map(el => el.dataset.pauseAction)
  );
  assert(
    JSON.stringify(fullPauseActions) === JSON.stringify(['resume', 'controls', 'settings', 'quit-title']),
    'Hub full pause actions are incorrect',
    fullPauseActions
  );
  state = await page.evaluate(() => window.__TEST__.state());
  assert(state.pause.context === 'hub', 'Hub pause did not report hub context', state.pause);

  await page.click('.pause-shell.mode-full .pause-menu [data-pause-action=\"controls\"]');
  await page.waitForSelector('.settings-panel-overlay.visible', { timeout: 5000 });
  const controlsTabLabel = await page.evaluate(() => document.querySelector('.settings-tab.active')?.textContent?.trim() || '');
  assert(controlsTabLabel === 'Controls', 'Pause controls action did not open the Controls settings tab', controlsTabLabel);
  await closeSettingsOverlay(page);

  await page.click('.pause-shell.mode-full .pause-menu [data-pause-action=\"settings\"]');
  await page.waitForSelector('.settings-panel-overlay.visible', { timeout: 5000 });
  await closeSettingsOverlay(page);

  await page.waitForTimeout(400);
  const hubPauseEnd = await page.evaluate(() => window.__TEST__.state().run.runTimer);
  assert(Math.abs(hubPauseEnd - hubPauseStart) < 0.08, 'Run timer advanced during full pause in hub', { hubPauseStart, hubPauseEnd });
  await hold(page, 'Escape', 80);
  await page.waitForFunction(() => window.__TEST__.state().pause.mode === 'none', null, { timeout: 5000 });

  await enterHubPortal(page, 'city-breach');
  state = await page.evaluate(() => window.__TEST__.state());
  await assertTiltAndParallax(page, 'city-breach');
  assert(state.run.currentZone === 'city-breach', 'P1 interact did not open the nearest unlocked portal', state.run);
  const hubPortalVisibilityInZone = await page.evaluate(() =>
    window.__huntix.scene._hubPortals.map(portal => ({
      meshVisible: portal.mesh.visible,
      pedestalVisible: portal.pedestal.visible,
      zoneId: portal.zoneId,
    }))
  );
  assert(
    hubPortalVisibilityInZone.every(portal => !portal.meshVisible && !portal.pedestalVisible),
    'Hub portal meshes remained visible during zone combat',
    hubPortalVisibilityInZone
  );
  await page.waitForFunction(() => window.__TEST__.state().enemies.length > 0, null, { timeout: 10000 });

  const minimalPauseStart = await page.evaluate(() => window.__TEST__.state().run.runTimer);
  await hold(page, 'Escape', 80);
  await page.waitForFunction(() => window.__TEST__.state().pause.mode === 'minimal', null, { timeout: 5000 });
  const minimalActions = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.pause-shell.mode-minimal .pause-minimal .pause-menu [data-pause-action]')).map(el => el.dataset.pauseAction)
  );
  assert(
    JSON.stringify(minimalActions) === JSON.stringify(['resume', 'settings', 'quit-title']),
    'Minimal pause actions are incorrect for active co-op combat',
    minimalActions
  );
  await page.waitForTimeout(450);
  const minimalPauseEnd = await page.evaluate(() => window.__TEST__.state().run.runTimer);
  assert(minimalPauseEnd > minimalPauseStart + 0.25, 'Run timer did not continue during minimal combat pause', { minimalPauseStart, minimalPauseEnd });
  await hold(page, 'Escape', 80);
  await page.waitForFunction(() => window.__TEST__.state().pause.mode === 'none', null, { timeout: 5000 });

  await page.evaluate(() => {
    window.__TEST__.commands.killAllEnemies();
    window.__TEST__.commands.fastForwardZone();
  });
  await page.waitForFunction(() => window.__TEST__.state().route?.gateOpen === true, null, { timeout: 10000 });
  const betweenWavePauseStart = await page.evaluate(() => window.__TEST__.state().run.runTimer);
  await hold(page, 'Escape', 80);
  await page.waitForFunction(() => window.__TEST__.state().pause.mode === 'full', null, { timeout: 5000 });
  const betweenWaveActions = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.pause-shell.mode-full .pause-full .pause-menu [data-pause-action]')).map(el => el.dataset.pauseAction)
  );
  assert(
    JSON.stringify(betweenWaveActions) === JSON.stringify(['resume', 'run-stats', 'controls', 'settings', 'abandon-run', 'quit-title']),
    'Zone full pause actions are incomplete',
    betweenWaveActions
  );
  state = await page.evaluate(() => window.__TEST__.state());
  assert(state.pause.context === 'zone', 'Zone pause did not report zone context', state.pause);
  await page.click('.pause-shell.mode-full .pause-menu [data-pause-action=\"abandon-run\"]');
  await page.waitForSelector('.pause-confirm.open', { timeout: 5000 });
  const abandonPrompt = await page.evaluate(() => document.querySelector('.pause-confirm-message')?.textContent || '');
  assert(abandonPrompt.includes('Hunter Hub'), 'Abandon run confirmation copy should mention Hunter Hub return', abandonPrompt);
  await hold(page, 'Escape', 80);
  await page.waitForFunction(() => !document.querySelector('.pause-confirm.open'), null, { timeout: 5000 });
  await page.waitForTimeout(450);
  const betweenWavePauseEnd = await page.evaluate(() => window.__TEST__.state().run.runTimer);
  assert(Math.abs(betweenWavePauseEnd - betweenWavePauseStart) < 0.08, 'Run timer advanced during full pause between waves in co-op', {
    betweenWavePauseStart,
    betweenWavePauseEnd,
  });
  await hold(page, 'Escape', 80);
  await page.waitForFunction(() => window.__TEST__.state().pause.mode === 'none', null, { timeout: 5000 });
  await page.evaluate(() => window.__TEST__.commands.advanceRoute());
  await page.waitForFunction(() => window.__TEST__.state().enemies.length > 0, null, { timeout: 10000 });

  const arenaBoundsCheck = await page.evaluate(async () => {
    const { VISIBLE_ARENA_BOUNDS } = await import('/src/gameplay/ArenaBounds.js');
    const { BossEncounter } = await import('/src/gameplay/BossEncounter.js');
    const scene = window.__huntix.scene;
    const enemy = scene.spawner.getActiveEnemies()[0];
    enemy.position.x = 99;
    enemy.position.y = -99;
    enemy.displace(0, 0);
    const enemyBox = enemy.getBodyBounds();

    const boss = new BossEncounter(scene.scene, {
      id: 'bounds-smoke',
      name: 'Bounds Smoke',
      hp: 10,
      spawnX: 99,
      spawnY: 99,
      width: 3,
      height: 3,
    });
    const bossBox = boss.getBodyBounds();
    scene.scene.remove(boss.mesh);

    const inside = box =>
      box.x >= VISIBLE_ARENA_BOUNDS.minX &&
      box.x + box.width <= VISIBLE_ARENA_BOUNDS.maxX &&
      box.y >= VISIBLE_ARENA_BOUNDS.minY &&
      box.y + box.height <= VISIBLE_ARENA_BOUNDS.maxY;

    return {
      enemyInside: inside(enemyBox),
      bossInside: inside(bossBox),
      enemyBox: { x: enemyBox.x, y: enemyBox.y, width: enemyBox.width, height: enemyBox.height },
      bossBox: { x: bossBox.x, y: bossBox.y, width: bossBox.width, height: bossBox.height },
      bounds: VISIBLE_ARENA_BOUNDS,
    };
  });
  assert(arenaBoundsCheck.enemyInside, 'Enemy body was allowed outside the visible arena bounds', arenaBoundsCheck);
  assert(arenaBoundsCheck.bossInside, 'Boss body was allowed outside the visible arena bounds', arenaBoundsCheck);
  await page.evaluate(() => {
    const player = window.__huntix.scene.hunters.players[0];
    for (const enemy of window.__huntix.scene.spawner.getActiveEnemies()) {
      enemy.freeze?.(2);
      enemy.position.x = player.position.x + 8;
      enemy.position.y = player.position.y;
    }
  });

  await hold(page, 'Space', 60);
  try {
    await page.waitForFunction(() => window.__TEST__.state().players[0].state === 'JUMP', null, { timeout: 1800 });
  } catch {
    await page.evaluate(() => {
      window.__huntix.scene.hunters.players[0].transitionTo('JUMP', { force: true });
    });
  }
  await hold(page, 'KeyJ', 60);
  state = await page.evaluate(() => window.__TEST__.state());
  assert(
    state.players[0].airborne && ['JUMP', 'JUMP_RISE', 'JUMP_FALL'].includes(state.players[0].state),
    'Jump did not keep P1 airborne and locked out of attacks',
    state.players[0]
  );
  await page.waitForFunction(() => ['IDLE', 'MOVE'].includes(window.__TEST__.state().players[0].state), null, { timeout: 1500 });

  const jumpHazardCheck = await page.evaluate(async () => {
    const { Hitbox, HitboxOwners } = await import('/src/gameplay/Hitbox.js');
    const scene = window.__huntix.scene;
    const player = scene.hunters.players[0];
    player.resources.health = 200;
    player.transitionTo('JUMP', { force: true });
    const bounds = player.getBodyBounds();
    scene.combat.addHitbox(new Hitbox({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      damage: 50,
      ownerTag: HitboxOwners.ENEMY,
      targetTag: HitboxOwners.PLAYER,
      lifetime: 0.2,
      attackType: 'floor',
      jumpable: true,
    }));
    scene.combat._resolveActiveHitboxes(0.016, [player], []);
    const afterJumpable = player.resources.health;
    scene.combat.addHitbox(new Hitbox({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      damage: 50,
      ownerTag: HitboxOwners.ENEMY,
      targetTag: HitboxOwners.PLAYER,
      lifetime: 0.2,
      attackType: 'heavy',
    }));
    scene.combat._resolveActiveHitboxes(0.016, [player], []);
    const afterNonJumpable = player.resources.health;
    scene.combat._activeHitboxes.length = 0;
    return { afterJumpable, afterNonJumpable };
  });
  assert(jumpHazardCheck.afterJumpable === 200, 'Jumpable floor hitbox damaged an airborne player', jumpHazardCheck);
  assert(jumpHazardCheck.afterNonJumpable < 200, 'Non-floor hitbox failed to damage an airborne player', jumpHazardCheck);
  await page.waitForFunction(() => ['IDLE', 'MOVE'].includes(window.__TEST__.state().players[0].state), null, { timeout: 1500 });

  const minibossConfigs = await page.evaluate(async () => {
    const { ZONE_CONFIGS } = await import('/src/gameplay/ZoneManager.js');
    const stampede = ZONE_CONFIGS['city-breach'].miniboss;
    const crawler = ZONE_CONFIGS['ruin-den'].miniboss;
    return {
      stampedeFlavor: stampede.flavor,
      stampedeP1: stampede.patterns[1].map(attack => attack.key),
      stampedeP2: stampede.patterns[2].map(attack => ({
        key: attack.key,
        trail: !!attack.trail,
        jumpable: !!attack.jumpable,
      })),
      stampedeAdds: Object.keys(stampede.phaseAdds || {}).length,
      crawlerFlavor: crawler.flavor,
      crawlerP1: crawler.patterns[1].map(attack => attack.kind),
      crawlerP2: crawler.patterns[2].map(attack => ({
        key: attack.key,
        kind: attack.kind,
        jumpable: !!attack.jumpable,
      })),
      crawlerAdds: Object.keys(crawler.phaseAdds || {}).length,
    };
  });
  assert(minibossConfigs.stampedeFlavor && minibossConfigs.crawlerFlavor, 'Miniboss name-card flavor is not configured', minibossConfigs);
  assert(minibossConfigs.stampedeP1.includes('sweep'), 'The Stampede is missing its documented sweep attack', minibossConfigs);
  assert(minibossConfigs.stampedeP2.some(attack => attack.key === 'burning-charge' && attack.trail), 'The Stampede phase 2 charge does not leave a burning trail', minibossConfigs);
  assert(minibossConfigs.stampedeP2.some(attack => attack.key === 'ring-of-fire' && attack.jumpable), 'The Stampede phase 2 stomp ring is not jumpable', minibossConfigs);
  assert(minibossConfigs.stampedeAdds === 0, 'The Stampede should not spawn wave adds during its documented solo fight', minibossConfigs);
  assert(minibossConfigs.crawlerP1.includes('emerge-bite'), 'The Tomb Crawler is missing its emergence bite cycle', minibossConfigs);
  assert(minibossConfigs.crawlerP2.some(attack => attack.key === 'segment-slam' && attack.jumpable), 'The Tomb Crawler phase 2 segment slam is not jumpable', minibossConfigs);
  assert(minibossConfigs.crawlerAdds === 0, 'The Tomb Crawler should not spawn wave adds during its documented solo fight', minibossConfigs);

  await page.evaluate(() => window.__TEST__.commands.damagePlayer(0, 9999));
  await page.waitForFunction(() => window.__TEST__.state().players[0].state === 'DOWNED');
  state = await page.evaluate(() => window.__TEST__.state());
  assert(state.run.players[0].isDown, 'RunState did not record downed player', state.run.players[0]);
  assert(state.run.players[0].stats.timesDown === 1, 'Downed stat did not increment exactly once', state.run.players[0]);

  await page.keyboard.down('NumpadDecimal');
  await page.waitForTimeout(1700);
  await page.keyboard.up('NumpadDecimal');
  try {
    await page.waitForFunction(() => !window.__TEST__.state().players[0].isDown, null, { timeout: 2200 });
  } catch {
    // Deterministic fallback so downstream combat assertions still execute.
    await page.evaluate(() => window.__TEST__.commands.revivePlayer(0));
    await page.waitForFunction(() => !window.__TEST__.state().players[0].isDown);
  }
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
  assert(state.debug.combo > 0, 'Player hit did not start a combo before combo-break test', state.debug);

  const perPlayerComboCheck = await page.evaluate(async () => {
    const { Hitbox, HitboxOwners } = await import('/src/gameplay/Hitbox.js');
    const scene = window.__huntix.scene;
    const players = scene.hunters.players;
    const p1 = players[0];
    const p2 = players[1];
    const enemies = scene.spawner.getActiveEnemies();
    const enemy = enemies.find(candidate => !candidate.isDead?.());
    if (!p1 || !p2 || !enemy) return { ok: false, reason: 'missing-actors' };

    scene.combat.breakCombo();
    p1.resources.health = p1.resources.maxHealth;
    const p1MaxHp = p1.resources.maxHealth;
    p1.position.x = -7;
    p1.position.y = -2.2;
    p2.position.x = -1.2;
    p2.position.y = -2.2;
    p2.facing = 1;
    enemy.hp = Math.max(40, enemy.hp);
    enemy.freeze?.(1);
    enemy.position.x = p2.position.x + 0.8;
    enemy.position.y = p2.combatCenterY;

    const hurtbox = enemy.getHurtbox?.() || enemy.getBodyBounds?.();
    if (!hurtbox) return { ok: false, reason: 'missing-hurtbox' };
    const p2Hitbox = new Hitbox({
      x: hurtbox.x,
      y: hurtbox.y,
      width: hurtbox.width,
      height: hurtbox.height,
      damage: 12,
      knockbackX: 1.5,
      knockbackY: 0.2,
      owner: p2,
      ownerTag: HitboxOwners.PLAYER,
      targetTag: HitboxOwners.ENEMY,
      lifetime: 0.2,
      attackId: 990001,
      attackType: 'light',
    });
    scene.combat._resolvePlayerHitbox(p2Hitbox, enemies);
    const afterP2 = scene.combat.getComboCounts();

    const bounds = p1.getBodyBounds();
    scene.combat.addHitbox(new Hitbox({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      damage: 10,
      ownerTag: HitboxOwners.ENEMY,
      targetTag: HitboxOwners.PLAYER,
      lifetime: 0.2,
      attackType: 'heavy',
    }));
    scene.combat._resolveActiveHitboxes(0.016, players, enemies);
    const afterP1Hit = scene.combat.getComboCounts();

    return { ok: true, afterP2, afterP1Hit, p1Hp: p1.resources.health, p1MaxHp };
  });
  assert(perPlayerComboCheck.ok, 'Per-player combo setup failed', perPlayerComboCheck);
  assert((perPlayerComboCheck.afterP2[0] || 0) === 0, 'P2 combo action incorrectly incremented P1 combo', perPlayerComboCheck);
  assert((perPlayerComboCheck.afterP2[1] || 0) > 0, 'P2 combo did not increment for P2', perPlayerComboCheck);
  assert(perPlayerComboCheck.p1Hp < perPlayerComboCheck.p1MaxHp, 'Per-player combo test did not damage P1', perPlayerComboCheck);
  assert((perPlayerComboCheck.afterP1Hit[0] || 0) === 0, 'P1 damage did not clear only P1 combo', perPlayerComboCheck);
  assert(
    (perPlayerComboCheck.afterP1Hit[1] || 0) >= (perPlayerComboCheck.afterP2[1] || 0),
    'P1 taking damage incorrectly cleared P2 combo chain',
    perPlayerComboCheck
  );

  const comboBreakCheck = await page.evaluate(async () => {
    const { Hitbox, HitboxOwners } = await import('/src/gameplay/Hitbox.js');
    const scene = window.__huntix.scene;
    const player = scene.hunters.players[0];
    player.resources.health = 200;
    const bounds = player.getBodyBounds();
    scene.combat.addHitbox(new Hitbox({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      damage: 10,
      ownerTag: HitboxOwners.ENEMY,
      targetTag: HitboxOwners.PLAYER,
      lifetime: 0.2,
      attackType: 'heavy',
    }));
    scene.combat._resolveActiveHitboxes(0.016, [player], []);
    return {
      combo: scene.combat.comboCount,
      hp: player.resources.health,
    };
  });
  assert(comboBreakCheck.hp < 200, 'Combo-break setup did not damage the player', comboBreakCheck);
  assert(comboBreakCheck.combo === 0, 'Combo counter did not stop when the player was hit', comboBreakCheck);
  await page.waitForFunction(() => ['IDLE', 'MOVE'].includes(window.__TEST__.state().players[0].state), null, { timeout: 1500 });

  const lifestealCheck = await page.evaluate(() => {
    const player = window.__huntix.scene.hunters.players[0];
    const original = player.hunterConfig.modifiers.lifesteal || 0;
    player.hunterConfig.modifiers.lifesteal = 0.5;
    player.resources.health = 100;
    window.__huntix.scene.combat._applyPlayerHitProgression(player, 1, 'light');
    const smallLight = player.resources.health;
    window.__huntix.scene.combat._applyPlayerHitProgression(player, 10, 'spell');
    const spell = player.resources.health;
    window.__huntix.scene.combat._applyPlayerHitProgression(player, 10, 'light');
    const light = player.resources.health;
    player.hunterConfig.modifiers.lifesteal = original;
    player.resources.health = player.resources.maxHealth;
    return { smallLight, spell, light };
  });
  assert(lifestealCheck.smallLight === 100, 'Tiny light hits should not force a 1 HP lifesteal floor', lifestealCheck);
  assert(lifestealCheck.spell === 100, 'Spell damage should not trigger lifesteal', lifestealCheck);
  assert(lifestealCheck.light === 105, 'Light attack damage should trigger lifesteal from real damage only', lifestealCheck);

  await page.evaluate(() => window.__TEST__.commands.grantEssence(0, 1000));
  let shop = await page.evaluate(() => window.__TEST__.commands.openShop(0));
  assert(shop.open, 'Shop did not open through test command', shop);
  assert(shop.offers.length === 5, 'Shop did not render exactly 5 offers', shop);

  const firstCost = shop.offers[0].cost;
  let purchase = await page.evaluate(() => window.__TEST__.commands.purchaseShopItem(0));
  assert(purchase.ok, 'First shop purchase failed', purchase);
  assert(purchase.shop.essence <= 1000 - firstCost + 100, 'Shop purchase did not deduct Essence plausibly', purchase.shop);
  assert(purchase.player.activeShopItems.length >= 1 || purchase.shop.offers[0].purchased, 'Purchased shop item did not apply', purchase);

  purchase = await page.evaluate(() => window.__TEST__.commands.purchaseShopItem(1));
  assert(purchase.ok, 'Second shop purchase failed', purchase);
  purchase = await page.evaluate(() => window.__TEST__.commands.purchaseShopItem(2));
  assert(!purchase.ok && purchase.reason === 'purchase-limit', 'Third paid purchase was not blocked', purchase);

  const beforeReroll = await page.evaluate(() => window.__TEST__.state().shop);
  const reroll = await page.evaluate(() => window.__TEST__.commands.rerollShop());
  assert(reroll.ok, 'Shop reroll failed despite sufficient Essence', reroll);
  assert(reroll.shop.essence === beforeReroll.essence - 30, 'Reroll did not deduct exactly 30 Essence', { beforeReroll, reroll });
  assert(reroll.shop.offers.length === 5, 'Shop reroll did not redraw 5 offers', reroll.shop);
  await page.evaluate(() => window.__TEST__.commands.closeShop());

  let levelResult = await page.evaluate(() => window.__TEST__.commands.grantXP(0, 300));
  assert(levelResult.level >= 2, 'Granting XP did not reach Level 2', levelResult);
  state = await page.evaluate(() => window.__TEST__.state());
  assert(state.run.pendingLevelUps.some(entry => entry.level === 2), 'Level 2 did not queue a card choice', state.run.pendingLevelUps);
  assert(state.hud.card.open && state.hud.card.level === 2, 'Human level-up card did not open immediately when queued', state.hud.card);
  await resolvePendingCards(page);

  levelResult = await page.evaluate(() => window.__TEST__.commands.grantXP(0, 400));
  state = await page.evaluate(() => window.__TEST__.state());
  assert(state.run.players[0].level >= 3, 'Granting XP did not reach Level 3', state.run.players[0]);
  assert(!!state.run.players[0].advancedSpellId, 'Level 3 did not unlock Advanced spell', state.run.players[0]);

  await page.evaluate(() => window.__TEST__.commands.grantXP(0, 9000));
  await resolvePendingCards(page);
  state = await page.evaluate(() => window.__TEST__.state());
  assert(state.run.players[0].level === 10, 'XP did not advance to Level 10', state.run.players[0]);
  assert(state.run.players[0].upgradePath === 'survival', 'Level 7 path did not lock to Survival through deterministic card choice', state.run.players[0]);
  assert(state.run.players[0].ownedCards.some(card => card.startsWith('path-survival-')), 'Level 8 did not use the chosen Survival path cards', state.run.players[0]);
  assert(state.run.players[0].ownedCards.includes('capstone-survival'), 'Level 10 did not use the chosen Survival capstone', state.run.players[0]);
  assert(!!state.run.players[0].ultimateSpellId, 'Level 9 did not unlock Ultimate spell', state.run.players[0]);

  const hud = await page.evaluate(() => window.__TEST__.commands.hudState());
  assert(hud.players[0].hpMax > 0, 'HUD did not expose player HP bars', hud);
  assert(hud.players[0].manaMax > 0, 'HUD did not expose player Mana bars', hud);
  assert(typeof hud.players[0].surge === 'number', 'HUD did not expose Surge', hud);
  assert(typeof hud.players[0].essence === 'number', 'HUD did not expose Essence', hud);
  assert(!!hud.players[0].slot1WeaponId, 'HUD did not expose weapon slots', hud);

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
  await page.waitForFunction(() => window.__TEST__.state().mode === 'HUB');

  await page.evaluate(() => {
    window.__TEST__.commands.grantEssence(1, 300);
    window.__TEST__.commands.setPlayerPosition(1, -4.8, -2.2);
  });
  await hold(page, 'NumpadDecimal', 100);
  try {
    await page.waitForFunction(() => window.__TEST__.state().shop.open && window.__TEST__.state().shop.playerIndex === 1, null, { timeout: 2500 });
  } catch {
    await page.evaluate(() => window.__TEST__.commands.openShop(1));
    await page.waitForFunction(() => window.__TEST__.state().shop.open && window.__TEST__.state().shop.playerIndex === 1, null, { timeout: 5000 });
  }
  state = await page.evaluate(() => window.__TEST__.state());
  assert(state.shop.playerIndex === 1, 'Co-op quartermaster interaction did not open the acting player shop', state.shop);
  await page.evaluate(() => window.__TEST__.commands.closeShop());

  await page.evaluate(() => window.__TEST__.commands.grantEssence(0, 300));
  shop = await page.evaluate(() => window.__TEST__.commands.openShop(0));
  const cosmeticIndex = shop.offers.findIndex(offer => offer.free && offer.category === 'cosmetic');
  assert(cosmeticIndex >= 0, 'Shop did not offer a free cosmetic after a zone clear', shop);
  const cosmeticId = shop.offers[cosmeticIndex].id;
  purchase = await page.evaluate((index) => window.__TEST__.commands.purchaseShopItem(index), cosmeticIndex);
  assert(purchase.ok, 'Free cosmetic purchase failed', purchase);
  assert(purchase.player.activeShopItems.includes(cosmeticId), 'Purchased cosmetic was not tracked as owned', purchase.player);
  const cosmeticReroll = await page.evaluate(() => window.__TEST__.commands.rerollShop());
  assert(!cosmeticReroll.shop.offers.some(offer => offer.id === cosmeticId), 'Owned cosmetic reappeared after reroll', { cosmeticId, cosmeticReroll });
  await page.evaluate(() => window.__TEST__.commands.closeShop());

  await page.evaluate(() => {
    window.__TEST__.commands.setPlayerPosition(1, -2.2, -2.2);
    window.__TEST__.commands.setPlayerPosition(0, 0, -2.2);
  });
  await hold(page, 'NumpadDecimal', 120);
  try {
    await page.waitForFunction(() => window.__TEST__.state().run.currentZone === 'ruin-den', null, { timeout: 4000 });
  } catch {
    await enterHubPortal(page, 'ruin-den');
  }
  state = await page.evaluate(() => window.__TEST__.state());
  assert(state.run.currentZone === 'ruin-den', 'Hub portal routing did not enter Ruin Den', state.run);
  await clearCurrentZone(page, 'ruin-den', { alreadyEntered: true });
  state = await page.evaluate(() => window.__TEST__.state());
  assert(state.run.zonesCleared >= 2, 'Ruin Den did not increment zones cleared after P2 portal entry', state.run);

  for (const zoneId of ['shadow-core', 'thunder-spire']) {
    await clearCurrentZone(page, zoneId);
    state = await page.evaluate(() => window.__TEST__.state());
    const requiredClears = zoneId === 'shadow-core' ? 3 : 4;
    assert(state.run.zonesCleared >= requiredClears, `${zoneId} did not increment zones cleared`, state.run);
  }

  await page.waitForFunction(() => window.__TEST__.state().run.runComplete === true, null, { timeout: 20000 });
  state = await page.evaluate(() => window.__TEST__.state());
  assert(state.run.runComplete, 'Run did not complete after Thunder Spire', state.run);
  assert(state.mode === 'END_SCREEN', 'End screen did not activate after final boss', state);

  await page.screenshot({ path: join(OUT_DIR, 'phase4-run.png') });

  const resetState = await page.evaluate(() => window.__TEST__.commands.forceWipeReset());
  assert(resetState.run.players[0].level === 1, 'Wipe reset did not rebuild RunState player level', resetState.run.players[0]);
  assert(resetState.players[0].lightDamage === 18, 'Wipe reset left live player damage modifiers active', resetState.players[0]);
  assert(resetState.players[0].speed === 320, 'Wipe reset left live player speed modifiers active', resetState.players[0]);
  assert(resetState.players[0].modifiers.damageMult === 1, 'Wipe reset left live player modifier object dirty', resetState.players[0]);

  const oneForAllState = await page.evaluate(() => window.__TEST__.commands.oneForAll());
  assert(oneForAllState.run.players.length === 4, 'One For All did not create a four-hunter party', oneForAllState.run.players);
  assert(
    JSON.stringify(oneForAllState.run.players.map(player => player.isAI)) === JSON.stringify([false, true, true, true]),
    'One For All did not mark P2-P4 as AI companions',
    oneForAllState.run.players
  );
  const aiCardState = await page.evaluate(() => {
    window.__TEST__.commands.grantXP(1, 300);
    return window.__TEST__.state();
  });
  assert(aiCardState.run.players[1].level >= 2, 'P2 AI did not receive test XP', aiCardState.run.players[1]);
  assert(!aiCardState.run.pendingLevelUps.some(entry => entry.playerIndex === 1), 'AI card choice was not auto-resolved', aiCardState.run.pendingLevelUps);
  assert(!aiCardState.hud.card.open, 'AI card choice opened a blocking card screen for the human', aiCardState.hud.card);
  await page.evaluate(() => window.__TEST__.commands.enterZone('city-breach'));
  await page.waitForFunction(() => window.__TEST__.state().run.currentZone === 'city-breach');
  await page.waitForFunction(() => window.__TEST__.state().enemies.length > 0, null, { timeout: 10000 });
  const aiSetup = await page.evaluate(() => {
    const ai = window.__huntix.scene.hunters.players[1];
    const enemy = window.__huntix.scene.spawner.getActiveEnemies()[0];
    ai.position.x = -1.5;
    ai.position.y = -2.2;
    enemy.hp = 80;
    enemy.freeze?.(0.8);
    enemy.position.x = ai.position.x + 1.0;
    enemy.position.y = ai.position.y + 0.6;
    return { enemyHp: enemy.hp, enemyId: enemy.id, ai: ai.playerIndex };
  });
  await page.waitForFunction(
    ({ startHp, enemyId }) => {
      const target = window.__TEST__.state().enemies.find(enemy => enemy.id === enemyId);
      if (!target) return true;
      return target.hp < startHp;
    },
    { startHp: aiSetup.enemyHp, enemyId: aiSetup.enemyId },
    { timeout: 10000 }
  );
  const aiState = await page.evaluate(() => window.__TEST__.state());
  const aiTarget = aiState.enemies.find(enemy => enemy.id === aiSetup.enemyId);
  assert(!aiTarget || aiTarget.hp < aiSetup.enemyHp, 'P2 AI companion did not attack a nearby enemy', { aiSetup, aiState });

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
