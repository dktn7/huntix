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
    if (this.currentState === state && this.loop === loop) return;

    this.currentState = state;
    this.currentFrame = 0;
    this.elapsed = 0;
    this.loop = loop;
    this.onComplete = onComplete;
    this.frameList = Object.keys(this.frames)
      .filter(key => key.startsWith(`${state}_`))
      .sort();
    this.fps = FPS_OVERRIDES[state] || DEFAULT_FPS;
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

  _applyFrame() {
    if (!this.material?.map || !this.frameList.length) return;

    const key = this.frameList[this.currentFrame];
    const frame = this.frames[key]?.frame;
    if (!frame) return;

    this.material.map.offset.set(frame.x / this.W, 1 - (frame.y + frame.h) / this.H);
    this.material.map.repeat.set(frame.w / this.W, frame.h / this.H);
  }
}
