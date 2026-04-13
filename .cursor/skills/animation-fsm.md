---
name: animation-fsm
description: Animation state machine and Three.js AnimationMixer implementation for Huntix. Covers FSM design, placeholder geometry animation (Phase 1-2), and real model AnimationMixer integration (Phase 3). Use when building PlayerState.js, CombatController.js, or AnimationController.js.
---

# Animation FSM for Huntix

Huntix uses a two-phase animation approach: placeholder geometry transforms (Phase 1–2) then real Three.js `AnimationMixer` clips (Phase 3). The FSM is built now — animation rendering is swapped in later.

## Animation States (from docs/ANIMATIONS.md)

```js
export const STATES = {
  IDLE:         'IDLE',
  RUN:          'RUN',
  ATTACK_LIGHT: 'ATTACK_LIGHT',
  ATTACK_HEAVY: 'ATTACK_HEAVY',
  DODGE:        'DODGE',
  SPECIAL:      'SPECIAL',
  HURT:         'HURT',
  DEAD:         'DEAD',
  ULTIMATE:     'ULTIMATE',
};
```

## State Priority (Higher = Cannot Be Interrupted by Lower)

| State | Priority |
|---|---|
| IDLE / RUN | 0–1 |
| ATTACK_LIGHT / ATTACK_HEAVY / SPECIAL | 3 |
| DODGE | 4 |
| HURT | 5 |
| DEAD / ULTIMATE | 6 |

## Transition Rules

- DEAD cannot be interrupted by anything
- DODGE cannot be interrupted (i-frame window active)
- Any ATTACK → DODGE is always valid (dodge cancel)
- HURT interrupts ATTACK unless in active hit frame
- IDLE / RUN → any combat state instantly

## PlayerState FSM (src/gameplay/PlayerState.js)

```js
import { STATES } from './States.js';

export class PlayerState {
  constructor(playerId) {
    this.playerId = playerId;
    this.current = STATES.IDLE;
    this.prev = STATES.IDLE;
    this.timer = 0;       // time remaining in current state (seconds)
    this.iframes = false; // invincibility frames active
  }

  // Frame budgets from docs/ANIMATIONS.md (at 60fps)
  static DURATIONS = {
    [STATES.ATTACK_LIGHT]: 0.167,  // 10 frames
    [STATES.ATTACK_HEAVY]: 0.300,  // 18 frames
    [STATES.DODGE]:        0.300,  // 18 frames — 200ms i-frames
    [STATES.SPECIAL]:      0.233,  // 14 frames
    [STATES.HURT]:         0.167,  // 10 frames
    [STATES.DEAD]:         0.400,  // 24 frames
    [STATES.ULTIMATE]:     1.000,  // 60 frames
  };

  static IFRAME_WINDOW = {
    [STATES.DODGE]: 0.200, // 200ms i-frames during dodge
  };

  canTransitionTo(newState) {
    if (this.current === STATES.DEAD) return false;
    if (this.current === STATES.DODGE && newState !== STATES.DEAD) return false;
    // Dodge cancel: always allow ATTACK → DODGE
    if (newState === STATES.DODGE) return true;
    // Timed states: block transitions until timer expires (except HURT)
    if (this.timer > 0 && newState !== STATES.HURT && newState !== STATES.DEAD) return false;
    return true;
  }

  transition(newState) {
    if (!this.canTransitionTo(newState)) return false;
    this.prev = this.current;
    this.current = newState;
    this.timer = PlayerState.DURATIONS[newState] || 0;
    this.iframes = !!PlayerState.IFRAME_WINDOW[newState];
    return true;
  }

  update(dt) {
    if (this.timer > 0) {
      this.timer -= dt;
      // Count down i-frames separately
      if (this.iframes && this.timer < (PlayerState.DURATIONS[this.current] - PlayerState.IFRAME_WINDOW[this.current])) {
        this.iframes = false;
      }
      if (this.timer <= 0) {
        this.timer = 0;
        // Auto-transition to IDLE when timed state ends (except DEAD)
        if (this.current !== STATES.DEAD) this.transition(STATES.IDLE);
      }
    }
  }
}
```

## Phase 1–2: Placeholder Geometry Animations

Until real models are added (Phase 3), simulate animation states with mesh transforms:

```js
// In SceneManager or a PlaceholderAnimator class
export class PlaceholderAnimator {
  constructor(mesh) {
    this.mesh = mesh;
    this.baseScale = mesh.scale.clone();
    this.shakeTimer = 0;
    this.idleTimer = 0;
  }

  update(state, dt) {
    this.idleTimer += dt;
    switch (state) {
      case STATES.IDLE:
        // Subtle Y bob
        this.mesh.position.y = Math.sin(this.idleTimer * Math.PI * 2) * 0.05;
        this.mesh.scale.copy(this.baseScale);
        break;
      case STATES.ATTACK_LIGHT:
        // Flash scale X
        this.mesh.scale.x = this.baseScale.x * 1.3;
        this.mesh.material.emissive?.setHex(0xffffff);
        break;
      case STATES.ATTACK_HEAVY:
        // Flash scale XY
        this.mesh.scale.set(this.baseScale.x * 1.5, this.baseScale.y * 1.5, this.baseScale.z);
        this.mesh.material.emissive?.setHex(0xffff00);
        break;
      case STATES.DODGE:
        this.mesh.material.emissive?.setHex(0x00ffff);
        break;
      case STATES.HURT:
        // X shake
        this.mesh.position.x += (Math.random() - 0.5) * 0.2;
        break;
      case STATES.DEAD:
        // Collapse Y to 0
        this.mesh.scale.y = Math.max(0, this.mesh.scale.y - dt * 2.5);
        break;
      default:
        this.mesh.scale.copy(this.baseScale);
        this.mesh.material.emissive?.setHex(0x000000);
    }
  }
}
```

## Phase 3: Real AnimationMixer (AnimationController.js)

Create `src/gameplay/AnimationController.js` in Phase 3:

```js
import * as THREE from 'three';
import { STATES } from './States.js';

export class AnimationController {
  constructor(model) {
    this.mixer = new THREE.AnimationMixer(model);
    this.clips = {};    // state name → AnimationClip
    this.current = null;
  }

  // Call after GLTF load — map clip names to states
  loadClips(gltf) {
    gltf.animations.forEach(clip => {
      this.clips[clip.name.toUpperCase()] = clip;
    });
  }

  // Call from PlayerState transition callback
  play(stateName, options = {}) {
    const clip = this.clips[stateName];
    if (!clip) return;

    const action = this.mixer.clipAction(clip);

    // Non-looping states
    const looping = [STATES.IDLE, STATES.RUN];
    if (!looping.includes(stateName)) {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    } else {
      action.setLoop(THREE.LoopRepeat, Infinity);
    }

    // Crossfade from current
    if (this.current && this.current !== action) {
      const fadeTime = options.fadeTime ?? 0.1;
      this.current.fadeOut(fadeTime);
      action.reset().fadeIn(fadeTime).play();
    } else {
      action.reset().play();
    }

    this.current = action;
  }

  update(dt) {
    this.mixer.update(dt);
  }
}
```

## Crossfade Durations

| Transition | Fade Time |
|---|---|
| Any → IDLE / RUN | 0.15s |
| IDLE → ATTACK | 0.05s (snap) |
| ATTACK → DODGE | 0.0s (instant cancel) |
| Any → HURT | 0.05s |
| Any → DEAD | 0.1s |

## Checklist — Before Moving to Phase 3 Models

- [ ] `PlayerState.js` FSM built and all 9 states working
- [ ] Placeholder animations visually distinguish all states
- [ ] `CombatController.js` drives state transitions correctly
- [ ] No state machine bugs (dead players can still attack, etc.)
- [ ] `AnimationController.js` ready to receive real clips in Phase 3
