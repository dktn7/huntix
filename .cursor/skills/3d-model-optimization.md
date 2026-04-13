---
name: 3d-model-optimization
description: Optimise and compress 3D models, textures, and assets for fast web delivery. Use when preparing hunter models, boss geometry, zone environments, and any GLTF/GLB assets. Critical for Vibe Jam rule 08 — no heavy downloads.
source: mcpmarket.com/tools/skills/categories/game-development
---

# 3D Model Optimization for Huntix

Every asset must load fast. Vibe Jam rule 08 requires near-instant game start — no heavy downloads.

## Target Budgets

| Asset Type | Max File Size | Max Triangles |
|---|---|---|
| Hunter character | <500KB GLB | <5,000 tris |
| Boss model | <800KB GLB | <8,000 tris |
| Zone environment | <1MB GLB | <15,000 tris |
| Texture atlas | <512KB KTX2 | — |
| Total initial load | <3MB combined | — |

## Draco Compression (GLTF/GLB)

Always export with Draco geometry compression:

```bash
# Using gltf-pipeline
npm install -g gltf-pipeline
gltf-pipeline -i hunter.glb -o hunter.draco.glb --draco.compressionLevel 10

# Or with glTF Transform
npm install -g @gltf-transform/cli
gltf-transform draco hunter.glb hunter.draco.glb
```

Load in Three.js with DRACOLoader:

```js
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);
```

## Texture Optimization

```bash
# Convert to KTX2 (GPU-native compressed format)
npm install -g @gltf-transform/cli
gltf-transform etc1s hunter.draco.glb hunter.final.glb  # ETC1S for diffuse
gltf-transform uastc hunter.draco.glb hunter.final.glb  # UASTC for normals/roughness
```

- Use texture atlases — pack all hunter textures into one 1024x1024 or 2048x2048 sheet
- Power-of-two dimensions always (256, 512, 1024, 2048)
- Use `.basis` / KTX2 over PNG/JPG for GPU textures
- JPG for environment backgrounds (no alpha needed)
- PNG only when transparency is required

## Mesh Optimization

```bash
# Simplify mesh (reduce triangle count)
gltf-transform simplify hunter.glb hunter.simple.glb --ratio 0.5 --error 0.001

# Weld duplicate vertices
gltf-transform weld hunter.glb hunter.welded.glb

# Remove unused data
gltf-transform prune hunter.glb hunter.clean.glb
```

## Instanced Enemies

Never create individual meshes per enemy — use `THREE.InstancedMesh`:

```js
const geometry = new THREE.BoxGeometry(1, 2, 1);
const material = new THREE.MeshStandardMaterial();
const instancedEnemies = new THREE.InstancedMesh(geometry, material, MAX_ENEMIES);
scene.add(instancedEnemies);

// Update each enemy transform
const matrix = new THREE.Matrix4();
matrix.setPosition(enemy.x, enemy.y, enemy.z);
instancedEnemies.setMatrixAt(i, matrix);
instancedEnemies.instanceMatrix.needsUpdate = true;
```

## Preloading Strategy

Load all assets before the game starts — show a minimal loading indicator, not a loading screen:

```js
const assets = [
  '/assets/hunters/dabik.draco.glb',
  '/assets/hunters/benzu.draco.glb',
  '/assets/hunters/sereisa.draco.glb',
  '/assets/hunters/vesol.draco.glb',
];

// Load all in parallel
await Promise.all(assets.map(url => loader.loadAsync(url)));
// Then start game immediately
```

## Vibe Jam Rule 08 Checklist

- [ ] All GLB files use Draco compression
- [ ] Textures are KTX2 or atlased JPG/PNG
- [ ] No model exceeds its triangle budget
- [ ] Total initial asset payload < 3MB
- [ ] Assets preloaded before first frame renders
- [ ] No runtime texture/geometry creation in the game loop
