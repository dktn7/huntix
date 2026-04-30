import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();

/** Loads one sprite atlas (JSON + texture) from ordered path candidates. */
export async function loadAtlasFromCandidates({ jsonCandidates = [], textureCandidates = [] } = {}) {
  const atlasData = await loadAtlasJsonCandidates(jsonCandidates);
  const texture = await loadTextureCandidates(textureCandidates);
  if (!atlasData || !texture) return null;

  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = false;
  return { atlasData, texture };
}

/** Normalizes TexturePacker exports into a predictable { frames, meta } shape. */
export function normalizeAtlasData(atlasData) {
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

/** Picks the first available frame key that matches the supplied state names. */
export function findFrameKeyForStates(atlasData, states = []) {
  const normalized = normalizeAtlasData(atlasData);
  const keys = Object.keys(normalized.frames || {});
  if (!keys.length) return null;

  const frameInfos = keys
    .map((key) => ({
      key,
      normalizedKey: normalizeFrameKey(key),
      index: extractFrameIndex(key),
    }))
    .sort((a, b) => (a.index - b.index) || a.normalizedKey.localeCompare(b.normalizedKey));

  for (const rawState of states) {
    const state = String(rawState || '').toLowerCase().trim();
    if (!state) continue;

    const strictPattern = new RegExp(`(?:^|_)${escapeRegExp(state)}(?:_|$)`);
    const strictMatch = frameInfos.find((info) => strictPattern.test(info.normalizedKey));
    if (strictMatch) return strictMatch.key;
  }

  return frameInfos[0].key;
}

/** Applies one atlas frame to a texture via offset/repeat UV windowing. */
export function applyAtlasFrame(texture, atlasData, frameKey) {
  if (!texture || !frameKey) return false;

  const normalized = normalizeAtlasData(atlasData);
  const entry = normalized.frames?.[frameKey];
  const frame = entry?.frame;
  const width = normalized.meta?.size?.w || 1;
  const height = normalized.meta?.size?.h || 1;
  if (!frame || !width || !height) return false;

  // TexturePacker frame coords are top-left origin; Three.js UVs are bottom-left.
  // Invert Y to sample the intended sub-rect instead of mirrored/shifted frames.
  const u = frame.x / width;
  const v = 1 - ((frame.y + frame.h) / height);
  texture.offset.set(u, v);
  texture.repeat.set(frame.w / width, frame.h / height);
  return true;
}

function normalizeFrameKey(frameKey) {
  const normalizedPath = String(frameKey || '').replace(/\\/g, '/');
  const fileName = normalizedPath.split('/').pop() || '';
  return fileName.replace(/\.[^/.]+$/, '').toLowerCase();
}

function extractFrameIndex(frameKey) {
  const normalized = normalizeFrameKey(frameKey);
  const match = normalized.match(/(\d+)(?!.*\d)/);
  if (!match) return 0;
  const index = Number.parseInt(match[1], 10);
  return Number.isFinite(index) ? index : 0;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function loadAtlasJsonCandidates(candidates) {
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const response = await fetch(candidate);
      if (!response.ok) continue;
      const json = await response.json();
      return normalizeAtlasData(json);
    } catch {
      // Try the next candidate.
    }
  }
  return null;
}

async function loadTextureCandidates(candidates) {
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const texture = await new Promise((resolve, reject) => {
        textureLoader.load(candidate, resolve, undefined, reject);
      });
      return texture;
    } catch {
      // Try the next candidate.
    }
  }
  return null;
}
