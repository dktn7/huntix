# HUNTIX — Camera System

> The camera is a silent player. It must always show what matters.

*Last updated April 15, 2026*

---

## Overview

Huntix uses a fixed orthographic-style 2.5D camera — it does not rotate. It tracks the player(s) horizontally, maintains a fixed vertical offset, and uses a zoom system to keep all players in frame during co-op.

The camera is updated every frame in game loop step 11, after all movement and combat resolution.

---

## Camera Properties

| Property | Value |
|----------|-------|
| Type | THREE.PerspectiveCamera |
| FOV | 60° |
| Near / Far | 0.1 / 100 |
| Default position | (0, 6, 12) — behind and above |
| Default look-at | (0, 1, 0) — slightly above ground level |
| Movement axis | X only (horizontal follow). Y and Z are fixed offsets. |
| Rotation | Never rotates. Locked. |

---

## Follow Logic — Solo

In solo, the camera follows the single player on the X axis with a soft lerp.

```js
const FOLLOW_LERP = 0.08      // Lower = smoother but laggier
const X_OFFSET    = 0         // Camera centred on player X
const Y_POSITION  = 6         // Fixed height
const Z_POSITION  = 12        // Fixed depth

function updateCamera(player, dt) {
  const targetX = player.position.x + X_OFFSET
  camera.position.x += (targetX - camera.position.x) * FOLLOW_LERP
  // Y and Z do not change
}
```

### X Bounds

The camera X position is clamped to the arena bounds so it never shows outside the zone geometry.

```js
const CAM_X_MIN = -6   // Left bound (arena-specific)
const CAM_X_MAX =  6   // Right bound (arena-specific)
camera.position.x = clamp(camera.position.x, CAM_X_MIN, CAM_X_MAX)
```

> Arena-specific bounds are defined in each zone's scene config, not hardcoded here.

---

## Follow Logic — Co-op (Multi-player)

In co-op, the camera must keep all active (not eliminated) players in frame.

```js
function updateCameraCoOp(players, dt) {
  const active = players.filter(p => !p.isDown || p.downTimer > 0)
  if (active.length === 0) return

  const minX = Math.min(...active.map(p => p.position.x))
  const maxX = Math.max(...active.map(p => p.position.x))
  const centreX = (minX + maxX) * 0.5
  const spread  = maxX - minX

  // Lerp camera to centreX
  const targetX = clamp(centreX, CAM_X_MIN, CAM_X_MAX)
  camera.position.x += (targetX - camera.position.x) * FOLLOW_LERP

  // Zoom out if players spread apart
  const targetZ = BASE_Z + spread * SPREAD_ZOOM_FACTOR
  const clampedZ = clamp(targetZ, Z_MIN, Z_MAX)
  camera.position.z += (clampedZ - camera.position.z) * ZOOM_LERP
}
```

### Co-op Zoom Values

| Property | Value |
|----------|-------|
| `BASE_Z` | 12 (base depth — 1 player) |
| `SPREAD_ZOOM_FACTOR` | 0.8 — how much Z increases per unit of player spread |
| `Z_MIN` | 10 — closest the camera can be |
| `Z_MAX` | 18 — furthest the camera can pull back (4P max spread) |
| `ZOOM_LERP` | 0.05 — slower lerp than follow for smooth zoom |

> At 4P with players at maximum spread (~10 units apart), the camera is at Z=20, which shows the full arena width comfortably.

---

## Camera Shake

Shake is a per-frame positional offset added **after** follow logic. It does not affect the follow target — it's pure visual noise.

```js
let shakeIntensity = 0
let shakeDuration  = 0
let shakeTimer     = 0

function triggerShake(intensity, duration) {
  shakeIntensity = intensity
  shakeDuration  = duration
  shakeTimer     = 0
}

function applyShake(dt) {
  if (shakeTimer >= shakeDuration) return
  shakeTimer += dt * 1000  // convert to ms
  const progress = shakeTimer / shakeDuration
  const decay    = 1 - progress  // shake decays to 0
  const offsetX  = (Math.random() * 2 - 1) * shakeIntensity * decay
  const offsetY  = (Math.random() * 2 - 1) * shakeIntensity * decay * 0.5
  camera.position.x += offsetX
  camera.position.y += offsetY
}
```

### Shake Values (consolidated from ATTACKSYSTEM.md)

| Event | Intensity | Duration |
|-------|-----------|----------|
| Light attack hit | 0.05 | 80ms |
| Heavy attack hit | 0.12 | 150ms |
| Spell hit | 0.10 | 120ms |
| Ultimate | 0.25 | 400ms |
| Player hit taken | 0.08 | 100ms |
| Boss phase change | 0.30 | 500ms |
| Miniboss phase change | 0.20 | 350–400ms |
| Wipe | 0.35 | 600ms |
| Stampede wall break | 0.35 | 600ms |
| Tomb Crawler full surface | 0.25 | 500ms |

---

## Boss Entry Camera

When entering a boss fight (hub portal → boss zone), the camera performs a brief cinematic pull-back before combat starts.

```
Scene loads, fade in
  → Camera starts at Z=8 (close)
  → Over 2.0s: lerps to Z=14 (standard)
  → Boss name card appears at 1.0s into pull-back
  → Combat begins when pull-back completes
```

This gives the player a moment to see the boss before the fight starts. It is purely cosmetic and does not affect RunState.

---

## Letterbox on Scene Transition

During scene transitions (fade to black), a subtle letterbox effect (top/bottom black bars) narrows to full black and expands back on fade-in. This is a CSS overlay, not a Three.js effect.

| State | Bar height |
|-------|----------|
| Normal play | 0px |
| Transition start | 0 → 40px over 0.3s |
| Full black | 40px |
| Fade in complete | 40 → 0px over 0.3s |

---

## Related Docs

| System | Doc |
|--------|-----|
| Shake triggered by attacks | [ATTACKSYSTEM.md](./ATTACKSYSTEM.md) |
| Shake triggered by bosses | [BOSSES.md](./BOSSES.md) |
| Shake triggered by minibosses | [MINIBOSS.md](./MINIBOSS.md) |
| Game loop step 11 | [GAMELOOP.md](./GAMELOOP.md) |
| Scene transition (fade) | [SCENEMANAGER.md](./SCENEMANAGER.md) |
