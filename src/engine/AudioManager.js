// import { Howl } from 'howler';

/**
 * AudioManager handles preloading SFX, managing music loops per zone,
 * and responding to combat events with the correct audio cues.
 * Locked to Phase 6 requirements in docs/AUDIO.md.
 *
 * NOTE: AudioManager is currently a lightweight stub in this phase.
 */
export class AudioManager {
  constructor() {
    this._initialized = true;
    this._masterVolume = 1;
    this._musicVolume = 0.5;
    this._sfxVolume = 0.8;
  }

  init() {}

  playSFX(_id, _options = {}) {}

  playMusic(_id, _fadeMs = 2000) {}

  duckMusic(_targetVolume = 0.3, _durationMs = 100) {}

  setMasterVolume(value) {
    this._masterVolume = this._clamp01(value);
    this._updateVolumes();
  }

  setMusicVolume(value) {
    this._musicVolume = this._clamp01(value);
    this._updateVolumes();
  }

  setSfxVolume(value) {
    this._sfxVolume = this._clamp01(value);
    this._updateVolumes();
  }

  _updateVolumes() {
    // Placeholder for future wiring into live audio nodes.
  }

  _clamp01(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 1;
    if (numeric < 0) return 0;
    if (numeric > 1) return 1;
    return numeric;
  }
}
