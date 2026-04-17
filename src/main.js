import { Renderer } from './engine/Renderer.js';
import { Actions, InputManager } from './engine/InputManager.js';
import { GameLoop } from './engine/GameLoop.js';
import { SceneManager } from './engine/SceneManager.js';
import { RunState } from './core/RunState.js';

const canvas = document.getElementById('game-canvas');

const renderer = new Renderer(canvas);
const input = new InputManager();

const PLAYER_SLOT_CONFIGS = [
  { hunterId: 'dabik', isAI: false, carryEssence: 0 },
  { hunterId: 'benzu', isAI: false, carryEssence: 0 },
  { hunterId: 'sereisa', isAI: false, carryEssence: 0 },
  { hunterId: 'vesol', isAI: false, carryEssence: 0 },
];

RunState.init([PLAYER_SLOT_CONFIGS[0]]);

function activatePlayerSlot(slotIndex) {
  if (slotIndex < 1 || slotIndex >= PLAYER_SLOT_CONFIGS.length) return;
  while (RunState.players.length <= slotIndex) {
    const config = PLAYER_SLOT_CONFIGS[RunState.players.length];
    if (!RunState.addPlayer(config)) return;
  }
}

function activateConnectedGamepads() {
  const gamepads = navigator.getGamepads?.() || [];
  for (let i = 1; i < PLAYER_SLOT_CONFIGS.length; i += 1) {
    if (gamepads[i]) activatePlayerSlot(i);
  }
}

activateConnectedGamepads();
const scene = new SceneManager(renderer);
const loop = new GameLoop();

window.addEventListener('gamepadconnected', event => {
  if (event.gamepad.index > 0) activatePlayerSlot(event.gamepad.index);
});

loop.start((dt) => {
  scene.update(dt, input);
  if (input.justPressed(Actions.JOIN_P2)) activatePlayerSlot(1);
  if (input.justPressed(Actions.JOIN_P3)) activatePlayerSlot(2);
  if (input.justPressed(Actions.JOIN_P4)) activatePlayerSlot(3);
  if (!RunState.runComplete && !RunState.runWiped) RunState.tick(dt);
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
      `Combo: ${debug.combo}`,
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
        players: RunState.players.map(player => ({
          hunterId: player.hunterId,
          playerIndex: player.playerIndex,
          hp: player.hp,
          mana: player.mana,
          surge: player.surge,
          xp: player.xp,
          level: player.level,
          essence: player.essence,
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
        },
      },
      players: scene.hunters.players.map(player => ({
        playerIndex: player.playerIndex,
        hunterId: player.hunterConfig.id,
        state: player.state,
        x: player.position.x,
        y: player.position.y,
        hp: player.resources.health,
        mana: player.resources.mana,
        surge: player.resources.surge,
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
    };
  },
  commands: {
    join(slotIndex) {
      activatePlayerSlot(slotIndex);
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
      }
      return true;
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
  },
};
