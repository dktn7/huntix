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

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function centerMinX(width) {
  return VISIBLE_ARENA_BOUNDS.minX + width / 2;
}

export function centerMaxX(width) {
  return VISIBLE_ARENA_BOUNDS.maxX - width / 2;
}

export function centerMinY(height) {
  return VISIBLE_ARENA_BOUNDS.minY + height / 2;
}

export function centerMaxY(height) {
  return VISIBLE_ARENA_BOUNDS.maxY - height / 2;
}

export function clampCenterToVisibleArena(position, width, height) {
  position.x = clamp(position.x, centerMinX(width), centerMaxX(width));
  position.y = clamp(position.y, centerMinY(height), centerMaxY(height));
}

export function clampBottomToVisibleArena(position, width, height) {
  position.x = clamp(position.x, centerMinX(width), centerMaxX(width));
  position.y = clamp(
    position.y,
    VISIBLE_ARENA_BOUNDS.minY,
    VISIBLE_ARENA_BOUNDS.maxY - height
  );
}

export function pointInsideVisibleArena(x, y, padding = 0) {
  return x >= VISIBLE_ARENA_BOUNDS.minX - padding &&
    x <= VISIBLE_ARENA_BOUNDS.maxX + padding &&
    y >= VISIBLE_ARENA_BOUNDS.minY - padding &&
    y <= VISIBLE_ARENA_BOUNDS.maxY + padding;
}
