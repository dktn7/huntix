import { ManaBar } from './ManaBar.js';
import { PlayerState } from './PlayerState.js';
import { AnimationController } from './AnimationController.js';
import { StatusTypes } from './StatusEffects.js';
import { createHunterMesh } from '../visuals/HunterMeshes.js';
import { HUNTERS } from '../visuals/Palettes.js';

export const HUNTER_CONFIGS = {
  dabik: {
    id: 'dabik',
    label: 'Dabik',
    hp: 900,
    mana: 120,
    speed: 320,
    lightDamage: 18,
    heavyDamage: 42,
    dodgeIFrames: 12,
    statusType: StatusTypes.BLEED,
    auraColor: HUNTERS.Dabik.aura,
    minor: { id: 'shadow-step', manaCost: 15, cooldown: 3.5, damage: 96, statusType: StatusTypes.BLEED },
    advanced: { id: 'shadow-clone', manaCost: 40, cooldown: 9 },
    ultimate: { id: 'monarchs-domain', duration: 4 },
  },
  benzu: {
    id: 'benzu',
    label: 'Benzu',
    hp: 1400,
    mana: 80,
    speed: 240,
    lightDamage: 22,
    heavyDamage: 65,
    dodgeIFrames: 8,
    statusType: StatusTypes.STUN,
    auraColor: HUNTERS.Benzu.aura,
    minor: { id: 'shield-bash', manaCost: 20, cooldown: 5, damage: 196, statusType: StatusTypes.STUN },
    advanced: { id: 'seismic-slam', manaCost: 50, cooldown: 11, damage: 308, statusType: StatusTypes.STUN },
    ultimate: { id: 'titans-wrath', damage: 420, stunDuration: 5 },
  },
  sereisa: {
    id: 'sereisa',
    label: 'Sereisa',
    hp: 750,
    mana: 160,
    speed: 380,
    lightDamage: 14,
    heavyDamage: 30,
    dodgeIFrames: 16,
    statusType: StatusTypes.SLOW,
    auraColor: HUNTERS.Sereisa.aura,
    minor: { id: 'electric-dart', manaCost: 15, cooldown: 3, damage: 110, statusType: StatusTypes.SLOW },
    advanced: { id: 'chain-shock', manaCost: 45, cooldown: 10, damage: 160, statusType: StatusTypes.SLOW },
    ultimate: { id: 'storm-surge', duration: 6, dashDamage: 120, statusType: StatusTypes.SLOW },
  },
  vesol: {
    id: 'vesol',
    label: 'Vesol',
    hp: 800,
    mana: 200,
    speed: 280,
    lightDamage: 12,
    heavyDamage: 28,
    dodgeIFrames: 10,
    statusType: StatusTypes.BURN,
    auraColor: HUNTERS.Vesol.aura,
    minor: { id: 'flame-bolt', manaCost: 12, cooldown: 2.5, damage: 216, statusType: StatusTypes.BURN },
    advanced: { id: 'flame-wall', manaCost: 45, cooldown: 12, damage: 168, statusType: StatusTypes.BURN },
    ultimate: { id: 'inferno', duration: 6, damagePerSecond: 120, statusType: StatusTypes.BURN },
  },
};

export const COOP_HP_SCALING = {
  1: { enemyHpMultiplier: 1, bossHpMultiplier: 1 },
  2: { enemyHpMultiplier: 1.5, bossHpMultiplier: 1.6 },
  3: { enemyHpMultiplier: 1.9, bossHpMultiplier: 2.1 },
  4: { enemyHpMultiplier: 2.2, bossHpMultiplier: 2.5 },
};

const DEFAULT_PLAYERS = [
  { hunterId: 'dabik', playerIndex: 0, isAI: false },
];

export class HunterController {
  /** Owns active hunters, their resources, input slots, and animation controllers. */
  constructor(scene, runPlayers = DEFAULT_PLAYERS) {
    this.scene = scene;
    this.entries = [];
    this.players = [];

    const activeRunPlayers = runPlayers.length ? runPlayers : DEFAULT_PLAYERS;
    for (let i = 0; i < Math.min(4, activeRunPlayers.length); i += 1) {
      this._addPlayer(activeRunPlayers[i], i);
    }
  }

  /** Advances each active player and its sprite animation. */
  update(dt, inputManager) {
    const isCoOp = this.activeHumanPlayerCount > 1;
    for (const entry of this.entries) {
      entry.player.setCoOpEnabled(isCoOp);
      const input = inputManager.getPlayerInput(entry.player.playerIndex);
      entry.player.update(dt, input);
      entry.animation.update(dt);
    }
    this.syncRunStateResources();
  }

  /** Advances sprite animation only, used during hitstop. */
  updateAnimations(dt) {
    for (const entry of this.entries) {
      entry.animation.update(dt);
    }
  }

  /** Adds a newly joined RunState player to the live hunter list. */
  addRunPlayer(runPlayer) {
    if (this.players.some(player => player.playerIndex === runPlayer.playerIndex)) return null;
    return this._addPlayer(runPlayer, runPlayer.playerIndex ?? this.players.length);
  }

  /** Returns per-player input snapshots aligned to this.players. */
  getInputSnapshots(inputManager) {
    return this.players.map(player => inputManager.getPlayerInput(player.playerIndex));
  }

  /** Clears combat buffers for every active human input slot. */
  clearInputBuffers(inputManager) {
    for (const player of this.players) {
      inputManager.getPlayerInput(player.playerIndex).clearBuffer();
    }
  }

  /** Places hunters in a compact formation around a center point. */
  setFormation(centerX, centerY) {
    const offsets = [-0.55, 0.55, -1.1, 1.1];
    for (let i = 0; i < this.players.length; i += 1) {
      this.players[i].position.x = centerX + (offsets[i] || 0);
      this.players[i].position.y = centerY + (i > 1 ? 0.35 : 0);
    }
  }

  /** Syncs all player resources from RunState on zone entry. */
  syncZoneEntry(runPlayers) {
    for (let i = 0; i < this.entries.length; i += 1) {
      const runPlayer = runPlayers[i];
      if (!runPlayer) continue;
      const entry = this.entries[i];
      entry.resources.syncZoneEntryFromRunState(runPlayer);
      entry.player.syncDownState(runPlayer.isDown);
    }
  }

  /** Syncs all player health from RunState after zone clear healing. */
  syncZoneComplete(runPlayers) {
    for (let i = 0; i < this.entries.length; i += 1) {
      const runPlayer = runPlayers[i];
      if (runPlayer) this.entries[i].resources.syncHealthFromRunState(runPlayer);
    }
  }

  /** Pushes live combat resources back into the authoritative run player objects. */
  syncRunStateResources() {
    for (const entry of this.entries) {
      const runPlayer = entry.runPlayer;
      if (!runPlayer) continue;
      runPlayer.hp = Math.max(0, Math.min(runPlayer.hpMax, entry.resources.health));
      runPlayer.mana = Math.max(0, Math.min(runPlayer.manaMax, entry.resources.mana));
      runPlayer.surge = Math.max(0, Math.min(100, entry.resources.surge));
      if (!runPlayer.isDown && entry.player.isDown) runPlayer.stats.timesDown += 1;
      runPlayer.isDown = entry.player.isDown;
      runPlayer.downTimer = entry.player.downTimer;
    }
  }

  /** Grants full surge to every active hunter for debug/mechanics verification. */
  fillSurge() {
    for (const entry of this.entries) {
      entry.resources.surge = entry.resources.maxSurge;
    }
    this.syncRunStateResources();
  }

  /** Resets live player resources and state from the current run state after a wipe. */
  syncAllFromRunState(runPlayers) {
    for (let i = 0; i < this.entries.length; i += 1) {
      const runPlayer = runPlayers[i];
      if (!runPlayer) continue;
      const entry = this.entries[i];
      entry.runPlayer = runPlayer;
      entry.resources.maxHealth = runPlayer.hpMax;
      entry.resources.maxMana = runPlayer.manaMax;
      entry.resources.health = runPlayer.hp;
      entry.resources.mana = runPlayer.mana;
      entry.resources.surge = runPlayer.surge;
      entry.player.resetForRunState(runPlayer);
    }
  }

  /** Sets all hunter meshes visible or hidden. */
  setVisible(visible) {
    for (const player of this.players) {
      player.mesh.visible = visible;
    }
  }

  /** Returns the primary player used by legacy single-player systems. */
  get primaryPlayer() {
    return this.players[0] || null;
  }

  /** Returns the number of active player-controlled/AI hunters. */
  get activePlayerCount() {
    return Math.max(1, this.players.length);
  }

  /** Returns the active human-controlled hunter count for co-op scaling. */
  get activeHumanPlayerCount() {
    const humans = this.entries.filter(entry => !entry.runPlayer?.isAI).length;
    return Math.max(1, humans);
  }

  _addPlayer(runPlayer, fallbackIndex) {
    const hunterId = runPlayer.hunterId || 'dabik';
    const config = HUNTER_CONFIGS[hunterId] || HUNTER_CONFIGS.dabik;
    const resources = new ManaBar({
      maxHealth: runPlayer.hpMax || config.hp,
      maxMana: runPlayer.manaMax || config.mana,
      maxSurge: 100,
      manaRegenPerSecond: 3,
    });
    resources.health = Math.min(runPlayer.hp ?? config.hp, resources.maxHealth);
    resources.mana = Math.min(runPlayer.mana ?? config.mana, resources.maxMana);
    resources.surge = runPlayer.surge ?? 0;

    const mesh = createHunterMesh({ hunterId });
    const player = new PlayerState(this.scene, resources, {
      playerIndex: runPlayer.playerIndex ?? fallbackIndex,
      hunterConfig: config,
      mesh,
    });
    const animation = new AnimationController(player, mesh.userData.animator);

    const entry = { player, resources, animation, config, runPlayer };
    this.entries.push(entry);
    this.players.push(player);
    return entry;
  }
}
