---
name: threejs-skills
description: Core Three.js + 2.5D scene setup, orthographic camera, Y-sort depth, fixed-timestep game loop, elemental aura particle systems. Everything runs through this. Always load alongside systematic-debugging.
---

# Three.js Skills for Huntix

Building a 2.5D browser beat 'em up in Three.js r169 — NO build step, NO npm.

## What Is Already Built — Read Before Writing Any Engine Code

| File | What it does |
|---|---|
| `src/engine/GameLoop.js` | Fixed-timestep accumulator. Callback ALWAYS receives `FIXED_DT = 1/60 = 0.01667s`. |
| `src/engine/Renderer.js` | Orthographic Three.js renderer, resize, pixel ratio, canvas setup. |
| `src/engine/SceneManager.js` | 2.5D scene, Y-sort, placeholder player box, movement, ground plane. |
| `src/engine/InputManager.js` | P1 keyboard (WASD/J/K/Shift/E) + P1 gamepad. P2–P4 not yet built. |
| `src/main.js` | Bootstrap — wires all engine modules. |

All new gameplay code goes in `src/gameplay/` — see AGENTS.md for build order.

## Fixed-Timestep Game Loop (Critical — Read This)

GameLoop.js does NOT pass a variable RAF `dt`. It uses a fixed accumulator:

```js
const FIXED_DT = 1 / 60;  // always 0.01667s — every tick is identical
const MAX_DT   = 1 / 20;  // cap: prevents spiral of death after tab switch

// Accumulator pattern:
this._accum += Math.min(rawDt, MAX_DT);
while (this._accum >= FIXED_DT) {
  this._callback(FIXED_DT); // your code always gets 0.01667
  this._accum -= FIXED_DT;
}
```

**Consequences for your code:**
- `dt` in any `update(dt)` call is always `0.01667s` — treat it as a constant
- Do NOT call `performance.now()` or measure time yourself in gameplay code
- Do NOT use `dt` as a variable that changes — it never does
- Physics, timers, and animations are all deterministic and reproducible
- Example: `entity.position.x += speed * dt` where `dt = 0.01667` always

## Orthographic Camera (set up in Renderer.js — do not recreate)

```js
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
  -aspect * 10, aspect * 10, 10, -10, 0.1, 1000
);
camera.position.set(0, 5, 20);
camera.lookAt(0, 0, 0);
```

## Y-Sort Depth — Run Every Frame in SceneManager

```js
// Already in SceneManager.js — do not duplicate
// Objects with lower Y (further down screen) render in front
entities.forEach(entity => {
  entity.mesh.position.z = -entity.worldY * 0.01;
});
```

## Performance Rules (Hard Limits)

- Max 20 enemies — `THREE.InstancedMesh` for grunts
- Max 500 particles — pool and reuse, NEVER allocate in game loop
- No dynamic shadows in combat scenes
- NEVER `new THREE.Vector3()` / `new THREE.Matrix4()` inside the loop
- Pre-allocate all vectors at class level, reuse via `.set()` / `.copy()`
- Target 60fps on Intel Iris / integrated GPU
- Total initial asset payload < 3MB

## InstancedMesh Pattern

```js
// Allocated ONCE at scene init
const enemies = new THREE.InstancedMesh(geometry, material, 20);
scene.add(enemies);

// Pre-allocate matrix ONCE outside loop
const _m = new THREE.Matrix4();

// Inside update — reuse _m, never new Matrix4()
function setEnemyTransform(i, x, y, z) {
  _m.setPosition(x, y, z);
  enemies.setMatrixAt(i, _m);
  enemies.instanceMatrix.needsUpdate = true;
}
```

## Lighting (set up in SceneManager — do not recreate)

```js
// Bright ambient for flat 2.5D readability
new THREE.AmbientLight(0xffffff, 1.2);
// Subtle directional from top-left for mild depth
const dir = new THREE.DirectionalLight(0xffeedd, 0.6);
dir.position.set(-3, 5, 10);
// castShadow = false always in combat
```

## Elemental Aura Particles (Pooled — pre-allocate at init)

```js
// Allocate ONCE — never inside game loop
const positions = new Float32Array(50 * 3);
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const aura = new THREE.Points(geo,
  new THREE.PointsMaterial({ color: 0x9b59b6, size: 0.08, transparent: true })
);
hunterMesh.add(aura);

// Update in loop — mutate array in place, no allocation
function updateAura(geo, time) {
  const pos = geo.attributes.position.array;
  for (let i = 0; i < 50; i++) {
    const t = time + i * 0.5;
    pos[i*3]   = Math.cos(t) * 0.5;
    pos[i*3+1] = Math.sin(t * 0.7) * 0.5 + i * 0.05;
    pos[i*3+2] = Math.sin(t) * 0.5;
  }
  geo.attributes.position.needsUpdate = true;
}
```

## Hunter Elemental Colours

| Hunter | Element | Primary | Secondary |
|---|---|---|---|
| Dabik | Shadow | `#9b59b6` | `#1a1a2e` |
| Benzu | Thunder/Earth | `#f1c40f` | `#8b6914` |
| Sereisa | Lightning | `#00d4ff` | `#ffffff` |
| Vesol | Flame | `#ff4500` | `#ff8c00` |

## CDN Import Map (Already in index.html — do not change)

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"
  }
}
</script>
```
