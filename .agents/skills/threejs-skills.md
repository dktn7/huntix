---
name: threejs-skills
description: Core Three.js + 2.5D scene, orthographic camera, Y-sort, fixed-timestep loop, aura particles. Always load alongside systematic-debugging.
---

# Three.js Skills for Huntix

## What Is Already Built — Do Not Recreate

| File | What it does |
|---|---|
| `src/engine/GameLoop.js` | Fixed-timestep accumulator. Callback always gets FIXED_DT = 0.01667s. |
| `src/engine/Renderer.js` | Orthographic renderer, resize, pixel ratio. |
| `src/engine/SceneManager.js` | 2.5D scene, Y-sort, placeholder player, movement. |
| `src/engine/InputManager.js` | P1 keyboard + gamepad. P2–P4 not yet built. |
| `src/main.js` | Bootstrap. |

## Fixed-Timestep Loop (Critical)

```js
const FIXED_DT = 1 / 60; // 0.01667s — ALWAYS. Never varies.
const MAX_DT   = 1 / 20; // cap to prevent spiral of death

// Accumulator pattern in GameLoop.js:
this._accum += Math.min(rawDt, MAX_DT);
while (this._accum >= FIXED_DT) {
  this._callback(FIXED_DT); // your update() always gets 0.01667
  this._accum -= FIXED_DT;
}
```

- `dt` in `update(dt)` is ALWAYS 0.01667s — treat as constant
- Never call `performance.now()` in gameplay code
- Physics and timers are fully deterministic

## Orthographic Camera (in Renderer.js — reference only)

```js
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(-aspect*10, aspect*10, 10, -10, 0.1, 1000);
camera.position.set(0, 5, 20);
camera.lookAt(0, 0, 0);
```

## Y-Sort — Run Every Frame

```js
entities.forEach(e => { e.mesh.position.z = -e.worldY * 0.01; });
```

## Performance Rules

- Max 20 enemies — InstancedMesh
- Max 500 particles — pool, never allocate in loop
- No shadows in combat
- Never new THREE.Vector3() inside loop — pre-allocate, reuse .set()

## InstancedMesh Pattern

```js
const enemies = new THREE.InstancedMesh(geo, mat, 20);
const _m = new THREE.Matrix4(); // pre-allocated ONCE
function setTransform(i, x, y, z) {
  _m.setPosition(x, y, z);
  enemies.setMatrixAt(i, _m);
  enemies.instanceMatrix.needsUpdate = true;
}
```

## Aura Particles (Pre-allocated)

```js
const positions = new Float32Array(50 * 3);
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const aura = new THREE.Points(geo, new THREE.PointsMaterial({ color:0x9b59b6, size:0.08, transparent:true }));
hunterMesh.add(aura);
// Update: mutate positions array in-place, geo.attributes.position.needsUpdate = true
```

## Hunter Colours

| Hunter | Primary | Secondary |
|---|---|---|
| Dabik | `#9b59b6` | `#1a1a2e` |
| Benzu | `#f1c40f` | `#8b6914` |
| Sereisa | `#00d4ff` | `#ffffff` |
| Vesol | `#ff4500` | `#ff8c00` |
