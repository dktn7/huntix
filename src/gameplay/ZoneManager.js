import { CityBreachArena } from '../visuals/CityBreachArena.js';
import { RuinDenArena } from '../visuals/RuinDenArena.js';
import { ShadowCoreArena } from '../visuals/ShadowCoreArena.js';
import { ThunderSpireArena } from '../visuals/ThunderSpireArena.js';
import { CITY_BREACH, RUIN_DEN, SHADOW_CORE, THUNDER_SPIRE } from '../visuals/Palettes.js';

// Ordered list of combat zones — hub is intentionally excluded (it is a
// neutral zone that sits outside the linear progression sequence).
export const ZONE_ORDER = ['city-breach', 'ruin-den', 'shadow-core', 'thunder-spire'];

export const HUB_ZONE_ID = 'hub';
const HUB_PLAY_BOUNDS = { minX: -8.4, maxX: 8.4, minY: -4.25, maxY: 3.35 };
const CITY_PLAY_BOUNDS = { minX: -8.25, maxX: 8.25, minY: -4.25, maxY: 3.25 };
const RUIN_PLAY_BOUNDS = { minX: -8.2, maxX: 8.2, minY: -4.2, maxY: 3.2 };
const SHADOW_PLAY_BOUNDS = { minX: -8.25, maxX: 8.25, minY: -4.2, maxY: 3.2 };
const THUNDER_PLAY_BOUNDS = { minX: -8.2, maxX: 8.2, minY: -4.15, maxY: 3.2 };
const DEFAULT_TILT_DEG = 11;
const DEG_TO_RAD = Math.PI / 180;

const SHARED_PARALLAX_LAYERS = [
  { id: 'background', z: -20, speed: 0.05, opacity: 0.9 },
  { id: 'midground', z: -8, speed: 0.30, opacity: 0.72 },
  { id: 'foreground', z: -1, speed: 0.80, opacity: 0.46 },
];

function createParallaxProfile(texture, palette = {}) {
  return {
    layers: SHARED_PARALLAX_LAYERS.map((layer) => {
      const tint = palette[layer.id] ?? 0xffffff;
      return {
        ...layer,
        texture,
        tint,
      };
    }),
  };
}

function createCameraProfile(tiltDeg = DEFAULT_TILT_DEG) {
  return {
    tiltX: tiltDeg * DEG_TO_RAD,
  };
}

function createVisualScaleProfile(multiplier = 1.08, structure = 1.26, props = 1.12) {
  return {
    worldModelScale: multiplier,
    structureScale: structure,
    propScale: props,
    spriteVisualHeight: 1.1,
  };
}

export const ZONE_CONFIGS = {
  // ---------------------------------------------------------------------------
  // Hub — neutral safe zone, no waves, no boss
  // ---------------------------------------------------------------------------
  'hub': {
    id: 'hub',
    number: 0,
    label: 'Hunter HQ',
    // Hub uses its own 3D backdrop managed by SceneManager._setupHubBackdrop /
    // _setupHubPortals, so no arena class or clearBg is needed here.
    waves: [],
    boss: null,
    neutral: true,
    cameraProfile: createCameraProfile(11.8),
    parallaxProfile: createParallaxProfile('./assets/textures/props/hub/colormap.png', {
      background: 0x4f6da9,
      midground: 0x3a537e,
      foreground: 0x1a253b,
    }),
    visualScaleProfile: createVisualScaleProfile(1.09, 1.24, 1.1),
    playBounds: HUB_PLAY_BOUNDS,
    blockers: [
      { x: -7.2, y: -1.45, width: 2.5, height: 1.1 },
      { x: 1.9, y: 0.65, width: 1.5, height: 1.0 },
      { x: 6.9, y: -0.25, width: 2.8, height: 2.5 },
    ],
    roomProfile: {
      bounds: HUB_PLAY_BOUNDS,
      floorColor: 0x1b2230,
      wallColor: 0x222f49,
      frontWallColor: 0x1a253b,
      trimColor: 0x5a77b7,
      pillarColor: 0x324463,
      laneColor: 0x2e4364,
      bgLayerColor: 0x87a9ff,
      fgLayerColor: 0x111a2a,
      laneY: -2.2,
    },
  },

  // ---------------------------------------------------------------------------
  // Combat zones (in ZONE_ORDER sequence)
  // ---------------------------------------------------------------------------
  'city-breach': {
    id: 'city-breach',
    number: 1,
    label: 'City Breach',
    clearBg: './assets/backgrounds/clear-city.jpeg',
    portalColor: CITY_BREACH.gateFire,
    portalX: 4.8,
    enemyTint: 0xffefe1,
    cameraProfile: createCameraProfile(),
    parallaxProfile: createParallaxProfile('./assets/textures/props/city-breach/colormap.png', {
      background: 0x050509,
      midground: 0x28190f,
      foreground: 0x3b2212,
    }),
    visualScaleProfile: createVisualScaleProfile(1.08, 1.28, 1.12),
    playBounds: CITY_PLAY_BOUNDS,
    blockers: [
      { x: -6.95, y: -1.15, width: 1.65, height: 2.1 },
      { x: 7.0, y: -2.2, width: 1.45, height: 1.5 },
    ],
    roomProfile: {
      bounds: CITY_PLAY_BOUNDS,
      floorColor: CITY_BREACH.charcoal,
      wallColor: 0x2f3444,
      frontWallColor: 0x252b37,
      trimColor: 0xe58a2d,
      pillarColor: 0x3a3643,
      laneColor: 0x465061,
      bgLayerColor: 0xff8f5b,
      fgLayerColor: 0x141923,
      laneY: -2.2,
    },
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
    clearBg: './assets/backgrounds/clear-ruin.jpeg',
    portalColor: RUIN_DEN.fissure,
    portalX: 6.0,
    enemyTint: 0xf4e8d6,
    cameraProfile: createCameraProfile(),
    parallaxProfile: createParallaxProfile('./assets/textures/props/ruin-den/colormap.png', {
      background: 0x080604,
      midground: 0x2d1f17,
      foreground: 0x3e2a1d,
    }),
    visualScaleProfile: createVisualScaleProfile(1.1, 1.3, 1.14),
    playBounds: RUIN_PLAY_BOUNDS,
    blockers: [
      { x: -6.8, y: 0.45, width: 1.15, height: 2.7 },
      { x: 6.8, y: 0.45, width: 1.15, height: 2.7 },
    ],
    roomProfile: {
      bounds: RUIN_PLAY_BOUNDS,
      floorColor: RUIN_DEN.floor,
      wallColor: 0x3e352e,
      frontWallColor: 0x322b26,
      trimColor: RUIN_DEN.fissure,
      pillarColor: 0x53463c,
      laneColor: 0x5f5548,
      bgLayerColor: 0xc99873,
      fgLayerColor: 0x1d1712,
      laneY: -2.2,
    },
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
    clearBg: './assets/backgrounds/clear-void.jpeg',
    portalColor: SHADOW_CORE.violet,
    portalX: 7.2,
    enemyTint: 0xe9deff,
    cameraProfile: createCameraProfile(),
    parallaxProfile: createParallaxProfile('./assets/textures/props/shadow-core/colormap.png', {
      background: 0x010103,
      midground: 0x170f2e,
      foreground: 0x241845,
    }),
    visualScaleProfile: createVisualScaleProfile(1.09, 1.32, 1.12),
    playBounds: SHADOW_PLAY_BOUNDS,
    blockers: [
      { x: 6.75, y: 0.0, width: 2.1, height: 1.7 },
      { x: -6.9, y: -2.65, width: 1.6, height: 1.1 },
    ],
    roomProfile: {
      bounds: SHADOW_PLAY_BOUNDS,
      floorColor: SHADOW_CORE.floor,
      wallColor: 0x271f4a,
      frontWallColor: 0x1e1739,
      trimColor: SHADOW_CORE.bloom,
      pillarColor: 0x35295e,
      laneColor: 0x3e2f73,
      bgLayerColor: 0xb08cff,
      fgLayerColor: 0x150f26,
      laneY: -2.2,
    },
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
    clearBg: './assets/backgrounds/clear-spire.jpeg',
    portalColor: THUNDER_SPIRE.lightning,
    portalX: 8.4,
    enemyTint: 0xe3f6ff,
    cameraProfile: createCameraProfile(),
    parallaxProfile: createParallaxProfile('./assets/textures/props/thunder-spire/colormap.png', {
      background: 0x050812,
      midground: 0x1a2a4a,
      foreground: 0x2a3d63,
    }),
    visualScaleProfile: createVisualScaleProfile(1.08, 1.27, 1.13),
    playBounds: THUNDER_PLAY_BOUNDS,
    blockers: [
      { x: -6.75, y: -2.75, width: 1.85, height: 1.0 },
      { x: 7.15, y: 0.25, width: 1.45, height: 1.85 },
    ],
    roomProfile: {
      bounds: THUNDER_PLAY_BOUNDS,
      floorColor: THUNDER_SPIRE.floor,
      wallColor: 0x2f3951,
      frontWallColor: 0x262e42,
      trimColor: THUNDER_SPIRE.lightning,
      pillarColor: 0x4f5d78,
      laneColor: 0x3e4d6b,
      bgLayerColor: 0x89d9ff,
      fgLayerColor: 0x121a27,
      laneY: -2.2,
    },
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
      'city-breach': new CityBreachArena(scene, ZONE_CONFIGS['city-breach']),
      'ruin-den': new RuinDenArena(scene, ZONE_CONFIGS['ruin-den']),
      'shadow-core': new ShadowCoreArena(scene, ZONE_CONFIGS['shadow-core']),
      'thunder-spire': new ThunderSpireArena(scene, ZONE_CONFIGS['thunder-spire']),
    };

    for (const zoneId of ZONE_ORDER) {
      const arena = this._arenaMap[zoneId];
      if (!arena) continue;
      arena.build();
      arena.group.visible = false;
    }
  }

  getZoneConfig(zoneId) {
    return ZONE_CONFIGS[zoneId] || null;
  }

  getCameraProfile(zoneId) {
    return this.getZoneConfig(zoneId)?.cameraProfile || createCameraProfile();
  }

  getParallaxProfile(zoneId) {
    return this.getZoneConfig(zoneId)?.parallaxProfile || { layers: [] };
  }

  /** Returns true if zoneId is the neutral hub zone. */
  isHubZone(zoneId) {
    return zoneId === HUB_ZONE_ID;
  }

  getZoneByIndex(index) {
    return ZONE_ORDER[index] || null;
  }

  getNextZoneId(zoneId) {
    const index = ZONE_ORDER.indexOf(zoneId);
    if (index === -1) return null;
    return ZONE_ORDER[index + 1] || null;
  }

  getUnlockRequirement(zoneId) {
    const index = ZONE_ORDER.indexOf(zoneId);
    if (index <= 0) return null;
    const previousId = ZONE_ORDER[index - 1];
    const previous = this.getZoneConfig(previousId);
    return previous?.label || null;
  }

  getUnlockedZoneIds(zonesCleared) {
    const count = Math.max(1, Math.min(ZONE_ORDER.length, zonesCleared + 1));
    return ZONE_ORDER.slice(0, count);
  }

  /**
   * Returns the clear background image path for a zone, falling back to a
   * default if the zone has no clearBg defined.
   */
  getZoneClearBg(zoneId) {
    const config = this.getZoneConfig(zoneId);
    return config?.clearBg || './assets/backgrounds/clear-default.jpeg';
  }

  showZone(zoneId) {
    this.activeZoneId = zoneId;
    for (const key of ZONE_ORDER) {
      const arena = this._arenaMap[key];
      if (!arena) continue;
      arena.group.visible = key === zoneId;
    }
    return this.getZoneConfig(zoneId);
  }

  showHub() {
    this.activeZoneId = HUB_ZONE_ID;
    for (const key of ZONE_ORDER) {
      const arena = this._arenaMap[key];
      if (arena) arena.group.visible = false;
    }
  }

  getActiveArena() {
    if (!this.activeZoneId || this.activeZoneId === HUB_ZONE_ID) return null;
    return this._arenaMap[this.activeZoneId] || null;
  }

  getParallaxDebugInfo() {
    const arena = this.getActiveArena();
    if (!arena || typeof arena.getParallaxDebugInfo !== 'function') return [];
    return arena.getParallaxDebugInfo();
  }

  getActiveHazards(routeState = null) {
    const arena = this.getActiveArena();
    if (!arena || typeof arena.getActiveHazards !== 'function') return [];
    return arena.getActiveHazards(routeState);
  }

  getCurrentZoneLabel() {
    const config = this.getZoneConfig(this.activeZoneId);
    return config?.label || 'Hunter HQ';
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

  update(dt, focusX = 0, routeState = null) {
    const arena = this.getActiveArena();
    if (!arena || typeof arena.update !== 'function') return;
    arena.update(dt, focusX, routeState);
  }

  dispose() {
    for (const arena of Object.values(this._arenaMap)) {
      if (arena && typeof arena.dispose === 'function') arena.dispose();
    }
  }
}
