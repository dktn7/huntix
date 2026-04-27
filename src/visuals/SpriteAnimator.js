const DEFAULT_FPS = 8;

const FPS_OVERRIDES = {
  idle: 6,
  run: 10,
  attack_light_1: 14,
  attack_light_2: 14,
  attack_light_3: 14,
  attack_heavy: 10,
  hurt: 18,
  dodge: 14,
  spell_ultimate: 8,
};

export class SpriteAnimator {
  /** Creates a UV frame stepper for one sprite material and TexturePacker atlas. */
  constructor(material, atlasData) {
    this.material = material;
    this.frames = atlasData?.frames || {};
    this.meta = atlasData?.meta || { size: { w: 1, h: 1 } };
    this.W = this.meta.size?.w || 1;
    this.H = this.meta.size?.h || 1;

    this.requestedState = null;
    this.currentState = null;
    this.currentFrame = 0;
    this.elapsed = 0;
    this.loop = true;
    this.onComplete = null;
    this.frameList = [];
    this.fps = DEFAULT_FPS;
  }

  /** Starts playing a named animation state. */
  play(state, loop = true, onComplete = null) {
    // Map generic 'move' to 'run' if 'move' state is missing
    let targetState = state;
    if (state === 'move' && !this.hasState('move')) {
      targetState = 'run';
    }

    if (this.requestedState === targetState && this.loop === loop) return;

    this.requestedState = targetState;
    this.currentState = targetState;
    this.currentFrame = 0;
    this.elapsed = 0;
    this.loop = loop;
    this.onComplete = onComplete;
    this.frameList = this._collectFramesForState(targetState);

    // Default to idle if requested state has no frames
    if (!this.frameList.length && targetState !== 'idle') {
      this.currentState = 'idle';
      this.frameList = this._collectFramesForState('idle');
    }

    this.fps = FPS_OVERRIDES[this.currentState] || DEFAULT_FPS;
    this._applyFrame();
  }

  /** Advances frame timing by delta seconds. */
  update(dt) {
    if (!this.frameList.length) return;

    this.elapsed += dt;
    const frameDuration = 1 / this.fps;
    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      this.currentFrame += 1;

      if (this.currentFrame >= this.frameList.length) {
        if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.frameList.length - 1;
          if (this.onComplete) {
            const complete = this.onComplete;
            this.onComplete = null;
            complete();
          }
          return;
        }
      }

      this._applyFrame();
    }
  }

  /** Returns true when the supplied animation state is active. */
  isPlaying(state) {
    return this.currentState === state;
  }

  /** Returns true when the atlas contains at least one frame for the named state. */
  hasState(state) {
    return this._collectFramesForState(state).length > 0;
  }

  _collectFramesForState(state) {
    const matches = [];
    for (const key of Object.keys(this.frames)) {
      const frameIndex = this._extractFrameIndex(key, state);
      if (frameIndex === null) continue;
      matches.push({ key, frameIndex });
    }

    matches.sort((a, b) => (a.frameIndex - b.frameIndex) || a.key.localeCompare(b.key));
    return matches.map(match => match.key);
  }

  _extractFrameIndex(frameKey, state) {
    const normalizedKey = this._normalizeFrameKey(frameKey);
    const normalizedState = String(state || '').toLowerCase();
    if (!normalizedState) return null;
    const pattern = new RegExp(`(?:^|_)${escapeRegExp(normalizedState)}_(\\d+)$`);
    const match = normalizedKey.match(pattern);
    if (!match) return null;

    const index = Number.parseInt(match[1], 10);
    return Number.isFinite(index) ? index : null;
  }

  _normalizeFrameKey(frameKey) {
    const normalizedPath = String(frameKey || '').replace(/\\/g, '/');
    const fileName = normalizedPath.split('/').pop() || '';
    return fileName.replace(/\.[^/.]+$/, '').toLowerCase();
  }

  _applyFrame() {
    if (!this.material?.map || !this.frameList.length) return;

    const key = this.frameList[this.currentFrame];
    const frame = this.frames[key]?.frame;
    if (!frame) return;

    this.material.map.offset.set(frame.x / this.W, frame.y / this.H);
    this.material.map.repeat.set(frame.w / this.W, frame.h / this.H);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
