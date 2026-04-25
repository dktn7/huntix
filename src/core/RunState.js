import {
  MAX_LEVEL,
  XP_THRESHOLDS,
  createDefaultModifiers,
  getCardChoices,
  getShopItemById,
  shouldQueueCardLevel,
} from '../gameplay/ProgressionData.js';
import { HUB_ZONE_ID, ZONE_ORDER } from '../gameplay/ZoneManager.js';

const HUNTER_BASE_STATS = {
  dabik: {
    hp: 900,
    mana: 120,
    minorSpell: 'shadow-step',
    advancedSpell: 'shadow-clone',
    ultimateSpell: 'monarchs-domain',
    signature: 'twin-curved-daggers',
  },
  benzu: {
    hp: 1400,
    mana: 80,
    minorSpell: 'shield-bash',
    advancedSpell: 'seismic-slam',
    ultimateSpell: 'titans-wrath',
    signature: 'stone-forged-gauntlets',
  },
  sereisa: {
    hp: 750,
    mana: 160,
    minorSpell: 'electric-dart',
    advancedSpell: 'chain-shock',
    ultimateSpell: 'storm-surge',
    signature: 'lightning-rapier',
  },
  vesol: {
    hp: 800,
    mana: 200,
    minorSpell: 'flame-bolt',
    advancedSpell: 'flame-wall',
    ultimateSpell: 'inferno',
    signature: 'gate-crystal-focus',
  },
};

const ZONE_CLEAR_HP_RESTORE = 30;
const WIPE_ESSENCE_KEEP_RATE = 0.5;

// Valid zones are the hub (neutral zone) + all combat zones in ZONE_ORDER.
const VALID_ZONES = Object.fromEntries(
  [HUB_ZONE_ID, ...ZONE_ORDER].map(id => [id, true])
);

const _listeners = {};

function on(event, fn) {
  if (!_listeners[event]) _listeners[event] = [];
  _listeners[event].push(fn);
}

function off(event, fn) {
  const listeners = _listeners[event];
  if (!listeners) return;

  const index = listeners.indexOf(fn);
  if (index !== -1) listeners.splice(index, 1);
  if (listeners.length === 0) delete _listeners[event];
}

function emit(event, data) {
  const listeners = _listeners[event];
  if (!listeners) return;

  for (let i = 0; i < listeners.length; i += 1) {
    listeners[i](data);
  }
}

function getPlayer(playerIndex) {
  const player = RunState.players[playerIndex];
  if (!player) throw new Error(`Unknown player index: ${playerIndex}`);
  return player;
}

function assertValidZone(zoneId) {
  if (!VALID_ZONES[zoneId]) throw new Error(`Unknown zone id: ${zoneId}`);
}

function createPlayer(config, playerIndex) {
  const baseStats = HUNTER_BASE_STATS[config.hunterId];
  if (!baseStats) throw new Error(`Unknown hunter id: ${config.hunterId}`);

  return {
    hunterId: config.hunterId,
    playerIndex,
    isAI: !!config.isAI,
    hp: baseStats.hp,
    hpMax: baseStats.hp,
    mana: baseStats.mana,
    manaMax: baseStats.mana,
    surge: 0,
    xp: 0,
    level: 1,
    upgradePath: null,
    minorSpellId: baseStats.minorSpell,
    advancedSpellId: null,
    ultimateSpellId: null,
    minorMod: null,
    advancedMod: null,
    slot1WeaponId: baseStats.signature,
    slot2WeaponId: null,
    activeSlot: 0,
    essence: config.carryEssence || 0,
    shopBuysThisVisit: 0,
    ownedCards: [],
    activeShopItems: [],
    modifiers: createDefaultModifiers(),
    secondWindReady: false,
    stats: {
      kills: 0,
      damageDealt: 0,
      damageTaken: 0,
      spellsCast: 0,
      highestCombo: 0,
      timesDown: 0,
    },
    isDown: false,
    downTimer: 0,
  };
}

function applyModifierDelta(player, delta = {}) {
  const mods = player.modifiers || createDefaultModifiers();
  player.modifiers = mods;

  for (const [key, value] of Object.entries(delta)) {
    if (key === 'secondWind') {
      mods.secondWind = mods.secondWind || !!value;
      player.secondWindReady = player.secondWindReady || !!value;
    } else if (key === 'cosmeticAura') {
      mods.cosmeticAura = value || mods.cosmeticAura;
    } else if (typeof value === 'number') {
      mods[key] = (mods[key] ?? 0) + value;
    }
  }
}

function applyEffect(player, effect = {}) {
  if (effect.modifiers) applyModifierDelta(player, effect.modifiers);

  if (effect.upgradePath) player.upgradePath = effect.upgradePath;
  if (effect.minorMod) player.minorMod = effect.minorMod;
  if (effect.advancedMod) player.advancedMod = effect.advancedMod;
  if (effect.slot2WeaponId) player.slot2WeaponId = effect.slot2WeaponId;

  if (effect.modifiers?.maxHpBonus) {
    player.hpMax += effect.modifiers.maxHpBonus;
  }
  if (effect.modifiers?.maxManaBonus) {
    player.manaMax += effect.modifiers.maxManaBonus;
  }
  if (effect.heal) {
    player.hp = Math.min(player.hpMax, player.hp + effect.heal);
  }
  if (effect.mana) {
    player.mana = Math.min(player.manaMax, player.mana + effect.mana);
  }
  if (effect.surge) {
    player.surge = Math.min(100, player.surge + effect.surge);
  }
}

function refreshQueuedCardChoices(playerIndex) {
  const player = getPlayer(playerIndex);
  for (const entry of RunState.pendingLevelUps) {
    if (entry.playerIndex === playerIndex) {
      entry.choices = getCardChoices(player, entry.level);
    }
  }
}

export const RunState = {
  runId: null,
  runTimer: 0,
  zonesCleared: 0,
  currentZone: HUB_ZONE_ID,
  currentZoneLabel: 'Hunter HQ',
  currentZoneNumber: 0,
  isCoOp: false,
  runComplete: false,
  runWiped: false,
  pendingCardPick: false,
  cardLevel: null,
  pendingLevelUps: [],
  activeBossId: null,
  activeBossName: null,
  activeBossHp: 0,
  activeBossHpMax: 0,
  activeBossPhase: 0,
  players: [],

  on,
  off,
  emit,

  init(playerConfigs) {
    this.runId = Date.now().toString();
    this.runTimer = 0;
    this.zonesCleared = 0;
    this.currentZone = HUB_ZONE_ID;
    this.currentZoneLabel = 'Hunter HQ';
    this.currentZoneNumber = 0;
    this.isCoOp = playerConfigs.filter(p => !p.isAI).length > 1;
    this.runComplete = false;
    this.runWiped = false;
    this.pendingCardPick = false;
    this.cardLevel = null;
    this.pendingLevelUps = [];
    this.activeBossId = null;
    this.activeBossName = null;
    this.activeBossHp = 0;
    this.activeBossHpMax = 0;
    this.activeBossPhase = 0;
    this.players = playerConfigs.map((config, i) => createPlayer(config, i));
    return this;
  },

  addPlayer(config) {
    if (this.players.length >= 4) return null;

    const playerIndex = this.players.length;
    const player = createPlayer(config, playerIndex);
    this.players.push(player);
    this.isCoOp = this.players.filter(p => !p.isAI).length > 1;
    this.emit('playerJoined', { playerIndex, player });
    return player;
  },

  addXP(playerIndex, amount) {
    const player = getPlayer(playerIndex);
    player.xp += amount;

    let nextLevel = player.level + 1;
    while (nextLevel <= MAX_LEVEL && player.xp >= XP_THRESHOLDS[nextLevel]) {
      this.levelUp(playerIndex);
      nextLevel = player.level + 1;
    }
  },

  addEssence(playerIndex, amount) {
    const player = getPlayer(playerIndex);
    const mult = amount > 0 ? player.modifiers?.essenceGainMult || 1 : 1;
    const delta = amount > 0 ? Math.round(amount * mult) : amount;
    player.essence = Math.max(0, player.essence + delta);
    this.emit('essenceChanged', { playerIndex, essence: player.essence });
  },

  syncPlayerResources(playerIndex, resources) {
    const player = getPlayer(playerIndex);
    player.hp = Math.max(0, Math.min(player.hpMax, resources.health));
    player.mana = Math.max(0, Math.min(player.manaMax, resources.mana));
    player.surge = Math.max(0, Math.min(100, resources.surge));
  },

  syncPlayerDownState(playerIndex, { isDown = false, downTimer = 0 } = {}) {
    const player = getPlayer(playerIndex);
    const wasDown = player.isDown;
    player.isDown = isDown;
    player.downTimer = downTimer;
    if (isDown && !wasDown) player.stats.timesDown += 1;
  },

  recordDamageDealt(playerIndex, amount) {
    const player = getPlayer(playerIndex);
    player.stats.damageDealt += Math.max(0, Math.round(amount));
  },

  recordDamageTaken(playerIndex, amount) {
    const player = getPlayer(playerIndex);
    player.stats.damageTaken += Math.max(0, Math.round(amount));
  },

  recordSpellCast(playerIndex) {
    const player = getPlayer(playerIndex);
    player.stats.spellsCast += 1;
  },

  recordCombo(playerIndex, comboCount) {
    const player = getPlayer(playerIndex);
    player.stats.highestCombo = Math.max(player.stats.highestCombo, comboCount);
  },

  grantKillRewards(playerIndex, reward = {}, attackType = 'light', comboCount = 0) {
    const player = getPlayer(playerIndex);
    player.stats.kills += 1;

    const killXp = attackType === 'heavy' || attackType === 'ultimate' ? 25 : 10;
    const comboBonus = comboCount >= 10 ? 50 : comboCount >= 5 ? 20 : 0;
    this.addXP(playerIndex, reward.xp ?? killXp);
    if (comboBonus > 0) this.addXP(playerIndex, comboBonus);
    if (reward.essence) this.addEssence(playerIndex, reward.essence);
  },

  onRunWipe() {
    const keptEssence = this.players.map(player => Math.floor(player.essence * WIPE_ESSENCE_KEEP_RATE));
    this.runWiped = true;
    this.activeBossId = null;
    this.activeBossName = null;
    this.activeBossHp = 0;
    this.activeBossHpMax = 0;
    this.activeBossPhase = 0;
    this.emit('runWiped', { keptEssence });
    return keptEssence;
  },

  resetAfterWipe(keptEssence = null) {
    const carry = keptEssence || this.players.map(player => Math.floor(player.essence * WIPE_ESSENCE_KEEP_RATE));
    const configs = this.players.map((player, i) => ({
      hunterId: player.hunterId,
      isAI: player.isAI,
      carryEssence: carry[i] || 0,
    }));

    this.runId = Date.now().toString();
    this.runTimer = 0;
    this.zonesCleared = 0;
    this.currentZone = HUB_ZONE_ID;
    this.isCoOp = configs.filter(p => !p.isAI).length > 1;
    this.runComplete = false;
    this.runWiped = false;
    this.pendingCardPick = false;
    this.cardLevel = null;
    this.pendingLevelUps = [];
    this.activeBossId = null;
    this.activeBossName = null;
    this.activeBossHp = 0;
    this.activeBossHpMax = 0;
    this.activeBossPhase = 0;
    this.players = configs.map((config, i) => createPlayer(config, i));
    this.emit('runReset', { players: this.players });
    return this;
  },

  onZoneComplete(zoneId) {
    assertValidZone(zoneId);

    this.zonesCleared += 1;
    for (let i = 0; i < this.players.length; i += 1) {
      const player = this.players[i];
      player.hp = Math.min(player.hp + ZONE_CLEAR_HP_RESTORE, player.hpMax);
      player.shopBuysThisVisit = 0;
      player.secondWindReady = !!player.modifiers?.secondWind;
    }
    this.currentZone = HUB_ZONE_ID;
    this.currentZoneLabel = 'Hunter HQ';
    this.currentZoneNumber = 0;
    this.activeBossId = null;
    this.activeBossName = null;
    this.activeBossHp = 0;
    this.activeBossHpMax = 0;
    this.activeBossPhase = 0;
    if (this.zonesCleared === ZONE_ORDER.length) this.runComplete = true;
    this.emit('zoneComplete', { zoneId, zonesCleared: this.zonesCleared });
  },

  onZoneEntry(zoneId) {
    assertValidZone(zoneId);

    this.currentZone = zoneId;
    this.currentZoneLabel = zoneId;
    this.currentZoneNumber = ZONE_ORDER.indexOf(zoneId) + 1;
    this.activeBossId = null;
    this.activeBossName = null;
    this.activeBossHp = 0;
    this.activeBossHpMax = 0;
    this.activeBossPhase = 0;
    for (let i = 0; i < this.players.length; i += 1) {
      const player = this.players[i];
      player.mana = player.manaMax;
      player.surge = 0;
      player.isDown = false;
      player.downTimer = 0;
      player.shopBuysThisVisit = 0;
      player.secondWindReady = !!player.modifiers?.secondWind;
    }
    this.emit('zoneEntry', { zoneId });
  },

  setZoneInfo({ zoneId, zoneLabel = zoneId, zoneNumber = 0 } = {}) {
    if (zoneId) this.currentZone = zoneId;
    this.currentZoneLabel = zoneLabel;
    this.currentZoneNumber = zoneNumber;
  },

  setBossInfo({ bossId = null, bossName = null, hp = 0, hpMax = 0, phase = 0 } = {}) {
    this.activeBossId = bossId;
    this.activeBossName = bossName;
    this.activeBossHp = hp;
    this.activeBossHpMax = hpMax;
    this.activeBossPhase = phase;
  },

  clearBossInfo() {
    this.activeBossId = null;
    this.activeBossName = null;
    this.activeBossHp = 0;
    this.activeBossHpMax = 0;
    this.activeBossPhase = 0;
  },

  queueLevelUp(playerIndex, level) {
    const player = getPlayer(playerIndex);
    const choices = getCardChoices(player, level);
    if (!choices.length) return null;

    const entry = {
      playerIndex,
      level,
      choices,
    };
    this.pendingLevelUps.push(entry);
    this.pendingCardPick = true;
    this.cardLevel = this.pendingLevelUps[0]?.level || level;
    this.emit('levelupQueued', entry);
    return entry;
  },

  applyCardChoice(playerIndex, cardId) {
    const pendingIndex = this.pendingLevelUps.findIndex(entry => entry.playerIndex === playerIndex);
    if (pendingIndex === -1) return false;

    const pending = this.pendingLevelUps[pendingIndex];
    const card = pending.choices.find(choice => choice.id === cardId) || pending.choices[0];
    if (!card) return false;

    const player = getPlayer(playerIndex);
    if (!player.ownedCards.includes(card.id)) player.ownedCards.push(card.id);
    applyEffect(player, card.effect);

    this.pendingLevelUps.splice(pendingIndex, 1);
    refreshQueuedCardChoices(playerIndex);
    this.pendingCardPick = this.pendingLevelUps.length > 0;
    this.cardLevel = this.pendingLevelUps[0]?.level || null;
    this.emit('cardApplied', { playerIndex, card, player });
    return true;
  },

  applyShopItem(playerIndex, itemId, { free = false } = {}) {
    const item = getShopItemById(itemId);
    if (!item) return { ok: false, reason: 'unknown-item' };

    const player = getPlayer(playerIndex);
    const paid = !free && !item.cosmetic;
    if (paid && player.shopBuysThisVisit >= 2) return { ok: false, reason: 'purchase-limit' };
    if (paid && player.essence < item.cost) return { ok: false, reason: 'insufficient-essence' };
    if (!item.consumable && player.activeShopItems.includes(item.id)) {
      return { ok: false, reason: 'already-owned' };
    }

    if (paid) {
      player.essence -= item.cost;
      player.shopBuysThisVisit += 1;
    }
    if (!item.consumable && !player.activeShopItems.includes(item.id)) {
      player.activeShopItems.push(item.id);
    }
    applyEffect(player, item.effect);
    this.emit('shopItemApplied', { playerIndex, item, player });
    this.emit('essenceChanged', { playerIndex, essence: player.essence });
    return { ok: true, item, player };
  },

  levelUp(playerIndex) {
    const player = getPlayer(playerIndex);
    if (player.level >= MAX_LEVEL) return;

    player.level += 1;
    if (player.level >= 3 && !player.advancedSpellId) {
      player.advancedSpellId = HUNTER_BASE_STATS[player.hunterId].advancedSpell;
    }
    if (player.level >= 9 && !player.ultimateSpellId) {
      player.ultimateSpellId = HUNTER_BASE_STATS[player.hunterId].ultimateSpell;
    }

    if (shouldQueueCardLevel(player.level)) {
      this.queueLevelUp(playerIndex, player.level);
    }
    this.emit('levelup', { playerIndex, level: player.level });
  },

  tick(deltaSeconds) {
    this.runTimer += deltaSeconds;
  },
};
