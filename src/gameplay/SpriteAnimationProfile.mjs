export const TICK_SECONDS = 1 / 60;

export const GAMEPLAY_ANIMATION_PROFILE = {
  states: {
    idle: { loop: true, targetFrames: 6, minFrames: 6, loopFps: 6 },
    run: { loop: true, targetFrames: 12, minFrames: 12, loopFps: 12 },
    attack_light: { loop: false, targetFrames: 8, minFrames: 8, durationSeconds: 8 * TICK_SECONDS },
    attack_heavy: { loop: false, targetFrames: 14, minFrames: 14, durationSeconds: 14 * TICK_SECONDS },
    spell_minor: { loop: false, targetFrames: 10, minFrames: 10, durationSeconds: 10 * TICK_SECONDS },
    spell_advanced: { loop: false, targetFrames: 20, minFrames: 20, durationSeconds: 20 * TICK_SECONDS },
    ultimate: { loop: false, targetFrames: 50, minFrames: 50, durationSeconds: 50 * TICK_SECONDS },
    dodge: { loop: false, targetFrames: 14, minFrames: 14, durationSeconds: 14 * TICK_SECONDS },
    hurt: { loop: false, targetFrames: 8, minFrames: 8, durationSeconds: 8 * TICK_SECONDS },
    dead: { loop: false, targetFrames: 24, minFrames: 24, durationSeconds: 24 * TICK_SECONDS },
    revive: { loop: false, targetFrames: 18, minFrames: 18, durationSeconds: 18 * TICK_SECONDS },
    weapon_swap: { loop: false, targetFrames: 4, minFrames: 4, durationSeconds: 4 * TICK_SECONDS },
    jump: { loop: false, targetFrames: 12, minFrames: 12, durationSeconds: 12 * TICK_SECONDS },
    downed: { loop: true, targetFrames: 12, minFrames: 8, loopFps: 8 },
    directional_right: { loop: true, targetFrames: 1, minFrames: 1, loopFps: 6 },
    directional_left: { loop: true, targetFrames: 1, minFrames: 1, loopFps: 6 },
    directional_front: { loop: true, targetFrames: 1, minFrames: 1, loopFps: 6 },
    directional_back: { loop: true, targetFrames: 1, minFrames: 1, loopFps: 6 },
  },
  requiredPipelineStates: [
    'idle',
    'run',
    'attack_light',
    'attack_heavy',
    'spell_minor',
    'spell_advanced',
    'ultimate',
    'dodge',
    'hurt',
    'dead',
    'revive',
    'weapon_swap',
    'jump',
  ],
  aliases: {
    attack_light_1: { source: 'attack_light' },
    attack_light_2: { source: 'attack_light' },
    attack_light_3: { source: 'attack_light' },
    spell_ultimate: { source: 'ultimate' },
    jump_takeoff: { source: 'jump', segment: [0.0, 0.2] },
    jump_rise: { source: 'jump', segment: [0.2, 0.56] },
    jump_fall: { source: 'jump', segment: [0.56, 0.86] },
    jump_land: { source: 'jump', segment: [0.86, 1.0] },
  },
};

export function normalizeAnimationToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function getStateSpec(stateName) {
  const state = normalizeAnimationToken(stateName);
  return GAMEPLAY_ANIMATION_PROFILE.states[state] || null;
}

export function getAliasSpec(stateName) {
  const state = normalizeAnimationToken(stateName);
  return GAMEPLAY_ANIMATION_PROFILE.aliases[state] || null;
}

export function resolvePlaybackFps(stateName, frameCount, fallbackFps = 8) {
  const state = normalizeAnimationToken(stateName);
  const spec = getStateSpec(state) || getStateSpec(state.replace(/_\d+$/, ''));
  if (!spec) return fallbackFps;
  if (spec.loop) return spec.loopFps || fallbackFps;
  if (!spec.durationSeconds || frameCount <= 0) return fallbackFps;
  const raw = frameCount / spec.durationSeconds;
  return Math.max(6, Math.min(120, raw));
}

export function getRequiredPipelineStates() {
  return GAMEPLAY_ANIMATION_PROFILE.requiredPipelineStates.slice();
}
