const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

export const ARENA_HEIGHT = 10;
export const ARENA_WIDTH = ARENA_HEIGHT * (GAME_WIDTH / GAME_HEIGHT);

export const VISIBLE_ARENA_BOUNDS = {
  minX: -ARENA_WIDTH / 2,
  maxX: ARENA_WIDTH / 2,
  minY: -ARENA_HEIGHT / 2,
  maxY: ARENA_HEIGHT / 2,
};

let _activeArenaBounds = { ...VISIBLE_ARENA_BOUNDS };
let _activeArenaBlockers = [];

function _sanitizeBounds(bounds) {
  const src = bounds || VISIBLE_ARENA_BOUNDS;
  const minX = Number.isFinite(src.minX) ? src.minX : VISIBLE_ARENA_BOUNDS.minX;
  const maxX = Number.isFinite(src.maxX) ? src.maxX : VISIBLE_ARENA_BOUNDS.maxX;
  const minY = Number.isFinite(src.minY) ? src.minY : VISIBLE_ARENA_BOUNDS.minY;
  const maxY = Number.isFinite(src.maxY) ? src.maxY : VISIBLE_ARENA_BOUNDS.maxY;
  if (minX >= maxX || minY >= maxY) return { ...VISIBLE_ARENA_BOUNDS };
  return { minX, maxX, minY, maxY };
}

function _sanitizeBlockers(blockers) {
  if (!Array.isArray(blockers)) return [];
  const next = [];
  for (const blocker of blockers) {
    if (!blocker) continue;
    const width = Number(blocker.width);
    const height = Number(blocker.height);
    if (!Number.isFinite(width) || !Number.isFinite(height)) continue;
    if (width <= 0.001 || height <= 0.001) continue;
    const x = Number(blocker.x) || 0;
    const y = Number(blocker.y) || 0;
    next.push({ x, y, width, height });
  }
  return next;
}

function _activeBounds() {
  return _activeArenaBounds || VISIBLE_ARENA_BOUNDS;
}

function _intersects(a, b) {
  return (
    a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y
  );
}

function _resolvePenetration(box, blocker) {
  const overlapLeft = (box.x + box.width) - blocker.x;
  const overlapRight = (blocker.x + blocker.width) - box.x;
  const overlapBottom = (box.y + box.height) - blocker.y;
  const overlapTop = (blocker.y + blocker.height) - box.y;

  const pushX = overlapLeft < overlapRight ? -overlapLeft : overlapRight;
  const pushY = overlapBottom < overlapTop ? -overlapBottom : overlapTop;

  if (Math.abs(pushX) <= Math.abs(pushY)) {
    return { dx: pushX, dy: 0 };
  }
  return { dx: 0, dy: pushY };
}

function _constrainToBlockers(position, width, height, anchor = 'center') {
  if (!_activeArenaBlockers.length) return;

  for (let i = 0; i < 4; i += 1) {
    let moved = false;
    const bodyX = position.x - width / 2;
    const bodyY = anchor === 'bottom' ? position.y : position.y - height / 2;
    const body = { x: bodyX, y: bodyY, width, height };

    for (const blocker of _activeArenaBlockers) {
      if (!_intersects(body, blocker)) continue;
      const correction = _resolvePenetration(body, blocker);
      if (correction.dx === 0 && correction.dy === 0) continue;
      position.x += correction.dx;
      position.y += correction.dy;
      moved = true;
      break;
    }

    if (!moved) break;
    if (anchor === 'bottom') {
      const b = _activeBounds();
      position.x = clamp(position.x, b.minX + width / 2, b.maxX - width / 2);
      position.y = clamp(position.y, b.minY, b.maxY - height);
    } else {
      const b = _activeBounds();
      position.x = clamp(position.x, b.minX + width / 2, b.maxX - width / 2);
      position.y = clamp(position.y, b.minY + height / 2, b.maxY - height / 2);
    }
  }
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function setActiveArenaBounds(bounds, blockers = []) {
  _activeArenaBounds = _sanitizeBounds(bounds);
  _activeArenaBlockers = _sanitizeBlockers(blockers);
}

export function getActiveArenaBounds() {
  return {
    ..._activeBounds(),
    blockers: _activeArenaBlockers.map(blocker => ({ ...blocker })),
  };
}

export function resetActiveArenaBounds() {
  _activeArenaBounds = { ...VISIBLE_ARENA_BOUNDS };
  _activeArenaBlockers = [];
}

export function centerMinX(width) {
  const bounds = _activeBounds();
  return bounds.minX + width / 2;
}

export function centerMaxX(width) {
  const bounds = _activeBounds();
  return bounds.maxX - width / 2;
}

export function centerMinY(height) {
  const bounds = _activeBounds();
  return bounds.minY + height / 2;
}

export function centerMaxY(height) {
  const bounds = _activeBounds();
  return bounds.maxY - height / 2;
}

export function clampCenterToVisibleArena(position, width, height) {
  const bounds = _activeBounds();
  position.x = clamp(position.x, centerMinX(width), centerMaxX(width));
  position.y = clamp(position.y, centerMinY(height), centerMaxY(height));
  _constrainToBlockers(position, width, height, 'center');
  position.x = clamp(position.x, bounds.minX + width / 2, bounds.maxX - width / 2);
  position.y = clamp(position.y, bounds.minY + height / 2, bounds.maxY - height / 2);
}

export function clampBottomToVisibleArena(position, width, height) {
  const bounds = _activeBounds();
  position.x = clamp(position.x, centerMinX(width), centerMaxX(width));
  position.y = clamp(
    position.y,
    bounds.minY,
    bounds.maxY - height
  );
  _constrainToBlockers(position, width, height, 'bottom');
  position.x = clamp(position.x, bounds.minX + width / 2, bounds.maxX - width / 2);
  position.y = clamp(position.y, bounds.minY, bounds.maxY - height);
}

export function pointInsideVisibleArena(x, y, padding = 0) {
  const bounds = _activeBounds();
  return x >= bounds.minX - padding &&
    x <= bounds.maxX + padding &&
    y >= bounds.minY - padding &&
    y <= bounds.maxY + padding;
}
