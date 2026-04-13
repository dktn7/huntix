---
name: spatial-audio
description: Web Audio API for Huntix — hit SFX, elemental sounds, positional panning, combo pitch ladder, background music looping. Use when wiring any sound in the game.
---

# Spatial Audio for Huntix

## Sound Manager

```js
class SoundManager {
  constructor() {
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.buffers = new Map();
  }
  async load(id, url) {
    const buf = await fetch(url).then(r => r.arrayBuffer());
    this.buffers.set(id, await this.ctx.decodeAudioData(buf));
  }
  play(id, { volume = 1, pan = 0, pitch = 1 } = {}) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers.get(id);
    src.playbackRate.value = pitch;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    src.connect(gain).connect(panner).connect(this.masterGain);
    src.start();
  }
}
export const sfx = new SoundManager();
```

## Positional Pan from World Position

```js
function worldToPan(worldX, camera) {
  return Math.max(-1, Math.min(1, (worldX - camera.position.x) / 10));
}
sfx.play('hit-light', { pan: worldToPan(enemy.position.x, camera) });
```

## Combo Pitch Ladder

```js
let combo = 0;
function onHit() {
  combo++;
  const pitch = Math.min(1.0 + combo * 0.05, 1.4);
  sfx.play('hit-light', { pitch });
}
```

## SFX File Structure

```
assets/sfx/combat/  hit-light, hit-heavy, hit-critical, miss-whoosh, stagger
assets/sfx/elemental/ dabik-shadow, benzu-earth, sereisa-lightning, vesol-flame
assets/sfx/ui/  level-up, essence-earn, menu-select
assets/sfx/boss/ boss-intro, boss-phase2, boss-death
assets/music/   hub-theme, zone-1, zone-2, zone-3, boss-theme
```

## Rules

- Decode all buffers at load time — never during gameplay
- Cap simultaneous voices at ~16, cull oldest on overflow
- Resume AudioContext on first user gesture (browser autoplay policy)
- Max 50KB per SFX, max 2MB per music track
