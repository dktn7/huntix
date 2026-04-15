# HUNTIX — Game Loop

> Everything runs in a specific order, every frame. This is that order.

*Last updated April 15, 2026*

---

## Overview

The game loop is the heartbeat of the engine. It runs via `requestAnimationFrame` at the browser's native refresh rate, targeting 60fps. Every system that needs to update per-frame is called from here, in a fixed priority order.

Update order is not arbitrary — systems depend on the outputs of earlier systems. Input must resolve before AI. AI must resolve before physics. Physics before combat. Combat before animation. Animation before render.

---

## Frame Order

```
requestAnimationFrame(gameLoop)
  │
  ├─ 1. DELTA TIME
  │     Compute dt = (now - lastFrame) / 1000  (seconds)
  │     Clamp dt: max 0.05s (prevents spiral of death on tab focus loss)
  │     Apply gameSpeed multiplier (hitstop, slow-mo, pause)
  │
  ├─ 2. INPUT
  │     Poll keyboard state
  │     Poll gamepad state (Gamepad API)
  │     Resolve input buffer (flush queued actions older than 100ms)
  │     Output: InputState object per player slot
  │
  ├─ 3. GAME STATE CHECK
  │     If paused (card screen, menu) → skip steps 4–10, jump to 14
  │     If hitstop active → skip steps 4–8, jump to 9
  │
  ├─ 4. PLAYER UPDATE (per player, index order 0→3)
  │     Read InputState
  │     Resolve state machine transition (canTransition guard)
  │     Apply movement (velocity from input + physics)
  │     Apply gravity / jump arc
  │     Resolve collisions with environment (COLLISIONLAYERS.md)
  │     Clamp position to arena bounds
  │
  ├─ 5. AI UPDATE (per enemy, priority order)
  │     Update state machine (idle → telegraph → action → recover)
  │     Compute target (nearest player raycast)
  │     Apply movement toward target
  │     Resolve environment collisions
  │     Token system tick (see ENEMIES.md)
  │
  ├─ 6. COMBAT RESOLUTION
  │     Collect all active hitboxes (player attacks + enemy attacks)
  │     Run overlap tests against hurtboxes (HITBOX.md)
  │     For each confirmed hit:
  │       Apply damage
  │       Apply status effects / debuffs
  │       Trigger hitstop (sets gameSpeed = 0, schedules resume)
  │       Trigger camera shake
  │       Spawn hit particles
  │       Update combo counter
  │       Update Surge
  │       Increment kill count if HP → 0
  │
  ├─ 7. DEBUFF TICK
  │     For each active debuff on each player:
  │       Tick duration down by dt
  │       Apply DoT damage (Bleed, Burn) if interval elapsed
  │       Remove debuff if duration ≤ 0
  │
  ├─ 8. WAVE MANAGER TICK
  │     Check wave completion condition
  │     Tick spawn timers
  │     Trigger next spawn if timer elapsed
  │     Check for miniboss / boss entry condition
  │     (See WAVEMANAGER.md)
  │
  ├─ 9. ANIMATION UPDATE
  │     Advance all animation mixers by dt (Three.js AnimationMixer)
  │     Resolve blend transitions
  │     Apply root motion if flagged (knockback, charge movement)
  │
  ├─ 10. AURA & PARTICLE UPDATE
  │      Advance all particle systems (lifetime, position, opacity)
  │      Cull dead particles
  │      Compute aura state per player (AURASYSTEM.md)
  │      Update Vesol colour lerp
  │
  ├─ 11. CAMERA UPDATE
  │      Compute target follow position (CAMERA.md)
  │      Apply camera shake offset
  │      Lerp camera to target
  │
  ├─ 12. HUD UPDATE
  │      Sync all HUD elements to RunState
  │      Tick combo timer
  │      Tick debuff countdown timers
  │      Animate combo flash if active
  │
  ├─ 13. RUN TIMER TICK
  │      runTimer += dt (if not paused, not hitstop, not wipe)
  │
  ├─ 14. RENDER
  │      renderer.render(scene, camera)
  │
  └─ 15. LAST FRAME TIMESTAMP
         lastFrame = now
```

---

## Delta Time

```js
let lastFrame = performance.now()

function gameLoop(now) {
  requestAnimationFrame(gameLoop)

  let dt = (now - lastFrame) / 1000
  dt = Math.min(dt, 0.05)           // clamp — max 50ms per frame
  dt *= gameSpeed                    // apply slow-mo / hitstop

  lastFrame = now

  // ... all update steps
}
```

### gameSpeed

`gameSpeed` is a global multiplier applied to `dt` before all physics and animation updates.

| State | gameSpeed |
|-------|----------|
| Normal play | 1.0 |
| Hitstop (light) | 0.0 (40ms) |
| Hitstop (heavy/spell) | 0.0 (80ms) |
| Hitstop (ultimate) | 0.0 (200ms) |
| Perfect dodge bullet time | 0.2 (200ms) |
| Boss phase transition | 0.2 (300ms) |
| Paused | 0.0 (indefinite) |

> HUD, particles, and audio are NOT multiplied by `gameSpeed`. They run on real time. Only physics, AI, and animation mixers use the scaled dt.

---

## Fixed vs Variable Timestep

Huntix uses **variable timestep** with a hard cap (dt max 0.05s). This is sufficient for a brawler — there are no physics simulations requiring fixed integration. All movement is velocity × dt.

The 0.05s cap (equivalent to ~20fps minimum) prevents:
- Tunnelling (fast objects skipping through thin walls on a bad frame)
- Spiral of death (a slow frame causing a huge dt, causing more work, causing the next frame to be slower)

---

## Pause Behaviour

| System | Paused? |
|--------|---------|
| Player input | No — input is read but produces no game state changes |
| AI update | Yes — enemies freeze |
| Combat resolution | Yes — no new hits processed |
| Animation | Yes — mixers frozen |
| Particles | No — continue to render |
| HUD | No — card screen / pause menu render on top |
| Audio | Music continues. SFX paused. |
| runTimer | Yes — does not tick while paused |

---

## Hitstop Integration

Hitstop sets `gameSpeed = 0.0` for the duration. Because `dt *= gameSpeed`, all systems that use `dt` naturally freeze. No special handling needed per system.

```js
function triggerHitstop(duration) {
  gameSpeed = 0.0
  setTimeout(() => { gameSpeed = 1.0 }, duration)
}
```

This means hitstop is zero-cost — no list of objects to pause, no per-system flag. `dt = 0` and nothing moves.

---

## Co-op Update Order

In co-op, players are updated in index order (0 → 1 → 2 → 3) within step 4. This is deterministic and consistent. There is no interpolation or rollback — Huntix is local co-op only in MVP.

---

## Performance Notes

- Target: 60fps on mid-range hardware (see PERFORMANCEBUDGET.md)
- Combat resolution (step 6) is O(attackers × defenders) — at max 4 players + ~12 enemies, this is at most ~64 overlap tests per frame. Trivial.
- AI update (step 5) is the most expensive step. Token system in ENEMIES.md limits simultaneous attackers to reduce AI compute.
- Render (step 14) is the bottleneck. All other steps combined should consume < 4ms per frame.

---

## Related Docs

| System | Doc |
|--------|-----|
| gameSpeed values and hitstop | [ATTACKSYSTEM.md](./ATTACKSYSTEM.md) |
| Hitbox overlap tests (step 6) | [HITBOX.md](./HITBOX.md) |
| Wave manager tick (step 8) | [WAVEMANAGER.md](./WAVEMANAGER.md) |
| Camera update (step 11) | [CAMERA.md](./CAMERA.md) |
| Aura/particle update (step 10) | [AURASYSTEM.md](./AURASYSTEM.md) |
| Scene lifecycle (not per-frame) | [SCENEMANAGER.md](./SCENEMANAGER.md) |
