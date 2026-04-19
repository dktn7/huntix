import { Howl } from 'howler';

/**
 * AudioManager handles preloading SFX, managing music loops per zone,
 * and responding to combat events with the correct audio cues.
 * Locked to Phase 6 requirements in docs/AUDIO.md.
 */
export class AudioManager {
  constructor() {
    this._masterVolume = 1.0;
    this._sfxVolume = 0.8;
    this._musicVolume = 0.5;

    this._sfx = new Map();
    this._music = new Map();
    this._currentMusic = null;
    this._initialized = false;

    // SFX definitions from docs/AUDIO.md
    this._sfxConfigs = {
      'hit-light': { src: 'assets/audio/sfx/hit-light.mp3', volume: 0.6 },
      'hit-heavy': { src: 'assets/audio/sfx/hit-heavy.mp3', volume: 0.9 },
      'dodge-dabik': { src: 'assets/audio/sfx/dodge-shadow.mp3', volume: 0.5 },
      'dodge-benzu': { src: 'assets/audio/sfx/dodge-thud.mp3', volume: 0.7 },
      'dodge-sereisa': { src: 'assets/audio/sfx/dodge-zap.mp3', volume: 0.6 },
      'dodge-vesol': { src: 'assets/audio/sfx/dodge-flare.mp3', volume: 0.6 },
      'player-hurt': { src: 'assets/audio/sfx/player-hurt.mp3', volume: 0.8 },
      'kill-slowmo': { src: 'assets/audio/sfx/kill-slowmo.mp3', volume: 1.0 },
      'wave-clear': { src: 'assets/audio/sfx/wave-clear.mp3', volume: 0.8 },
      'boss-intro': { src: 'assets/audio/sfx/boss-intro.mp3', volume: 1.0 },
      'level-up': { src: 'assets/audio/sfx/level-up.mp3', volume: 0.9 },
      'essence': { src: 'assets/audio/sfx/essence-collect.mp3', volume: 0.4 },
      'ui-navigate': { src: 'assets/audio/sfx/ui-navigate.mp3', volume: 0.4 },
      'ui-confirm': { src: 'assets/audio/sfx/ui-confirm.mp3', volume: 0.6 },
      'hunter-hover': { src: 'assets/audio/sfx/hunter-hover.mp3', volume: 0.5 },
      'hunter-confirm': { src: 'assets/audio/sfx/hunter-confirm.mp3', volume: 0.7 },
      'click': { src: 'assets/audio/sfx/ui-click.mp3', volume: 0.5 },
    };

    // Music definitions from docs/AUDIO.md
    this._musicConfigs = {
      'title': 'assets/audio/music/title-theme.mp3',
      'hub': 'assets/audio/music/hub.mp3',
      'city-breach': 'assets/audio/music/city-breach.mp3',
      'ruin-den': 'assets/audio/music/ruin-den.mp3',
      'shadow-core': 'assets/audio/music/shadow-core.mp3',
      'thunder-spire': 'assets/audio/music/thunder-spire.mp3',
      'boss': 'assets/audio/music/boss.mp3',
    };
  }

  /** Initialize audio on first user interaction (browser policy) */
  init() {
    if (this._initialized) return;
    this._initialized = true;

    // Preload SFX
    for (const [id, config] of Object.entries(this._sfxConfigs)) {
      this._sfx.set(id, new Howl({
        src: [config.src],
        volume: config.volume * this._sfxVolume * this._masterVolume,
      }));
    }

    // Prepare Music
    for (const [id, src] of Object.entries(this._musicConfigs)) {
      this._music.set(id, new Howl({
        src: [src],
        loop: true,
        volume: 0, // Fade in later
        html5: true, // Recommended for large files
      }));
    }

    this.playMusic('hub');
  }

  playSFX(id, options = {}) {
    if (!this._initialized) return;
    const sound = this._sfx.get(id);
    if (!sound) return;

    const volume = (options.volume || 1.0) * this._sfxVolume * this._masterVolume;
    const rate = options.rate || 1.0;

    const instanceId = sound.play();
    sound.volume(volume, instanceId);
    sound.rate(rate, instanceId);
  }

  playMusic(id, fadeMs = 2000) {
    if (!this._initialized) return;
    const next = this._music.get(id);
    if (!next || next === this._currentMusic) return;

    if (this._currentMusic) {
      this._currentMusic.fade(this._currentMusic.volume(), 0, fadeMs);
      const prev = this._currentMusic;
      setTimeout(() => prev.stop(), fadeMs);
    }

    this._currentMusic = next;
    next.play();
    next.fade(0, this._musicVolume * this._masterVolume, fadeMs);
  }

  /** Briefly duck music volume during hitstop or slow-mo */
  duckMusic(targetVolume = 0.3, durationMs = 100) {
    if (!this._currentMusic || !this._initialized) return;
    const original = this._musicVolume * this._masterVolume;
    this._currentMusic.volume(targetVolume * original);
    setTimeout(() => {
      if (this._currentMusic) this._currentMusic.volume(original);
    }, durationMs);
  }

  setMasterVolume(v) {
    this._masterVolume = Math.max(0, Math.min(1, v));
    this._updateVolumes();
  }

  _updateVolumes() {
    // SFX update
    for (const [id, sound] of this._sfx.entries()) {
      const config = this._sfxConfigs[id];
      sound.volume(config.volume * this._sfxVolume * this._masterVolume);
    }
    // Music update
    if (this._currentMusic) {
      this._currentMusic.volume(this._musicVolume * this._masterVolume);
    }
  }
}
