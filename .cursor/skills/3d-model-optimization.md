---
name: 3d-model-optimization
description: Compress and optimise 3D models, textures, and assets for fast web delivery. Critical for Vibe Jam rule 08. Total initial payload must stay under 3MB. These are OFFLINE pre-processing steps run on your machine — not part of the game's runtime code.
---

# 3D Model Optimization for Huntix

> **Important:** All tools below (`gltf-transform`, `gltf-pipeline`) are run **once offline on your machine** to prepare assets before committing them. They are NOT added to the game's code or build pipeline. The game itself has no npm, no bundler, no build step.

## Asset Budgets (Hard Limits)

| Asset | Max File Size | Max Triangles |
|---|---|---|
| Hunter character | < 500KB GLB | 5,000 tris |
| Boss model | < 800KB GLB | 8,000 tris |
| Zone environment | < 1MB GLB | 15,000 tris |
| Texture atlas | < 512KB KTX2 | — |
| **Total initial load** | **< 3MB combined** | — |

## Step 1 — Compress Geometry (Draco)

Run once offline to prepare each model:

```bash
# Install globally on your machine (one time only — NOT in the game)
npm install -g @gltf-transform/cli

# Compress geometry
gltf-transform draco hunter-raw.glb hunter.draco.glb

# Compress textures (ETC1S for diffuse, UASTC for normals)
gltf-transform etc1s hunter.draco.glb hunter.etc1s.glb

# Remove unused nodes, materials, textures
gltf-transform prune hunter.etc1s.glb hunter.final.glb

# Check final size
gltf-transform inspect hunter.final.glb
```

## Step 2 — Simplify Mesh if Over Budget

```bash
# Reduce triangle count by 50% with minimal visual error
gltf-transform simplify hunter.final.glb hunter.simple.glb --ratio 0.5 --error 0.001

# Weld duplicate vertices first (always run before simplify)
gltf-transform weld hunter.final.glb hunter.welded.glb
```

## Step 3 — Load in Game with DRACOLoader

This IS game code — add to your asset loader:

```js
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Use Google's hosted Draco decoder — no file to serve yourself
const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

// Preload ALL assets before game starts (Vibe Jam rule 08)
const ASSETS = [
  '/assets/hunters/dabik.final.glb',
  '/assets/hunters/benzu.final.glb',
  '/assets/hunters/sereisa.final.glb',
  '/assets/hunters/vesol.final.glb',
];

async function preloadAllAssets() {
  const results = await Promise.all(ASSETS.map(url => loader.loadAsync(url)));
  return results;
}
// Call this before starting the game loop — never load assets mid-game
```

## Texture Guidelines

- **KTX2** — GPU-native compressed format, use for all model textures
- **Power-of-two** dimensions always: 256, 512, 1024, 2048
- **Texture atlas** — pack all 4 hunter textures into one 2048×2048 sheet
- **JPG** — environment backgrounds (no transparency needed)
- **PNG** — only when transparency is required
- Never exceed 512KB for any single texture file

## InstancedMesh for Runtime Enemies

Never create individual meshes per enemy at runtime:

```js
// Allocated ONCE at scene init
const enemyMesh = new THREE.InstancedMesh(geometry, material, 20); // hard limit: 20
scene.add(enemyMesh);

// Update each enemy position per frame (reuse pre-allocated matrix)
const _m = new THREE.Matrix4();
function setEnemyTransform(i, x, y, z) {
  _m.setPosition(x, y, z);
  enemyMesh.setMatrixAt(i, _m);
  enemyMesh.instanceMatrix.needsUpdate = true;
}
```

## Vibe Jam Rule 08 Checklist

- [ ] All GLBs use Draco compression
- [ ] All textures are KTX2 or atlased
- [ ] No individual model exceeds its triangle budget
- [ ] Total initial payload < 3MB (measure with browser DevTools Network tab)
- [ ] All assets preloaded via `Promise.all()` before first game frame
- [ ] No asset loads triggered mid-game
- [ ] No loading screen — just a brief username prompt at most
