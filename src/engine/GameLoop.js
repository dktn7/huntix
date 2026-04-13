// ─── GameLoop ─────────────────────────────────────────────────────────────
// Fixed-timestep accumulator with a max delta cap to prevent spiral of death.

const MAX_DT   = 1 / 20;  // cap at 20fps equivalent
const FIXED_DT = 1 / 60;  // 60Hz logic tick

export class GameLoop {
  constructor() {
    this._rafId    = null;
    this._last     = 0;
    this._accum    = 0;
    this._callback = null;
    this.fps       = 60;
    this._fpsSamples = [];
  }

  start(callback) {
    this._callback = callback;
    this._last = performance.now();
    this._tick(this._last);
  }

  stop() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }

  _tick(now) {
    this._rafId = requestAnimationFrame(t => this._tick(t));

    let dt = (now - this._last) / 1000;
    this._last = now;

    // FPS rolling average (last 30 frames)
    this._fpsSamples.push(1 / dt);
    if (this._fpsSamples.length > 30) this._fpsSamples.shift();
    this.fps = this._fpsSamples.reduce((a, b) => a + b, 0) / this._fpsSamples.length;

    dt = Math.min(dt, MAX_DT);
    this._accum += dt;

    while (this._accum >= FIXED_DT) {
      this._callback(FIXED_DT);
      this._accum -= FIXED_DT;
    }
  }
}
