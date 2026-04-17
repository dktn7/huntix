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

const XP_THRESHOLDS = {
  2: 300,
  3: 700,
  4: 1300,
  5: 2000,
  6: 3000,
  7: 4200,
  8: 5600,
  9: 7200,
  10: 9000,
};

const MAX_LEVEL = 10;
const ZONE_CLEAR_HP_RESTORE = 30;
const WIPE_ESSENCE_KEEP_RATE = 0.5;

const VALID_ZONES = {
  hub: true,
  'city-breach': true,
  'ruin-den': true,
  'shadow-core': true,
  'thunder-spire': true,
};

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

export const RunState = {
  runId: null,
  runTimer: 0,
  zonesCleared: 0,
  currentZone: 'hub',
  currentZoneLabel: 'Hub',
  currentZoneNumber: 0,
  isCoOp: false,
  runComplete: false,
  runWiped: false,
  pendingCardPick: false,
  cardLevel: null,
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
    this.currentZone = 'hub';
    this.currentZoneLabel = 'Hub';
    this.currentZoneNumber = 0;
    this.isCoOp = playerConfigs.filter(p => !p.isAI).length > 1;
    this.runComplete = false;
    this.runWiped = false;
    this.pendingCardPick = false;
    this.cardLevel = null;
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

    const nextLevel = player.level + 1;
    if (nextLevel <= MAX_LEVEL && player.xp >= XP_THRESHOLDS[nextLevel]) {
      this.levelUp(playerIndex);
    }
  },

  addEssence(playerIndex, amount) {
    const player = getPlayer(playerIndex);
    player.essence += amount;
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
    this.currentZone = 'hub';
    this.isCoOp = configs.filter(p => !p.isAI).length > 1;
    this.runComplete = false;
    this.runWiped = false;
    this.pendingCardPick = false;
    this.cardLevel = null;
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
    }
    this.currentZone = 'hub';
    this.currentZoneLabel = 'Hub';
    this.currentZoneNumber = 0;
    this.activeBossId = null;
    this.activeBossName = null;
    this.activeBossHp = 0;
    this.activeBossHpMax = 0;
    this.activeBossPhase = 0;
    if (this.zonesCleared === 4) this.runComplete = true;
    this.emit('zoneComplete', { zoneId, zonesCleared: this.zonesCleared });
  },

  onZoneEntry(zoneId) {
    assertValidZone(zoneId);

    this.currentZone = zoneId;
    this.currentZoneLabel = zoneId;
    this.currentZoneNumber = ['city-breach', 'ruin-den', 'shadow-core', 'thunder-spire'].indexOf(zoneId) + 1;
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

    this.pendingCardPick = true;
    this.cardLevel = player.level;
    this.emit('levelup', { playerIndex, level: player.level });
  },

  tick(deltaSeconds) {
    this.runTimer += deltaSeconds;
  },
};
