---
name: threejs-skills
description: Three.js skills for creating 3D elements, 2.5D scenes, interactive experiences, and WebGPU-accelerated rendering. Use this for all Three.js scene setup, renderer configuration, camera, lighting, geometry, materials, animation loops, and 2.5D beat em up mechanics.
source: https://github.com/CloudAI-X/threejs-skills
---

# Three.js Skills

You are an expert Three.js developer building a 2.5D browser beat 'em up with Three.js and WebGPU.

## Core Principles

- Always use `THREE.WebGPURenderer` when available, fall back to `THREE.WebGLRenderer`
- Use `requestAnimationFrame` for the game loop — never `setInterval`
- Dispose geometries, materials, and textures when removing objects to prevent memory leaks
- Use `THREE.Object3D` as scene graph nodes for grouping related game entities

## 2.5D Scene Setup

For a beat 'em up 2.5D perspective:

```js
// Angled perspective camera for 2.5D look
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 20);
camera.lookAt(0, 0, 0);

// OR orthographic for pure 2.5D
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(-aspect * 10, aspect * 10, 10, -10, 0.1, 1000);
camera.position.set(0, 5, 20);
camera.lookAt(0, 0, 0);
```

## Y-Axis Depth Sorting (Beat 'em Up)

Entities lower on screen (higher Y world position) appear in front:

```js
// In your update loop
entities.forEach(entity => {
  entity.mesh.renderOrder = -entity.position.z; // or use Y depending on axis convention
});
```

## Movement Plane Constraint

Constrain player/enemy movement to the XZ plane:

```js
// Players move on XZ plane, Y is up
function moveEntity(entity, dx, dz) {
  entity.position.x += dx;
  entity.position.z += dz;
  // Y stays fixed for ground level, or animate for jump
}
```

## Performance

- Use `THREE.InstancedMesh` for enemies/projectiles with the same geometry
- Limit draw calls: merge static geometry with `THREE.BufferGeometryUtils.mergeGeometries()`
- Use `THREE.LOD` for background objects
- Target 60fps — profile with `renderer.info`

## Lighting for Beat 'em Up

```js
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
scene.add(ambientLight, dirLight);
```

## Elemental Aura Effects

Use `THREE.Points` or sprite-based particle systems for elemental hunter auras:

```js
// Particle system for aura
const particles = new THREE.BufferGeometry();
// ... set positions
const mat = new THREE.PointsMaterial({ color: 0xff4400, size: 0.1, transparent: true });
const aura = new THREE.Points(particles, mat);
character.add(aura);
```

## Asset Loading

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader); // compress all GLTF assets with Draco
```
