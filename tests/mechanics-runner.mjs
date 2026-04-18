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

async function clearCurrentZone(page, zoneId) {
  await page.evaluate((id) => window.__TEST__.commands.enterZone(id), zoneId);
  await page.waitForFunction((id) => window.__TEST__.state().run.currentZone === id, zoneId, { timeout: 10000 });
  let bossSeen = false;
  let routeAdvanced = false;

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

    const state = await page.evaluate(() => window.__TEST__.state());
    routeAdvanced = routeAdvanced || (state.route?.areaIndex || 0) > 0;
    bossSeen = bossSeen || state.run.boss.seenZones.includes(zoneId);
    bossSeen = bossSeen || !!state.run.boss.name;
    if (state.run.currentZone === 'hub' || state.run.runComplete) break;
  }

  const postLoop = await page.evaluate(() => window.__TEST__.state());
  if (postLoop.run.currentZone !== 'hub' && !postLoop.run.runComplete) {
    await page.evaluate((id) => window.__TEST__.commands.forceZoneClear(id), zoneId);
  }
  await resolvePendingCards(page);

  await page.waitForFunction(
    () => window.__TEST__.state().run.currentZone === 'hub' || window.__TEST__.state().run.runComplete === true,
    null,
    { timeout: 20000 }
  );
  const finalState = await page.evaluate(() => window.__TEST__.state());
  routeAdvanced = routeAdvanced || (finalState.route?.areaIndex || 0) > 0;
  bossSeen = bossSeen || finalState.run.boss.seenZones.includes(zoneId);
  assert(routeAdvanced, `Zone route did not advance through combat areas before boss in ${zoneId}`);
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
  await page.waitForFunction(() => window.__TEST__.state().players[0].state === 'JUMP');
  await hold(page, 'KeyJ', 60);
  state = await page.evaluate(() => window.__TEST__.state());
  assert(state.players[0].airborne && state.players[0].state === 'JUMP', 'Jump did not keep P1 airborne and locked out of attacks', state.players[0]);
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
  assert(state.debug.combo > 0, 'Player hit did not start a combo before combo-break test', state.debug);

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
  await page.waitForFunction(() => window.__TEST__.state().shop.open && window.__TEST__.state().shop.playerIndex === 1);
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
    enemy.hp = 80;
    enemy.freeze?.(2);
    enemy.position.x = ai.position.x + 1.0;
    enemy.position.y = ai.position.y + 0.6;
    ai.position.x = -1.5;
    ai.position.y = -2.2;
    return { enemyHp: enemy.hp, ai: ai.playerIndex };
  });
  await page.waitForFunction(
    (startHp) => window.__TEST__.state().enemies[0]?.hp < startHp,
    aiSetup.enemyHp,
    { timeout: 4000 }
  );
  const aiState = await page.evaluate(() => window.__TEST__.state());
  assert(aiState.enemies[0].hp < aiSetup.enemyHp, 'P2 AI companion did not attack a nearby enemy', { aiSetup, aiState });

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
