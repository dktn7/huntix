import { ManaBar } from './ManaBar.js';
import { PlayerState } from './PlayerState.js';
import { AnimationController } from './AnimationController.js';
import { StatusTypes } from './StatusEffects.js';
import { CompanionAIController } from './CompanionAIController.js';
import { createHunterMesh, loadHunterAtlas } from '../visuals/HunterMeshes.js';
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

const HUNTER_ATLAS_MANIFEST_PATH = 'assets/sprites/hunters/manifest.json';
const HUNTER_ATLAS_CACHE = new Map();
const HUNTER_ATLAS_LOADING = new Map();
let hunterAtlasManifest = null;
let hunterAtlasManifestPromise = null;

function loadHunterAtlasCached(hunterId) {
  const id = String(hunterId || 'dabik').toLowerCase();
  if (HUNTER_ATLAS_CACHE.has(id)) return Promise.resolve(HUNTER_ATLAS_CACHE.get(id));
  if (HUNTER_ATLAS_LOADING.has(id)) return HUNTER_ATLAS_LOADING.get(id);

  const pending = loadHunterAtlas(id)
    .then((atlas) => {
      HUNTER_ATLAS_CACHE.set(id, atlas);
      HUNTER_ATLAS_LOADING.delete(id);
      return atlas;
    })
    .catch((error) => {
      HUNTER_ATLAS_LOADING.delete(id);
      throw error;
    });

  HUNTER_ATLAS_LOADING.set(id, pending);
  return pending;
}

function getHunterAtlasManifest() {
  if (hunterAtlasManifest) return Promise.resolve(hunterAtlasManifest);
  if (hunterAtlasManifestPromise) return hunterAtlasManifestPromise;

  hunterAtlasManifestPromise = fetch(HUNTER_ATLAS_MANIFEST_PATH)
    .then((response) => {
      if (!response.ok) return { atlases: {} };
      return response.json();
    })
    .catch(() => ({ atlases: {} }))
    .then((manifest) => {
      const atlases = manifest?.atlases && typeof manifest.atlases === 'object'
        ? manifest.atlases
        : {};
      hunterAtlasManifest = { atlases };
      return hunterAtlasManifest;
    });

  return hunterAtlasManifestPromise;
}

function isHunterAtlasReady(hunterId) {
  const id = String(hunterId || 'dabik').toLowerCase();
  return getHunterAtlasManifest().then((manifest) => manifest.atlases[id] === true);
}

export class HunterController {
  /** Owns active hunters, their resources, input slots, and animation controllers. */
  constructor(scene, runPlayers = DEFAULT_PLAYERS) {
    this.scene = scene;
    this.entries = [];
    this.players = [];
    this.companionAI = new CompanionAIController();
    this._preparedInputs = [];

    const activeRunPlayers = runPlayers || [];
    for (let i = 0; i < Math.min(4, activeRunPlayers.length); i += 1) {
      this._addPlayer(activeRunPlayers[i], i);
    }
    this._warmAtlasCache();
  }

  /** Advances each active player and its sprite animation. */
  update(dt, inputManager, preparedInputs = null) {
    const isCoOp = this.activePlayerCount > 1;
    for (let i = 0; i < this.entries.length; i += 1) {
      const entry = this.entries[i];
      entry.player.setCoOpEnabled(isCoOp);
      const input = preparedInputs?.[i] || inputManager.getPlayerInput(entry.player.playerIndex);
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
    this._preparedInputs.length = 0;
    for (const entry of this.entries) {
      this._preparedInputs.push(inputManager.getPlayerInput(entry.player.playerIndex));
    }
    return this._preparedInputs;
  }

  /** Returns human snapshots plus AI-generated snapshots aligned to this.players. */
  prepareZoneInputs(dt, inputManager, enemies, flow = null) {
    this._preparedInputs.length = 0;
    for (const entry of this.entries) {
      const snapshot = entry.runPlayer?.isAI
        ? this.companionAI.update(dt, entry.player, enemies, this.players, flow)
        : inputManager.getPlayerInput(entry.player.playerIndex);
      this._preparedInputs.push(snapshot);
    }
    return this._preparedInputs;
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

  /** Applies RunState progression modifiers to live player configs and resources. */
  applyRunStateModifiers(runPlayers) {
    for (let i = 0; i < this.entries.length; i += 1) {
      const runPlayer = runPlayers[i];
      const entry = this.entries[i];
      if (!runPlayer || !entry) continue;

      this._ensureEntryHunterVisual(entry, runPlayer.hunterId);

      const config = this._buildConfig(runPlayer.hunterId, runPlayer.modifiers);
      entry.config = config;
      entry.runPlayer = runPlayer;
      entry.player.runPlayer = runPlayer;
      entry.player.applyHunterConfig(config);
      entry.resources.maxHealth = runPlayer.hpMax;
      entry.resources.maxMana = runPlayer.manaMax;
      entry.resources.health = Math.min(runPlayer.hp, entry.resources.maxHealth);
      entry.resources.mana = Math.min(runPlayer.mana, entry.resources.maxMana);
      entry.resources.surge = Math.min(runPlayer.surge, entry.resources.maxSurge);
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
      this._ensureEntryHunterVisual(entry, runPlayer.hunterId);
      const config = this._buildConfig(runPlayer.hunterId, runPlayer.modifiers);
      entry.config = config;
      entry.runPlayer = runPlayer;
      entry.player.runPlayer = runPlayer;
      entry.resources.maxHealth = runPlayer.hpMax;
      entry.resources.maxMana = runPlayer.manaMax;
      entry.resources.health = runPlayer.hp;
      entry.resources.mana = runPlayer.mana;
      entry.resources.surge = runPlayer.surge;
      entry.player.resetForRunState(runPlayer, config);
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
    const config = this._buildConfig(hunterId, runPlayer.modifiers);
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
      runPlayer,
      mesh,
    });
    const animation = new AnimationController(player, mesh.userData.animator);

    const entry = {
      player,
      resources,
      animation,
      config,
      runPlayer,
      hunterId: String(hunterId).toLowerCase(),
    };
    this.entries.push(entry);
    this.players.push(player);
    this._upgradeEntryToAtlas(entry, entry.hunterId);
    return entry;
  }

  _buildConfig(hunterId, modifiers = {}) {
    const base = HUNTER_CONFIGS[hunterId] || HUNTER_CONFIGS.dabik;
    const damageMult = modifiers?.damageMult || 1;
    const speedMult = modifiers?.speedMult || 1;
    const spellDamageMult = modifiers?.spellDamageMult || 1;
    const cooldownMult = Math.max(0.2, modifiers?.cooldownMult || 1);
    const dodgeIFrameBonus = modifiers?.dodgeIFrameBonus || 0;

    return {
      ...base,
      speed: Math.round(base.speed * speedMult),
      lightDamage: Math.max(1, Math.round(base.lightDamage * damageMult)),
      heavyDamage: Math.max(1, Math.round(base.heavyDamage * damageMult)),
      dodgeIFrames: Math.max(1, base.dodgeIFrames + dodgeIFrameBonus),
      minor: this._scaleSpell(base.minor, spellDamageMult, cooldownMult),
      advanced: this._scaleSpell(base.advanced, spellDamageMult, cooldownMult),
      ultimate: this._scaleSpell(base.ultimate, spellDamageMult, cooldownMult),
      modifiers,
    };
  }

  _scaleSpell(spell, damageMult, cooldownMult) {
    const next = { ...spell };
    if (typeof next.damage === 'number') next.damage = Math.max(1, Math.round(next.damage * damageMult));
    if (typeof next.damagePerSecond === 'number') next.damagePerSecond = Math.max(1, Math.round(next.damagePerSecond * damageMult));
    if (typeof next.dashDamage === 'number') next.dashDamage = Math.max(1, Math.round(next.dashDamage * damageMult));
    if (typeof next.cooldown === 'number') next.cooldown = Math.max(0.2, next.cooldown * cooldownMult);
    return next;
  }

  _warmAtlasCache() {
    getHunterAtlasManifest().then((manifest) => {
      for (const hunterId of Object.keys(HUNTER_CONFIGS)) {
        if (manifest.atlases[hunterId] !== true) continue;
        loadHunterAtlasCached(hunterId).catch(() => {
          // Keep fallback meshes if atlas loading fails.
        });
      }
    });
  }

  _ensureEntryHunterVisual(entry, hunterId) {
    const targetHunter = String(hunterId || 'dabik').toLowerCase();
    if (entry.hunterId === targetHunter) return;

    entry.hunterId = targetHunter;
    const fallbackMesh = createHunterMesh({ hunterId: targetHunter });
    entry.player.setMesh(fallbackMesh);
    entry.animation.setAnimator(fallbackMesh.userData.animator);
    this._upgradeEntryToAtlas(entry, targetHunter);
  }

  _upgradeEntryToAtlas(entry, hunterId) {
    const targetHunter = String(hunterId || 'dabik').toLowerCase();
    isHunterAtlasReady(targetHunter)
      .then((ready) => {
        if (!ready || entry.hunterId !== targetHunter) return null;
        return loadHunterAtlasCached(targetHunter);
      })
      .then((atlas) => {
        if (!atlas || entry.hunterId !== targetHunter) return;
        const atlasMesh = createHunterMesh({
          hunterId: targetHunter,
          atlasTexture: atlas.texture,
          atlasData: atlas.atlasData,
        });
        entry.player.setMesh(atlasMesh);
        entry.animation.setAnimator(atlasMesh.userData.animator);
      })
      .catch(() => {
        // Keep fallback mesh when assets are unavailable.
      });
  }
}
