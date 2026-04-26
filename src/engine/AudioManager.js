// import { Howl } from 'howler';

/**
 * AudioManager handles preloading SFX, managing music loops per zone,
 * and responding to combat events with the correct audio cues.
 * Locked to Phase 6 requirements in docs/AUDIO.md.
 * 
 * NOTE: AudioManager is currently disabled.
 */
export class AudioManager {
  constructor() {
    this._initialized = true;
  }

  init() {}
  playSFX(id, options = {}) {}
  playMusic(id, fadeMs = 2000) {}
  duckMusic(targetVolume = 0.3, durationMs = 100) {}
  setMasterVolume(v) {}
  _updateVolumes() {}
}
