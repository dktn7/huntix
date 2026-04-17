import * as THREE from 'three';

/**
 * Design tokens from docs/VISUAL-DESIGN.md §12 and docs/ZONES.md (City Breach).
 * Use for sparks, auras, arena tints, and future FX.
 */

/** @typedef {{ primary: number, secondary: number, aura: number, auraColor: THREE.Color }} HunterPalette */

/** @type {Record<string, HunterPalette>} */
export const HUNTERS = {
  Dabik: {
    primary: 0x1a1a2e,
    secondary: 0x9b59b6,
    aura: 0x9b59b6,
    auraColor: new THREE.Color(0x9b59b6),
  },
  Benzu: {
    primary: 0xc0392b,
    secondary: 0xf39c12,
    aura: 0xf39c12,
    auraColor: new THREE.Color(0xf39c12),
  },
  Sereisa: {
    primary: 0xf1c40f,
    secondary: 0xecf0f1,
    aura: 0xf1c40f,
    auraColor: new THREE.Color(0xf1c40f),
  },
  Vesol: {
    primary: 0x2980b9,
    secondary: 0xe74c3c,
    aura: 0xe74c3c,
    auraColor: new THREE.Color(0xe74c3c),
  },
};

/** City Breach — ZONES: charcoal, orange fire glow, neon fragments. */
export const CITY_BREACH = {
  asphalt: 0x1a1a2e,
  gateFire: 0xff6b2d,
  gateFireDeep: 0xcc3300,
  neonCyan: 0x5edfff,
  neonMagenta: 0xff4da6,
  charcoal: 0x1c1c24,
  backWall: 0x0d0d1a,
};

/** Ruin Den â€” dark stone, dust, red-gold fissures. */
export const RUIN_DEN = {
  floor: 0x2a231d,
  stone: 0x4b4036,
  fissure: 0xa35a33,
  dust: 0xb79d86,
  void: 0x17120f,
};

/** Shadow Core â€” void, violet, white-gold bloom. */
export const SHADOW_CORE = {
  floor: 0x08080d,
  void: 0x040407,
  violet: 0x4d2d7a,
  bloom: 0xf4e9ff,
  silver: 0xc8d0ff,
};

/** Thunder Spire â€” storm navy, electric blue, white lightning. */
export const THUNDER_SPIRE = {
  floor: 0x11182f,
  storm: 0x22386b,
  lightning: 0x67d8ff,
  flash: 0xf7fbff,
  slate: 0x303648,
};

/** Shared combat FX (hit sparks, essence magnet). */
export const EFFECTS = {
  sparkHit: 0xfff2a8,
  essenceDrop: 0x7cfcff,
};
