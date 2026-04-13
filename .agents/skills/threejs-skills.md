---
name: threejs-skills
description: Core Three.js + 2.5D scene setup, WebGPU renderer, orthographic camera, Y-sort depth, elemental aura particle systems. Everything runs through this. Always load alongside systematic-debugging.
---

# Three.js Skills for Huntix

You are building a 2.5D browser beat 'em up in Three.js r169 with NO build step and NO npm.

## What Is Already Built — Read Before Writing Any Engine Code

These files exist in `src/engine/` and must NOT be recreated:

| File | What it does |
|---|---|
| `src/engine/GameLoop.js` | Fixed-timestep RAF loop with FPS tracking. Provides `dt` to all systems. |
| `src/engine/Renderer.js` | Orthographic Three.js renderer, handles resize, pixel ratio, canvas setup. |
| `src/engine/SceneManager.js` | 2.5D scene, Y-sort, placeholder player box, movement. |
| `src/engine/InputManager.js` | Keyboard + gamepad, all combat actions mapped for up to 4 players. |
| `src/main.js` | Bootstrap — wires all engine modules together. |

Next files to create live in `src/gameplay/` — see AGENTS.md for the ordered list.

## Core Principles

- Three.js r169 loaded via CDN importmap — NO npm, NO Vite, NO bundler
- `requestAnimationFrame` for game loop — never `setInterval`
- Orthographic camera only — never switch to perspective
- No dynamic shadows in combat scenes
- Dispose geometries, materials, and textures when removing objects to prevent leaks

## Orthographic Camera (Already set up in Renderer.js — reference only)

```js
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
  -aspect * 10, aspect * 10, 10, -10, 0.1, 1000
);
camera.position.set(0, 5, 20);
camera.lookAt(0, 0, 0);
```

## Y-Sort Depth Sorting — Run Every Frame

```js
entities.forEach(entity => {
  entity.mesh.position.z = -entity.worldY * 0.01;
});
```

## Performance Rules (Hard Limits from AGENTS.md)

- Max 20 enemies — use `THREE.InstancedMesh` for grunts
- Max 500 particles — pool and reuse, NEVER allocate in game loop
- No dynamic shadows in combat scenes
- NEVER `new THREE.Vector3()` / `new THREE.Matrix4()` inside animation loop
- Target 60fps on Intel Iris / integrated GPU
- Total initial asset payload < 3MB

## InstancedMesh for Enemies

```js
const enemies = new THREE.InstancedMesh(geometry, material, 20);
scene.add(enemies);
const _m = new THREE.Matrix4(); // pre-allocated ONCE
function setEnemyTransform(i, x, y, z) {
  _m.setPosition(x, y, z);
  enemies.setMatrixAt(i, _m);
  enemies.instanceMatrix.needsUpdate = true;
}
```

## Elemental Aura Particles (Pooled)

```js
// Allocate at init — never inside game loop
const positions = new Float32Array(50 * 3);
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const aura = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x9b59b6, size: 0.08, transparent: true }));
hunterMesh.add(aura);

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
