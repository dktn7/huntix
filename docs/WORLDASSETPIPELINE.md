# HUNTIX — World Asset Pipeline

> How 3D environment meshes are created, exported, and loaded into the game.
> For characters/enemies/bosses, see `ASSETPIPELINE.md` (sprite pipeline — separate system).

*Last updated: April 18, 2026*

---

## Overview

World geometry follows a completely separate pipeline from character sprites:

```
Blender (model + UV + bake AO)
  → Export as .glb (GLTF binary, Y-up)
    → Convert textures to WebP
      → Place in assets/models/world/[zone]/
        → Load via GLTFLoader in [Zone]Arena.js
```

---

## Step 1 — Modelling (Blender)

**Style target:** low-poly with baked detail. Think Dead Cells or Hades zone environments — clean geometry with surface storytelling baked in, not high-poly in-engine.

- Keep polygon count low. The entire zone budget is **15,000 triangles max** across all meshes.
- Use simple extruded forms for floors and walls. Surface detail (cracks, tiles, rust) is in the baked texture, not the geometry.
- Scale: **1 Blender unit = 1 Three.js world unit**
- Up axis: **Y-up** (not Z-up — match Three.js default)
- Arena dimensions match the game spec: **40 units wide × 10 units tall** (see `ZONES.md`)

### Modelling Checklist
- [ ] Applied scale (Ctrl+A → Scale)
- [ ] Faces all outward-facing (no flipped normals)
- [ ] No loose geometry or doubles
- [ ] UV unwrapped (Smart UV Project is fine for props)
- [ ] Named sensibly: `cb-floor`, `cb-wall-back`, `cb-prop-barrel-01`

---

## Step 2 — Baking

All lighting detail is baked into textures. There are **no dynamic shadow maps** in Huntix.

### What to Bake
| Pass | Purpose |
|------|---------|
| AO (Ambient Occlusion) | Adds contact shadow, grounding, depth |
| Diffuse | Base colour with material variation |
| Combined | AO multiplied onto diffuse — one texture in-engine |

### Bake Settings
- Render engine: **Cycles** (accurate AO baking)
- AO samples: 64 minimum
- Output size: **1024×1024px** max (performance budget)
- Format: PNG (convert to WebP after, see Step 4)

---

## Step 3 — Export from Blender

File → Export → **glTF 2.0 (.glb/.gltf)**

| Setting | Value |
|---------|-------|
| Format | **glTF Binary (.glb)** |
| Include | Selected Objects only |
| Transform — Y Up | ✅ Enabled |
| Geometry — Apply Modifiers | ✅ Enabled |
| Geometry — UVs | ✅ Enabled |
| Geometry — Normals | ✅ Enabled |
| Materials — Export | ✅ Enabled |
| Compression | Disabled (Draco adds load complexity) |

Export one `.glb` per category (floor, walls, props) — not one giant file per zone.

---

## Step 4 — Convert Textures to WebP

Convert all PNG bake outputs to WebP before placing in the project.

```bash
# Using cwebp (install via Homebrew or apt)
cwebp -q 85 cb-floor-baked.png -o cb-floor-baked.webp
```

- Quality: **85** for environment textures
- Replace the PNG reference in the GLB with the WebP path after conversion
- This halves texture file size with no visible quality loss

---

## Step 5 — Directory Placement

```
assets/models/world/
  city-breach/
    cb-floor.glb         ← floor mesh + baked texture
    cb-walls.glb         ← back wall + side walls
    cb-props.glb         ← all dressing props bundled
    cb-portal.glb        ← gate portal geometry
  ruin-den/
    rd-floor.glb
    rd-walls.glb
    rd-props.glb
    rd-portal.glb
  shadow-core/
    sc-floor.glb
    sc-walls.glb
    sc-props.glb
    sc-portal.glb
  thunder-spire/
    ts-floor.glb
    ts-walls.glb
    ts-props.glb
    ts-portal.glb
  hub/
    hub-floor.glb
    hub-walls.glb
    hub-props.glb
```

---

## Step 6 — Loading in Three.js

Each zone arena file handles its own world loading.

```js
// src/visuals/CityBreachArena.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// GLTFLoader is ONLY used for world geometry — never for characters
const loader = new GLTFLoader();

export class CityBreachArena {
  constructor(scene) {
    this._scene = scene;
    this._worldGroup = new THREE.Group();
    scene.add(this._worldGroup);
  }

  load(onReady) {
    let loaded = 0;
    const total = 3; // floor, walls, props
    const onLoad = () => { if (++loaded === total) onReady(); };

    loader.load('./assets/models/world/city-breach/cb-floor.glb', (gltf) => {
      this._worldGroup.add(gltf.scene);
      onLoad();
    });
    loader.load('./assets/models/world/city-breach/cb-walls.glb', (gltf) => {
      this._worldGroup.add(gltf.scene);
      onLoad();
    });
    loader.load('./assets/models/world/city-breach/cb-props.glb', (gltf) => {
      this._worldGroup.add(gltf.scene);
      onLoad();
    });
  }

  dispose() {
    this._worldGroup.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });
    this._scene.remove(this._worldGroup);
  }
}
```

---

## AI-Assisted World Art (No Blender)

If Blender is not available, low-poly zone environments can be generated using AI 3D tools:

| Tool | Use |
|------|-----|
| **Meshy** (meshy.ai) | Text-to-3D low-poly environment assets, exports GLTF |
| **Blockbench** | Browser-based low-poly modeller, exports GLTF — good for props |
| **CSM.ai** | Image-to-3D, can convert zone concept art into mesh |

All AI-generated meshes must still:
- Be exported as `.glb`
- Have textures baked or UV-mapped
- Stay within the 15,000 triangle zone budget
- Have scale applied and Y-up orientation

---

## Performance Checklist (Before Committing Any Asset)

- [ ] `.glb` file size under 2MB per category file
- [ ] Texture atlas ≤ 1024×1024px
- [ ] Total zone triangles ≤ 15,000
- [ ] No duplicate geometry or unused meshes
- [ ] Loads and disposes cleanly (tested in isolation)
- [ ] Correct Z placement — floor at Y=0, walls behind play field

---

## Source of Truth Chain

```
VISUAL-DESIGN.md        — zone colour palettes, art direction
     ↓
WORLD3D.md              — zone mesh spec, what 3D covers, poly budgets
     ↓
WORLDASSETPIPELINE.md   — THIS FILE — how to make and export the meshes
     ↓
src/visuals/[Zone]Arena.js — implementation
```
