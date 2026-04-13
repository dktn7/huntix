---
name: 3d-model-optimization
description: Compress and optimise 3D models for fast web delivery. Total initial payload < 3MB. IMPORTANT: all CLI tools below are run offline on your machine to prepare assets — they are NOT part of the game code. The game has no npm, no bundler, no build step.
---

# 3D Model Optimization for Huntix

> All `gltf-transform` commands below are **offline pre-processing tools** run on your machine to prepare GLB files before committing to `assets/`. They do NOT go in the game code.

## Asset Budgets

| Asset | Max Size | Max Tris |
|---|---|---|
| Hunter | < 500KB | 5,000 |
| Boss | < 800KB | 8,000 |
| Zone env | < 1MB | 15,000 |
| **Total load** | **< 3MB** | — |

## Offline Asset Preparation

```bash
# Install once on your machine (NOT in game)
npm install -g @gltf-transform/cli

# Full pipeline per model:
gltf-transform weld hunter-raw.glb hunter.welded.glb      # weld verts
gltf-transform simplify hunter.welded.glb hunter.simple.glb --ratio 0.5  # reduce tris if needed
gltf-transform draco hunter.simple.glb hunter.draco.glb   # compress geometry
gltf-transform etc1s hunter.draco.glb hunter.final.glb    # compress textures
gltf-transform prune hunter.final.glb hunter.clean.glb    # remove unused data
gltf-transform inspect hunter.clean.glb                   # verify file size + tri count

# Then commit hunter.clean.glb to assets/hunters/
```

## Game Code — DRACOLoader

```js
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

// Preload ALL before game starts — never load mid-game
const ASSETS = [
  '/assets/hunters/dabik.clean.glb',
  '/assets/hunters/benzu.clean.glb',
  '/assets/hunters/sereisa.clean.glb',
  '/assets/hunters/vesol.clean.glb',
];
await Promise.all(ASSETS.map(url => loader.loadAsync(url)));
```

## InstancedMesh (Runtime — enemies)

```js
// Pre-allocate ONCE — never in game loop
const enemies = new THREE.InstancedMesh(geometry, material, 20);
const _m = new THREE.Matrix4();
function setEnemyTransform(i, x, y, z) {
  _m.setPosition(x, y, z);
  enemies.setMatrixAt(i, _m);
  enemies.instanceMatrix.needsUpdate = true;
}
```

## Vibe Jam Rule 08 Checklist

- [ ] All GLBs Draco-compressed
- [ ] Total payload < 3MB (check Network tab)
- [ ] All assets preloaded before first frame
- [ ] No mid-game asset loading
- [ ] No loading screen
