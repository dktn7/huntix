import * as THREE from 'three';
import { SpriteAnimator } from './SpriteAnimator.js';
import { HUNTERS } from './Palettes.js';

const SPRITE_HEIGHT = 1.5;
const HUNTER_SPRITES_DIR = 'assets/sprites/hunters';
const SHARED_SPRITES_DIR = 'assets/sprites';
const textureLoader = new THREE.TextureLoader();

const FALLBACKS = {
  dabik: { label: 'Dabik', width: 0.65, height: 1.25, bodyColor: 0x2d0040, lightColor: 0x8b4ddb },
  benzu: { label: 'Benzu', width: 0.9, height: 1.35, bodyColor: 0x5a2410, lightColor: 0xf39c12 },
  sereisa: { label: 'Sereisa', width: 0.58, height: 1.28, bodyColor: 0xd6c84f, lightColor: 0xf1c40f },
  vesol: { label: 'Vesol', width: 0.62, height: 1.25, bodyColor: 0x164a7a, lightColor: 0xe74c3c },
};

/** Loads one TexturePacker atlas and applies Huntix sprite texture settings. */
export async function loadHunterAtlas(hunterId) {
  const id = hunterId.toLowerCase();
  const atlasData = await loadAtlasJson(id);
  const texture = await loadAtlasTexture(id);

  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = false;
  return { texture, atlasData };
}

/** Creates a hunter sprite group with atlas animation when assets exist, otherwise a placeholder fallback. */
export function createHunterMesh({ hunterId = 'dabik', atlasTexture = null, atlasData = null } = {}) {
  const normalizedAtlas = normalizeAtlasData(atlasData);
  if (atlasTexture && Object.keys(normalizedAtlas.frames).length > 0) {
    return createAtlasHunterMesh(hunterId, atlasTexture, normalizedAtlas);
  }

  return createFallbackHunterMesh(hunterId);
}

/** Creates the real PlaneGeometry sprite quad for a hunter atlas. */
export function createAtlasHunterMesh(hunterId, atlasTexture, atlasData) {
  const group = new THREE.Group();
  const normalizedAtlas = normalizeAtlasData(atlasData);
  const firstFrame = Object.values(normalizedAtlas.frames)[0];
  const sourceSize = firstFrame?.sourceSize || firstFrame?.frame || { w: 64, h: 96 };
  const width = SPRITE_HEIGHT * (sourceSize.w / sourceSize.h);

  const geometry = new THREE.PlaneGeometry(width, SPRITE_HEIGHT);
  geometry.translate(0, SPRITE_HEIGHT / 2, 0);

  const material = new THREE.MeshBasicMaterial({
    map: atlasTexture.clone(),
    transparent: true,
    alphaTest: 0.1,
    side: THREE.FrontSide,
  });
  material.map.needsUpdate = true;

  const sprite = new THREE.Mesh(geometry, material);
  sprite.renderOrder = 0;
  group.add(sprite);

  const shadow = createDropShadow(width);
  group.add(shadow);

  group.userData.hunterId = hunterId;
  group.userData.spriteMesh = sprite;
  group.userData.bodyMesh = sprite;
  group.userData.shadowMesh = shadow;
  group.userData.animator = new SpriteAnimator(material, normalizedAtlas);
  return group;
}

/** Creates a no-asset placeholder that preserves the same group contract as real sprites. */
export function createFallbackHunterMesh(hunterId = 'dabik') {
  const key = hunterId.toLowerCase();
  const fallback = FALLBACKS[key] || FALLBACKS.dabik;
  const group = new THREE.Group();
  group.userData.hunterId = key;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(fallback.width, fallback.height, 0.1),
    new THREE.MeshBasicMaterial({ color: fallback.bodyColor })
  );
  body.position.y = fallback.height / 2;
  group.add(body);

  const accent = new THREE.Mesh(
    new THREE.PlaneGeometry(fallback.width * 0.8, 0.1),
    new THREE.MeshBasicMaterial({
      color: HUNTERS[fallback.label]?.secondary || fallback.lightColor,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })
  );
  accent.position.set(0, fallback.height * 0.85, 0.06);
  group.add(accent);

  const light = new THREE.PointLight(fallback.lightColor, 0.65, 2.5);
  light.position.set(0, 0.7, 0.35);
  group.add(light);

  const shadow = createDropShadow(fallback.width);
  group.add(shadow);

  group.userData.spriteMesh = body;
  group.userData.bodyMesh = body;
  group.userData.shadowMesh = shadow;
  group.userData.animator = null;
  return group;
}

/** Updates the render order for a hunter sprite group from its world Y position. */
export function ySortHunterMesh(group, worldY) {
  const renderOrder = Math.round(worldY * 100);
  group.renderOrder = renderOrder;
  if (group.userData.bodyMesh) group.userData.bodyMesh.renderOrder = renderOrder;
  if (group.userData.shadowMesh) group.userData.shadowMesh.renderOrder = renderOrder - 1;
}

export function createDabik() {
  return createFallbackHunterMesh('dabik');
}

export function createBenzu() {
  return createFallbackHunterMesh('benzu');
}

export function createSereisa() {
  return createFallbackHunterMesh('sereisa');
}

export function createVesol() {
  return createFallbackHunterMesh('vesol');
}

function createDropShadow(width) {
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 1.15, 0.25),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    })
  );
  shadow.position.set(0, 0.01, -0.02);
  shadow.renderOrder = -1;
  return shadow;
}

async function loadAtlasJson(hunterId) {
  const candidates = [
    `${HUNTER_SPRITES_DIR}/${hunterId}-atlas.json`,
    `${HUNTER_SPRITES_DIR}/${hunterId}.json`,
    `${SHARED_SPRITES_DIR}/${hunterId}.json`,
  ];

  for (const path of candidates) {
    try {
      const response = await fetch(path);
      if (!response.ok) continue;
      const atlasData = await response.json();
      return normalizeAtlasData(atlasData);
    } catch {
      // Try next candidate path.
    }
  }

  throw new Error(`Missing atlas data for ${hunterId}`);
}

async function loadAtlasTexture(hunterId) {
  const candidates = [
    `${HUNTER_SPRITES_DIR}/${hunterId}-atlas.webp`,
    `${HUNTER_SPRITES_DIR}/${hunterId}-atlas.png`,
    `${HUNTER_SPRITES_DIR}/${hunterId}.webp`,
    `${HUNTER_SPRITES_DIR}/${hunterId}.png`,
    `${SHARED_SPRITES_DIR}/${hunterId}.webp`,
    `${SHARED_SPRITES_DIR}/${hunterId}.png`,
  ];

  for (const path of candidates) {
    try {
      const texture = await new Promise((resolve, reject) => {
        textureLoader.load(path, resolve, undefined, reject);
      });
      return texture;
    } catch {
      // Try next candidate path.
    }
  }

  throw new Error(`Missing atlas texture for ${hunterId}`);
}

function normalizeAtlasData(atlasData) {
  if (!atlasData || typeof atlasData !== 'object') {
    return { frames: {}, meta: { size: { w: 1, h: 1 } } };
  }

  let frames = atlasData.frames;
  if (Array.isArray(frames)) {
    const mapped = {};
    for (const frame of frames) {
      if (!frame || typeof frame !== 'object') continue;
      const key = frame.filename || frame.name || frame.id;
      if (!key) continue;
      mapped[key] = frame;
    }
    frames = mapped;
  } else if (!frames || typeof frames !== 'object') {
    frames = {};
  }

  return {
    ...atlasData,
    frames,
    meta: atlasData.meta || { size: { w: 1, h: 1 } },
  };
}
