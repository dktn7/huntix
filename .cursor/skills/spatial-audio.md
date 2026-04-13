---
name: spatial-audio
description: Web Audio API implementation for beat em up combat SFX, positional audio, elemental sound design, and background music. Use when wiring up any sound in Huntix — hit impacts, elemental abilities, boss music, UI feedback.
source: mcpmarket.com/tools/skills/categories/game-development
---

# Spatial Audio for Huntix

Beat 'em up feel lives in the audio. Every hit, ability, and boss phase needs satisfying feedback.

## Web Audio API Setup

```js
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Must resume on user gesture (browser autoplay policy)
document.addEventListener('click', () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
}, { once: true });
```

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
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    this.buffers.set(id, await this.ctx.decodeAudioData(buf));
  }

  play(id, { volume = 1, pan = 0, pitch = 1 } = {}) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers.get(id);
    src.playbackRate.value = pitch;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = volume;

    const panner = this.ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));

    src.connect(gainNode).connect(panner).connect(this.masterGain);
    src.start();
    return src;
  }
}

export const sfx = new SoundManager();
```

## Positional Audio from Screen Position

Pan SFX based on where the hit happens on screen (left = -1, right = +1):

```js
function worldToPan(worldX, camera) {
  const screenX = worldX - camera.position.x;
  return Math.max(-1, Math.min(1, screenX / 10)); // normalise to -1..1
}

// Play hit SFX panned to enemy position
sfx.play('hit-impact', { pan: worldToPan(enemy.position.x, camera) });
```

## Huntix SFX Library

Organise sounds by category:

```
/assets/sfx/
  combat/
    hit-light.wav       # light attack connect
    hit-heavy.wav       # heavy attack connect
    hit-critical.wav    # crit / finisher
    miss-whoosh.wav     # whiff
    block.wav           # enemy blocks
    stagger.wav         # enemy staggers
  elemental/
    dabik-shadow.wav    # shadow ability activate
    benzu-earth.wav     # earth slam
    sereisa-lightning.wav
    vesol-flame.wav
  ui/
    level-up.wav
    essence-earn.wav
    menu-select.wav
    menu-confirm.wav
  boss/
    boss-intro.wav
    boss-phase2.wav
    boss-death.wav
  music/
    hub-theme.mp3
    zone-1.mp3
    boss-theme.mp3
```

## Combo Hit Feel (Pitch Ladder)

Escalate pitch on consecutive hits for satisfying combo feedback:

```js
let comboCount = 0;
const BASE_PITCH = 1.0;
const PITCH_STEP = 0.05;
const MAX_PITCH = 1.4;

function onHitConnect() {
  comboCount++;
  const pitch = Math.min(BASE_PITCH + comboCount * PITCH_STEP, MAX_PITCH);
  sfx.play('hit-light', { pitch, volume: 0.8 });
}

function onComboEnd() {
  comboCount = 0;
}
```

## Background Music with Looping

```js
async function playMusic(id, { loop = true, volume = 0.4 } = {}) {
  const src = sfx.ctx.createBufferSource();
  src.buffer = sfx.buffers.get(id);
  src.loop = loop;
  const gain = sfx.ctx.createGain();
  gain.gain.value = volume;
  src.connect(gain).connect(sfx.masterGain);
  src.start();
  return { src, gain };
}

// Crossfade between tracks (boss phase 2)
function crossfade(outGain, inGain, duration = 1) {
  const now = sfx.ctx.currentTime;
  outGain.gain.linearRampToValueAtTime(0, now + duration);
  inGain.gain.linearRampToValueAtTime(0.4, now + duration);
}
```

## Performance Rules

- Decode all SFX buffers at load time — never decode during gameplay
- Reuse `AudioBufferSourceNode` pattern (create new node per play — they are single-use)
- Limit simultaneous voices: cap at ~16 concurrent sounds, cull oldest on overflow
- Use `.ogg` for Firefox + `.wav` fallback; `.mp3` for music (smaller file size)
- Compress all SFX files: target <50KB per short SFX, <2MB per music track
