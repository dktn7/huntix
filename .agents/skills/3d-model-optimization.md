---
name: 3d-model-optimization
description: Compress and optimise 3D models, textures, and assets for fast web delivery. Critical for Vibe Jam rule 08 — no heavy downloads. Total initial payload must stay under 3MB.
---

# 3D Model Optimization for Huntix

## Asset Budgets

| Asset | Max File Size | Max Tris |
|---|---|---|
| Hunter character | < 500KB GLB | 5,000 |
| Boss model | < 800KB GLB | 8,000 |
| Zone environment | < 1MB GLB | 15,000 |
| Total initial load | < 3MB | — |

## Draco Compression

```bash
npm install -g @gltf-transform/cli
gltf-transform draco hunter.glb hunter.draco.glb
gltf-transform etc1s hunter.draco.glb hunter.final.glb  # texture compression
gltf-transform prune hunter.final.glb hunter.clean.glb   # remove unused data
```

## Load with DRACOLoader

```js
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);
```

## Instanced Enemies

```js
const mesh = new THREE.InstancedMesh(geometry, material, MAX_ENEMIES);
scene.add(mesh);
const matrix = new THREE.Matrix4();
matrix.setPosition(x, y, z);
mesh.setMatrixAt(i, matrix);
mesh.instanceMatrix.needsUpdate = true;
```

## Preload All Assets Before First Frame

```js
await Promise.all(assetUrls.map(url => loader.loadAsync(url)));
// then start game loop
```
