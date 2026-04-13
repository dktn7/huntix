---
name: animation-fsm
description: Animation state machine and Three.js AnimationMixer for Huntix. Covers FSM design, placeholder geometry animation (Phase 1-2), and real AnimationMixer integration (Phase 3). Use when building PlayerState.js, CombatController.js, or AnimationController.js.
---

# Animation FSM for Huntix

## Animation States

```js
export const STATES = {
  IDLE:'IDLE', RUN:'RUN', ATTACK_LIGHT:'ATTACK_LIGHT', ATTACK_HEAVY:'ATTACK_HEAVY',
  DODGE:'DODGE', SPECIAL:'SPECIAL', HURT:'HURT', DEAD:'DEAD', ULTIMATE:'ULTIMATE',
};
```

## State Priority

| State | Priority |
|---|---|
| IDLE / RUN | 0–1 |
| ATTACK / SPECIAL | 3 |
| DODGE | 4 |
| HURT | 5 |
| DEAD / ULTIMATE | 6 |

## Transition Rules

- DEAD cannot be interrupted
- DODGE cannot be interrupted (i-frames active)
- Any ATTACK → DODGE always valid (dodge cancel)
- HURT interrupts ATTACK unless in active hit frame
- IDLE/RUN → any combat state instantly

## PlayerState FSM (src/gameplay/PlayerState.js)

```js
import { STATES } from './States.js';
export class PlayerState {
  constructor(id) { this.id = id; this.current = STATES.IDLE; this.prev = STATES.IDLE; this.timer = 0; this.iframes = false; }

  // Frame durations from docs/ANIMATIONS.md
  static DURATIONS = {
    [STATES.ATTACK_LIGHT]:0.167, [STATES.ATTACK_HEAVY]:0.300, [STATES.DODGE]:0.300,
    [STATES.SPECIAL]:0.233, [STATES.HURT]:0.167, [STATES.DEAD]:0.400, [STATES.ULTIMATE]:1.000,
  };

  canTransitionTo(next) {
    if (this.current === STATES.DEAD) return false;
    if (this.current === STATES.DODGE && next !== STATES.DEAD) return false;
    if (next === STATES.DODGE) return true; // dodge cancel always valid
    if (this.timer > 0 && next !== STATES.HURT && next !== STATES.DEAD) return false;
    return true;
  }

  transition(next) {
    if (!this.canTransitionTo(next)) return false;
    this.prev = this.current; this.current = next;
    this.timer = PlayerState.DURATIONS[next] || 0;
    this.iframes = next === STATES.DODGE; // 200ms i-frames on dodge
    return true;
  }

  update(dt) {
    if (this.timer <= 0) return;
    this.timer -= dt;
    if (this.iframes && this.timer < 0.100) this.iframes = false;
    if (this.timer <= 0 && this.current !== STATES.DEAD) this.transition(STATES.IDLE);
  }
}
```

## Phase 1–2: Placeholder Geometry Animations

```js
export class PlaceholderAnimator {
  constructor(mesh) { this.mesh = mesh; this.baseScale = mesh.scale.clone(); this.t = 0; }
  update(state, dt) {
    this.t += dt;
    this.mesh.scale.copy(this.baseScale);
    this.mesh.material.emissive?.setHex(0x000000);
    switch (state) {
      case STATES.IDLE:         this.mesh.position.y = Math.sin(this.t * Math.PI * 2) * 0.05; break;
      case STATES.ATTACK_LIGHT: this.mesh.scale.x *= 1.3; this.mesh.material.emissive?.setHex(0xffffff); break;
      case STATES.ATTACK_HEAVY: this.mesh.scale.multiplyScalar(1.5); this.mesh.material.emissive?.setHex(0xffff00); break;
      case STATES.DODGE:        this.mesh.material.emissive?.setHex(0x00ffff); break;
      case STATES.HURT:         this.mesh.position.x += (Math.random()-0.5)*0.2; break;
      case STATES.DEAD:         this.mesh.scale.y = Math.max(0, this.mesh.scale.y - dt*2.5); break;
    }
  }
}
```

## Phase 3: AnimationController (src/gameplay/AnimationController.js)

```js
import * as THREE from 'three';
export class AnimationController {
  constructor(model) { this.mixer = new THREE.AnimationMixer(model); this.clips = {}; this.current = null; }
  loadClips(gltf) { gltf.animations.forEach(c => { this.clips[c.name.toUpperCase()] = c; }); }
  play(stateName, fadeTime = 0.1) {
    const clip = this.clips[stateName]; if (!clip) return;
    const action = this.mixer.clipAction(clip);
    const looping = ['IDLE','RUN'];
    action.setLoop(looping.includes(stateName) ? THREE.LoopRepeat : THREE.LoopOnce, looping.includes(stateName) ? Infinity : 1);
    if (!looping.includes(stateName)) action.clampWhenFinished = true;
    if (this.current && this.current !== action) { this.current.fadeOut(fadeTime); action.reset().fadeIn(fadeTime).play(); }
    else action.reset().play();
    this.current = action;
  }
  update(dt) { this.mixer.update(dt); }
}
```

## Crossfade Durations

| Transition | Fade |
|---|---|
| Any → IDLE/RUN | 0.15s |
| IDLE → ATTACK | 0.05s |
| ATTACK → DODGE | 0.0s (instant) |
| Any → HURT/DEAD | 0.05–0.1s |

## Checklist

- [ ] All 9 states implemented in PlayerState.js
- [ ] Placeholder animations visually distinguish all states
- [ ] CombatController drives transitions correctly
- [ ] Dead players cannot attack (FSM blocks it)
- [ ] AnimationController ready for Phase 3 model swap
