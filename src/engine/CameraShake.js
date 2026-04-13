export class CameraShake {
  /** Creates a fixed-timestep camera shake controller. */
  constructor(camera) {
    this.camera = camera;
    this._baseX = camera.position.x;
    this._baseY = camera.position.y;
    this._timer = 0;
    this._duration = 0;
    this._intensity = 0;
  }

  /** Adds shake intensity for a short hit-confirm nudge. */
  request(intensity) {
    this._intensity = Math.max(this._intensity, intensity);
    this._duration = 0.16;
    this._timer = this._duration;
  }

  /** Advances shake and writes the camera offset for one fixed tick. */
  update(dt) {
    if (this._timer <= 0) {
      this.camera.position.x = this._baseX;
      this.camera.position.y = this._baseY;
      return;
    }

    this._timer = Math.max(0, this._timer - dt);
    const falloff = this._duration > 0 ? this._timer / this._duration : 0;
    const shake = this._intensity * falloff * 0.08;
    const phase = this._timer * 180;

    this.camera.position.x = this._baseX + Math.sin(phase) * shake;
    this.camera.position.y = this._baseY + Math.cos(phase * 0.8) * shake * 0.55;

    if (this._timer <= 0) {
      this._intensity = 0;
    }
  }
}
