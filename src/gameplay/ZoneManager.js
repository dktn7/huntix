import { createCityBreachArena } from '../visuals/CityBreachArena.js';
import { RuinDenArena } from '../visuals/RuinDenArena.js';
import { ShadowCoreArena } from '../visuals/ShadowCoreArena.js';
import { ThunderSpireArena } from '../visuals/ThunderSpireArena.js';
import { CITY_BREACH, RUIN_DEN, SHADOW_CORE, THUNDER_SPIRE } from '../visuals/Palettes.js';

export const ZONE_ORDER = ['city-breach', 'ruin-den', 'shadow-core', 'thunder-spire'];

export const ZONE_CONFIGS = {
  'city-breach': {
    id: 'city-breach',
    number: 1,
    label: 'City Breach',
    portalColor: CITY_BREACH.gateFire,
    portalX: -6.8,
    waves: [
      { grunts: 4 },
      { grunts: 3, ranged: 1 },
      { grunts: 2, bruisers: 1 },
    ],
    miniboss: {
      id: 'stampede',
      name: 'The Stampede',
      flavor: 'The gate opened. It ran. It has not stopped.',
      hp: 550,
      color: CITY_BREACH.gateFireDeep,
      spawnX: 10.8,
      spawnY: -1,
      speed: 1.2,
      moveRange: 0.35,
      phaseThresholds: [0.5],
      patterns: {
        1: [
          { key: 'charge', kind: 'dash', telegraph: 1.2, recover: 0.8, damage: 30, width: 38, height: 1.2, lifetime: 0.5, knockbackX: 3.6, knockbackY: 0.3, travel: 14 },
          { key: 'stomp', kind: 'radial', telegraph: 0.7, recover: 0.5, damage: 20, radius: 2.0, knockbackX: 1.6, knockbackY: 0.5, attackType: 'floor', jumpable: true },
          { key: 'sweep', kind: 'arc', telegraph: 0.5, recover: 0.4, damage: 25, radius: 2.5, arcCos: -1, knockbackX: 2.4, knockbackY: 0.35, jumpable: true },
        ],
        2: [
          { key: 'burning-charge', kind: 'dash', telegraph: 0.75, recover: 0.5, damage: 35, width: 40, height: 1.2, lifetime: 0.45, knockbackX: 3.8, knockbackY: 0.35, statusType: 'BURN', trail: true, trailLength: 18, trailWidth: 1.0, trailDamage: 4, trailLifetime: 4, travel: 16 },
          { key: 'ring-of-fire', kind: 'radial', telegraph: 0.7, recover: 0.5, damage: 15, radius: 3.0, knockbackX: 1.8, knockbackY: 0.55, attackType: 'floor', statusType: 'BURN', jumpable: true },
          { key: 'fire-sweep', kind: 'arc', telegraph: 0.5, recover: 0.4, damage: 28, radius: 2.5, arcCos: -1, knockbackX: 2.8, knockbackY: 0.35, statusType: 'BURN', jumpable: true },
        ],
      },
      phaseAdds: {},
      immuneStatuses: [],
      reward: { xp: 800, essence: 180 },
    },
    boss: {
      id: 'vrael',
      name: 'VRAEL',
      hp: 4000,
      color: CITY_BREACH.gateFire,
      spawnX: 11.2,
      spawnY: -1,
      phaseThresholds: [0.6],
      patterns: {
        1: [
          { key: 'flame-charge', kind: 'dash', telegraph: 1.0, recover: 0.45, damage: 44, width: 4.8, height: 1.2, knockbackX: 3.8, knockbackY: 0.35 },
          { key: 'swipe', kind: 'arc', telegraph: 0.6, recover: 0.38, damage: 36, radius: 2.3, arcCos: -0.25, knockbackX: 2.5, knockbackY: 0.45 },
        ],
        2: [
          { key: 'fire-pools', kind: 'pool', telegraph: 0.85, recover: 0.55, damage: 34, radius: 1.8, count: 3, lifetime: 0.9, knockbackX: 1.8, knockbackY: 0.55, attackType: 'floor', statusType: 'BURN', jumpable: true },
          { key: 'flame-charge-plus', kind: 'dash', telegraph: 0.65, recover: 0.4, damage: 52, width: 5.2, height: 1.4, knockbackX: 4.0, knockbackY: 0.4 },
        ],
      },
      phaseAdds: {},
      immuneStatuses: ['BURN'],
      reward: { xp: 500, essence: 200 },
    },
  },
  'ruin-den': {
    id: 'ruin-den',
    number: 2,
    label: 'Ruin Den',
    portalColor: RUIN_DEN.fissure,
    portalX: -2.2,
    waves: [
      { grunts: 3, ranged: 2 },
      { bruisers: 2 },
      { grunts: 4, bruisers: 1, ranged: 1 },
    ],
    miniboss: {
      id: 'tomb-crawler',
      name: 'The Tomb Crawler',
      flavor: 'It was here long before the ruins. The ruins grew around it.',
      hp: 650,
      color: RUIN_DEN.stone,
      spawnX: 10.8,
      spawnY: -1,
      speed: 1.6,
      moveRange: 0.55,
      phaseThresholds: [0.5],
      patterns: {
        1: [
          { key: 'surface-bite', kind: 'emerge-bite', telegraph: 0.7, recover: 1.0, damage: 35, length: 2.0, height: 1.1, lifetime: 0.3, knockbackX: 2.5, knockbackY: 0.45 },
          { key: 'tail-whip', kind: 'arc', telegraph: 0.55, recover: 0.8, damage: 20, radius: 3.0, arcCos: -1, knockbackX: 2.0, knockbackY: 0.45, jumpable: true },
        ],
        2: [
          { key: 'surface-bite', kind: 'emerge-bite', telegraph: 0.55, recover: 0.65, damage: 35, length: 2.1, height: 1.1, lifetime: 0.3, knockbackX: 2.8, knockbackY: 0.45 },
          { key: 'segment-slam', kind: 'multi', telegraph: 0.65, recover: 0.55, damage: 20, radius: 1.5, count: 2, lifetime: 0.35, knockbackX: 1.8, knockbackY: 0.55, attackType: 'floor', jumpable: true },
          { key: 'tail-whip', kind: 'arc', telegraph: 0.45, recover: 0.55, damage: 24, radius: 3.0, arcCos: -1, knockbackX: 2.2, knockbackY: 0.45, jumpable: true },
        ],
      },
      phaseAdds: {},
      immuneStatuses: ['STUN'],
      reward: { xp: 800, essence: 180 },
    },
    boss: {
      id: 'zarth',
      name: 'ZARTH',
      hp: 5000,
      color: RUIN_DEN.fissure,
      spawnX: 11.2,
      spawnY: -1,
      phaseThresholds: [0.6],
      patterns: {
        1: [
          { key: 'slam', kind: 'radial', telegraph: 1.0, recover: 0.65, damage: 52, radius: 2.9, knockbackX: 1.7, knockbackY: 0.75, attackType: 'floor', jumpable: true },
          { key: 'arm-wall', kind: 'wall', telegraph: 0.8, recover: 0.5, damage: 40, width: 1.4, height: 6.2, offset: 1.7, knockbackX: 3.1, knockbackY: 0.35 },
        ],
        2: [
          { key: 'rubble-spawn', kind: 'multi', telegraph: 0.9, recover: 0.65, damage: 58, radius: 2.8, knockbackX: 2.0, knockbackY: 0.6, attackType: 'floor', jumpable: true, adds: { grunts: 2 } },
          { key: 'crumble-pulse', kind: 'radial', telegraph: 0.95, recover: 0.65, damage: 64, radius: 3.4, knockbackX: 2.1, knockbackY: 0.7, attackType: 'floor', jumpable: true },
          { key: 'slam-plus', kind: 'radial', telegraph: 0.7, recover: 0.55, damage: 58, radius: 3.1, knockbackX: 2.0, knockbackY: 0.65, attackType: 'floor', jumpable: true },
        ],
      },
      phaseAdds: {},
      immuneStatuses: ['STUN'],
      reward: { xp: 500, essence: 200 },
    },
  },
  'shadow-core': {
    id: 'shadow-core',
    number: 3,
    label: 'Shadow Core',
    portalColor: SHADOW_CORE.violet,
    portalX: 2.4,
    waves: [
      { grunts: 5, ranged: 1 },
      { bruisers: 2, ranged: 2 },
      { grunts: 3, bruisers: 2 },
    ],
    boss: {
      id: 'kibad',
      name: 'KIBAD',
      hp: 4500,
      color: SHADOW_CORE.bloom,
      spawnX: 11.0,
      spawnY: -1,
      phaseThresholds: [0.6],
      patterns: {
        1: [
          { key: 'blink-slash', kind: 'blink', telegraph: 0.5, recover: 0.42, damage: 42, radius: 2.0, blinkOffset: 1.05, knockbackX: 2.8, knockbackY: 0.45 },
          { key: 'dagger-combo', kind: 'line', telegraph: 0.55, recover: 0.38, damage: 44, width: 3.6, height: 1.2, knockbackX: 2.4, knockbackY: 0.35 },
        ],
        2: [
          { key: 'twin-clones', kind: 'multi', telegraph: 0.8, recover: 0.55, damage: 48, radius: 2.6, knockbackX: 2.0, knockbackY: 0.55, adds: { grunts: 2 } },
          { key: 'radiant-burst', kind: 'radial', telegraph: 0.9, recover: 0.6, damage: 62, radius: 3.4, knockbackX: 2.2, knockbackY: 0.6, attackType: 'floor', jumpable: true },
          { key: 'blink-slash-plus', kind: 'blink', telegraph: 0.38, recover: 0.38, damage: 50, radius: 2.2, blinkOffset: 1.0, knockbackX: 3.0, knockbackY: 0.45 },
        ],
      },
      phaseAdds: {},
      immuneStatuses: ['BLEED'],
      reward: { xp: 500, essence: 200 },
    },
  },
  'thunder-spire': {
    id: 'thunder-spire',
    number: 4,
    label: 'Thunder Spire',
    portalColor: THUNDER_SPIRE.lightning,
    portalX: 6.8,
    waves: [
      { grunts: 4, ranged: 2 },
      { bruisers: 3 },
      { grunts: 2, bruisers: 2, ranged: 3 },
    ],
    boss: {
      id: 'thyxis',
      name: 'THYXIS',
      hp: 6000,
      color: THUNDER_SPIRE.lightning,
      spawnX: 11.0,
      spawnY: -1,
      phaseThresholds: [0.7, 0.4],
      patterns: {
        1: [
          { key: 'ground-pound', kind: 'radial', telegraph: 0.85, recover: 0.5, damage: 56, radius: 3.0, knockbackX: 1.9, knockbackY: 0.75, attackType: 'floor', jumpable: true },
          { key: 'claw-combo', kind: 'arc', telegraph: 0.6, recover: 0.42, damage: 50, radius: 2.5, arcCos: -0.18, knockbackX: 2.4, knockbackY: 0.45 },
        ],
        2: [
          { key: 'bolt-dive', kind: 'dash', telegraph: 0.7, recover: 0.5, damage: 72, width: 3.8, height: 1.5, knockbackX: 3.7, knockbackY: 0.45 },
          { key: 'chain-lightning', kind: 'chain', telegraph: 0.9, recover: 0.6, damage: 62, radius: 1.9, targets: 4, knockbackX: 2.2, knockbackY: 0.6 },
        ],
        3: [
          { key: 'storm-zones', kind: 'storm', telegraph: 0.95, recover: 0.65, damage: 46, radius: 1.8, count: 4, lifetime: 1.0, knockbackX: 2.2, knockbackY: 0.7, attackType: 'floor', jumpable: true, adds: { grunts: 2 } },
          { key: 'bolt-dive-plus', kind: 'dash', telegraph: 0.52, recover: 0.45, damage: 82, width: 4.2, height: 1.6, knockbackX: 4.0, knockbackY: 0.5 },
        ],
      },
      phaseAdds: {},
      immuneStatuses: ['SLOW'],
      reward: { xp: 500, essence: 200 },
    },
  },
};

export class ZoneManager {
  constructor(scene) {
    this.scene = scene;
    this.activeZoneId = null;
    this._arenaMap = {
      'city-breach': createCityBreachArena(),
      'ruin-den': new RuinDenArena(scene).build(),
      'shadow-core': new ShadowCoreArena(scene).build(),
      'thunder-spire': new ThunderSpireArena(scene).build(),
    };

    for (const zoneId of ZONE_ORDER) {
      const arena = this._arenaMap[zoneId];
      if (arena) arena.visible = false;
    }
  }

  getZoneConfig(zoneId) {
    return ZONE_CONFIGS[zoneId] || null;
  }

  getZoneByIndex(index) {
    return ZONE_ORDER[index] || null;
  }

  getNextZoneId(zoneId) {
    const index = ZONE_ORDER.indexOf(zoneId);
    if (index === -1) return null;
    return ZONE_ORDER[index + 1] || null;
  }

  getUnlockedZoneIds(zonesCleared) {
    const count = Math.max(1, Math.min(ZONE_ORDER.length, zonesCleared + 1));
    return ZONE_ORDER.slice(0, count);
  }

  showZone(zoneId) {
    this.activeZoneId = zoneId;
    for (const key of ZONE_ORDER) {
      const arena = this._arenaMap[key];
      if (arena) arena.visible = key === zoneId;
    }
    return this.getZoneConfig(zoneId);
  }

  showHub() {
    this.activeZoneId = null;
    for (const key of ZONE_ORDER) {
      const arena = this._arenaMap[key];
      if (arena) arena.visible = false;
    }
  }

  getActiveArena() {
    if (!this.activeZoneId) return null;
    return this._arenaMap[this.activeZoneId] || null;
  }

  getCurrentZoneLabel() {
    const config = this.getZoneConfig(this.activeZoneId);
    return config?.label || 'Hub';
  }

  getPortalLayout() {
    return ZONE_ORDER.map(zoneId => {
      const config = this.getZoneConfig(zoneId);
      return {
        zoneId,
        label: config.label,
        number: config.number,
        color: config.portalColor,
        x: config.portalX,
      };
    });
  }

  update(dt, focusX = 0) {
    const arena = this.getActiveArena();
    if (!arena || typeof arena.update !== 'function') return;
    arena.update(dt, focusX);
  }

  dispose() {
    for (const arena of Object.values(this._arenaMap)) {
      if (arena && typeof arena.dispose === 'function') arena.dispose();
    }
  }
}
