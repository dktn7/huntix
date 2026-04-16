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
    isAI: config.isAI,
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
  isCoOp: false,
  runComplete: false,
  runWiped: false,
  pendingCardPick: false,
  cardLevel: null,
  players: [],

  on,
  off,
  emit,

  init(playerConfigs) {
    this.runId = Date.now().toString();
    this.runTimer = 0;
    this.zonesCleared = 0;
    this.currentZone = 'hub';
    this.isCoOp = playerConfigs.filter(p => !p.isAI).length > 1;
    this.runComplete = false;
    this.runWiped = false;
    this.pendingCardPick = false;
    this.cardLevel = null;
    this.players = playerConfigs.map((config, i) => createPlayer(config, i));
    return this;
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

  onRunWipe() {
    const keptEssence = this.players.map(player => Math.floor(player.essence * WIPE_ESSENCE_KEEP_RATE));
    this.runWiped = true;
    this.emit('runWiped', { keptEssence });
    return keptEssence;
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
    if (this.zonesCleared === 4) this.runComplete = true;
    this.emit('zoneComplete', { zoneId, zonesCleared: this.zonesCleared });
  },

  onZoneEntry(zoneId) {
    assertValidZone(zoneId);

    this.currentZone = zoneId;
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

    for (let i = 0; i < this.players.length; i += 1) {
      const player = this.players[i];
      if (!player.isDown || player.downTimer <= 0) continue;

      player.downTimer -= deltaSeconds;
      if (player.downTimer <= 0) {
        player.downTimer = 0;
        player.hp = 0;
        this.emit('playerEliminated', { playerIndex: player.playerIndex });
      }
    }
  },
};
