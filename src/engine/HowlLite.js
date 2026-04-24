export class Howl {
  constructor(options = {}) {
    const srcList = Array.isArray(options.src) ? options.src : [options.src];
    this._src = srcList.find(Boolean) || '';
    this._loop = !!options.loop;
    this._defaultVolume = typeof options.volume === 'number' ? options.volume : 1;
    this._instances = new Map();
    this._nextId = 1;
    this._fadeTimers = new Map();
  }

  play() {
    if (!this._src) return null;

    const audio = new Audio(this._src);
    audio.loop = this._loop;
    audio.preload = 'auto';
    audio.volume = this._defaultVolume;
    audio.playbackRate = 1;

    const id = this._nextId;
    this._nextId += 1;

    const onEnded = () => {
      this._clearFade(id);
      this._instances.delete(id);
    };

    audio.addEventListener('ended', onEnded, { once: true });
    this._instances.set(id, { audio, onEnded });

    // Browser may block autoplay outside gestures; ignore promise rejection.
    audio.play().catch(() => {});
    return id;
  }

  stop(id = null) {
    if (id !== null && id !== undefined) {
      const entry = this._instances.get(id);
      if (!entry) return;
      this._clearFade(id);
      entry.audio.pause();
      entry.audio.currentTime = 0;
      this._instances.delete(id);
      return;
    }

    for (const [key, entry] of this._instances.entries()) {
      this._clearFade(key);
      entry.audio.pause();
      entry.audio.currentTime = 0;
    }
    this._instances.clear();
  }

  fade(from, to, durationMs = 0, id = null) {
    const targets = id !== null && id !== undefined
      ? [[id, this._instances.get(id)]]
      : [...this._instances.entries()];

    for (const [key, entry] of targets) {
      if (!entry) continue;
      this._clearFade(key);

      const audio = entry.audio;
      audio.volume = this._clamp01(from);

      if (!durationMs || durationMs <= 0) {
        audio.volume = this._clamp01(to);
        continue;
      }

      const start = performance.now();
      const startVol = this._clamp01(from);
      const endVol = this._clamp01(to);
      const step = () => {
        const elapsed = performance.now() - start;
        const t = Math.min(1, elapsed / durationMs);
        audio.volume = startVol + (endVol - startVol) * t;
        if (t >= 1) {
          this._clearFade(key);
          return;
        }
        const timer = setTimeout(step, 16);
        this._fadeTimers.set(key, timer);
      };
      step();
    }
  }

  rate(value, id = null) {
    if (typeof value !== 'number') return 1;

    if (id !== null && id !== undefined) {
      const entry = this._instances.get(id);
      if (entry) entry.audio.playbackRate = value;
      return value;
    }

    for (const entry of this._instances.values()) {
      entry.audio.playbackRate = value;
    }
    return value;
  }

  volume(value, id = null) {
    if (typeof value === 'number') {
      const next = this._clamp01(value);

      if (id !== null && id !== undefined) {
        const entry = this._instances.get(id);
        if (entry) entry.audio.volume = next;
        return next;
      }

      this._defaultVolume = next;
      for (const entry of this._instances.values()) {
        entry.audio.volume = next;
      }
      return next;
    }

    if (id !== null && id !== undefined) {
      const entry = this._instances.get(id);
      return entry ? entry.audio.volume : this._defaultVolume;
    }

    return this._defaultVolume;
  }

  _clearFade(id) {
    const timer = this._fadeTimers.get(id);
    if (!timer) return;
    clearTimeout(timer);
    this._fadeTimers.delete(id);
  }

  _clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }
}
