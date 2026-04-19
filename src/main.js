import { Renderer } from './engine/Renderer.js';
import { Actions, InputManager } from './engine/InputManager.js';
import { GameLoop } from './engine/GameLoop.js';
import { SceneManager } from './engine/SceneManager.js';
import { RunState } from './core/RunState.js';

const canvas = document.getElementById('game-canvas');

const renderer = new Renderer(canvas);
const input = new InputManager();

let scene = new SceneManager(renderer);
const loop = new GameLoop();
const TEST_HUNTER_ROSTER = ['dabik', 'benzu', 'sereisa', 'vesol'];

function syncLiveSystemsFromRunState() {
  scene.hunters.syncAllFromRunState(RunState.players);
  scene.hunters.applyRunStateModifiers(RunState.players);
  scene.spawner.setPlayerCount(scene.hunters.activeHumanPlayerCount);
}

function ensureHumanRunStarted() {
  if (RunState.players.length > 0) return;
  scene.startRun([{ hunterId: TEST_HUNTER_ROSTER[0], playerIndex: 0, isAI: false }]);
  scene.startNewRunFromRunState();
}

function activatePlayerSlot(slotIndex) {
  const idx = Number(slotIndex);
  if (!Number.isInteger(idx) || idx < 0 || idx >= TEST_HUNTER_ROSTER.length) return false;

  ensureHumanRunStarted();
  while (RunState.players.length <= idx) {
    const nextIndex = RunState.players.length;
    const added = RunState.addPlayer({
      hunterId: TEST_HUNTER_ROSTER[nextIndex],
      playerIndex: nextIndex,
      isAI: false,
    });
    if (!added) return false;
  }

  RunState.players[idx].isAI = false;
  RunState.isCoOp = RunState.players.filter(player => !player.isAI).length > 1;
  syncLiveSystemsFromRunState();
  return true;
}

function activateOneForAll() {
  const configs = TEST_HUNTER_ROSTER.map((hunterId, index) => ({
    hunterId,
    playerIndex: index,
    isAI: index > 0,
  }));
  scene.startRun(configs);
  scene.startNewRunFromRunState();
  scene.hud.hideOnboarding();
  return true;
}

loop.start((dt) => {
  scene.update(dt, input);
  if (!RunState.runComplete && !RunState.runWiped && RunState.players.length > 0) RunState.tick(dt);
  renderer.render(scene.getScene(), scene.getCamera());

  const panel = document.getElementById('debug-panel');
  if (panel && document.body.classList.contains('debug')) {
    const debug = scene.getDebugInfo();
    panel.innerHTML = [
      `FPS: ${loop.fps.toFixed(0)}`,
      `dt: ${(dt * 1000).toFixed(2)}ms`,
      `Mode: ${debug.mode}`,
      `Player: ${debug.playerState}`,
      `HP: ${debug.health.toFixed(0)} / ${debug.maxHealth}`,
      `Mana: ${debug.mana.toFixed(0)} / ${debug.maxMana}`,
      `Surge: ${debug.surge.toFixed(0)} / ${debug.maxSurge}`,
      `Stamina: ${debug.stamina.toFixed(0)} / ${debug.maxStamina}`,
      `Enemies: ${debug.enemies}`,
      `Combo P1: ${debug.combo}`,
      `Combo All: ${(debug.comboByPlayer || []).join(', ') || '0'}`,
      `Hitstop: ${(debug.hitstop * 1000).toFixed(0)}ms`,
      `Input P1: ${[...input.getPlayerInput(0).pressed].join(', ') || 'none'}`,
    ].join('<br>');
  }
});

window.__huntix = { renderer, input, scene, loop };

window.__TEST__ = {
  get ready() {
    return !!scene?.hunters?.primaryPlayer;
  },
  state() {
    return {
      mode: scene.mode,
      run: {
        isCoOp: RunState.isCoOp,
        zonesCleared: RunState.zonesCleared,
        currentZone: RunState.currentZone,
        currentZoneLabel: RunState.currentZoneLabel,
        currentZoneNumber: RunState.currentZoneNumber,
        runComplete: RunState.runComplete,
        pendingLevelUps: RunState.pendingLevelUps.map(entry => ({
          playerIndex: entry.playerIndex,
          level: entry.level,
          choices: entry.choices.map(card => card.id),
        })),
        players: RunState.players.map(player => ({
          hunterId: player.hunterId,
          playerIndex: player.playerIndex,
          isAI: player.isAI,
          hp: player.hp,
          mana: player.mana,
          surge: player.surge,
          xp: player.xp,
          level: player.level,
          essence: player.essence,
          upgradePath: player.upgradePath,
          minorSpellId: player.minorSpellId,
          advancedSpellId: player.advancedSpellId,
          ultimateSpellId: player.ultimateSpellId,
          minorMod: player.minorMod,
          advancedMod: player.advancedMod,
          ownedCards: [...player.ownedCards],
          activeShopItems: [...player.activeShopItems],
          modifiers: { ...player.modifiers },
          slot1WeaponId: player.slot1WeaponId,
          slot2WeaponId: player.slot2WeaponId,
          activeSlot: player.activeSlot,
          shopBuysThisVisit: player.shopBuysThisVisit,
          isDown: player.isDown,
          downTimer: player.downTimer,
          stats: { ...player.stats },
        })),
        boss: {
          id: RunState.activeBossId,
          name: RunState.activeBossName,
          hp: RunState.activeBossHp,
          hpMax: RunState.activeBossHpMax,
          phase: RunState.activeBossPhase,
          seenZones: [...scene._bossSeenZones],
        },
      },
      players: scene.hunters.players.map(player => ({
        playerIndex: player.playerIndex,
        hunterId: player.hunterConfig.id,
        isAI: !!player.runPlayer?.isAI,
        state: player.state,
        airborne: player.isAirborne?.() || false,
        x: player.position.x,
        y: player.position.y,
        hp: player.resources.health,
        mana: player.resources.mana,
        surge: player.resources.surge,
        speed: player.hunterConfig.speed,
        lightDamage: player.hunterConfig.lightDamage,
        heavyDamage: player.hunterConfig.heavyDamage,
        modifiers: { ...(player.hunterConfig.modifiers || {}) },
        isDown: player.isDown,
        downTimer: player.downTimer,
      })),
      enemies: scene.spawner.getActiveEnemies().map(enemy => ({
        id: enemy.id,
        type: enemy.type,
        state: enemy.state,
        hp: enemy.hp,
        x: enemy.position.x,
        y: enemy.position.y,
        name: enemy.name || null,
        kind: enemy.kind || null,
        phase: enemy.phase || null,
      })),
      debug: scene.getDebugInfo(),
      route: scene.spawner.getRouteState?.() || null,
      hud: scene.hud.getState(),
      shop: scene.shop.getState(),
    };
  },
  commands: {
    join(slotIndex) {
      return activatePlayerSlot(slotIndex);
    },
    oneForAll() {
      activateOneForAll();
      return window.__TEST__.state();
    },
    fillSurge() {
      scene.hunters.fillSurge();
    },
    enterCityBreach() {
      scene.enterZone('city-breach', input);
    },
    enterZone(zoneId) {
      scene.enterZone(zoneId, input);
    },
    damagePlayer(playerIndex, amount) {
      const player = scene.hunters.players[playerIndex];
      if (player) {
        player.takeDamage(amount);
        scene.hunters.syncRunStateResources();
      }
    },
    damageEnemy(enemyIndex, amount) {
      const enemy = scene.spawner.getActiveEnemies()[enemyIndex];
      if (!enemy) return false;
      return enemy.takeDamage(amount);
    },
    setPlayerPosition(playerIndex, x, y) {
      const player = scene.hunters.players[playerIndex];
      if (!player) return false;
      player.position.x = x;
      player.position.y = y;
      return true;
    },
    killAllEnemies() {
      let hit = false;
      for (const enemy of scene.spawner.getActiveEnemies()) {
        if (!enemy || enemy.hp <= 0) continue;
        enemy.takeDamage(enemy.hp + 9999);
        hit = true;
      }
      return hit;
    },
    fastForwardZone() {
      if (scene.spawner) {
        scene.spawner._betweenWaveTimer = 0;
        scene.spawner._encounterDelay = 0;
        scene.spawner._zoneClearDelay = 0;
        scene.spawner._routeGateTimer = 0;
        if (scene.spawner.isRouteGateOpen?.()) scene.advanceZoneRoute(input);
      }
      return true;
    },
    advanceRoute() {
      return scene.advanceZoneRoute(input);
    },
    forceZoneClear(zoneId) {
      const boss = scene.spawner?._lastDefeatedBoss || scene.spawner?._bossEncounter || null;
      const resolvedZone = zoneId || scene.spawner?._zoneConfig?.id || RunState.currentZone;
      if (boss && boss.hp > 0) {
        boss.takeDamage(boss.hp + 9999);
      }
      scene._onZoneCleared(resolvedZone, boss);
      return true;
    },
    revivePlayer(playerIndex) {
      const player = scene.hunters.players[playerIndex];
      const revived = player?.revive(0.3) || false;
      if (revived) scene.hunters.syncRunStateResources();
      return revived;
    },
    castUltimate(playerIndex) {
      const player = scene.hunters.players[playerIndex];
      if (!player) return false;
      return scene.combat._castUltimate(player, scene.spawner.getActiveEnemies(), scene.spawner);
    },
    grantEssence(playerIndex, amount) {
      RunState.addEssence(playerIndex, amount);
      return RunState.players[playerIndex]?.essence || 0;
    },
    grantXP(playerIndex, amount) {
      RunState.addXP(playerIndex, amount);
      return {
        level: RunState.players[playerIndex]?.level || 0,
        pendingLevelUps: RunState.pendingLevelUps.length,
      };
    },
    openShop(playerIndex = 0) {
      scene.shop.open(playerIndex, Math.max(1, RunState.zonesCleared + 1));
      return scene.shop.getState();
    },
    closeShop() {
      scene.shop.close();
      return scene.shop.getState();
    },
    purchaseShopItem(index = null) {
      const result = scene.shop.purchaseSelected(index ?? scene.shop.selectedIndex);
      if (result?.ok) scene.hunters.applyRunStateModifiers(RunState.players);
      return {
        ok: !!result?.ok,
        reason: result?.reason || null,
        shop: scene.shop.getState(),
        player: RunState.players[scene.shop.playerIndex],
      };
    },
    rerollShop() {
      const result = scene.shop.reroll();
      return {
        ok: !!result?.ok,
        reason: result?.reason || null,
        shop: scene.shop.getState(),
      };
    },
    forceWipeReset() {
      const keptEssence = RunState.onRunWipe();
      RunState.resetAfterWipe(keptEssence);
      scene.hunters.syncAllFromRunState(RunState.players);
      return window.__TEST__.state();
    },
    openNextCard() {
      return scene._openNextCardScreen();
    },
    chooseLevelCard(cardId = null) {
      if (!scene.hud.isCardOpen()) scene._openNextCardScreen();
      return scene.chooseCurrentCard(cardId);
    },
    hudState() {
      return scene.hud.getState();
    },
    shopState() {
      return scene.shop.getState();
    },
  },
};
