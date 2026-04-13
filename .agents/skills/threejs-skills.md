---
name: threejs-skills
description: Core Three.js + 2.5D scene setup, WebGPU renderer, orthographic camera, Y-sort depth, elemental aura particle systems. Everything runs through this. Always load alongside systematic-debugging.
---

# Three.js Skills

You are an expert Three.js developer building a 2.5D browser beat 'em up with Three.js r169 and no build step.

## Core Principles

- Three.js r169 loaded via CDN importmap — NO npm, NO Vite, NO bundler
- Use `requestAnimationFrame` for the game loop — never `setInterval`
- Dispose geometries, materials, and textures when removing objects to prevent memory leaks
- Use `THREE.Object3D` as scene graph nodes for grouping related game entities
- Orthographic camera only — never switch to perspective

## 2.5D Scene Setup

```js
// Orthographic camera for pure 2.5D
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(-aspect * 10, aspect * 10, 10, -10, 0.1, 1000);
camera.position.set(0, 5, 20);
camera.lookAt(0, 0, 0);
```

## Y-Sort Depth Sorting (Beat 'em Up)

Entities lower on screen appear in front — run every frame:

```js
entities.forEach(entity => {
  entity.mesh.position.z = -entity.worldY * 0.01;
});
```

## Movement on XZ Plane

```js
function moveEntity(entity, dx, dz, dt) {
  entity.position.x += dx * entity.speed * dt;
  entity.position.z += dz * entity.speed * dt;
}
```

## Performance

- Use `THREE.InstancedMesh` for enemies/projectiles — max 20 enemies on screen
- Max 500 particles — pool and reuse, never allocate in game loop
- No dynamic shadows in combat scenes
- Never create `new THREE.Vector3()` inside the animation loop
- Target 60fps on Intel Iris / integrated GPU

## Lighting

```js
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(5, 10, 5);
// NO castShadow in combat scenes
scene.add(ambientLight, dirLight);
```

## Elemental Aura Particles

```js
const particles = new THREE.BufferGeometry();
const mat = new THREE.PointsMaterial({ color: 0xff4400, size: 0.1, transparent: true });
const aura = new THREE.Points(particles, mat);
character.add(aura);
```

## Hunter Elemental Colours

| Hunter | Primary | Secondary |
|--------|---------|-----------|
| Dabik (Shadow) | `#9b59b6` | `#1a1a2e` |
| Benzu (Thunder) | `#f1c40f` | `#8b6914` |
| Sereisa (Lightning) | `#00d4ff` | `#ffffff` |
| Vesol (Flame) | `#ff4500` | `#ff8c00` |
