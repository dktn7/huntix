# Huntix Rendering Model

> **This is the canonical source of truth for how characters, enemies, and the world are rendered.**
> All other docs defer to this file on rendering approach. Agents must read this before touching any visual system.

*Last updated: April 18, 2026 — GLTFLoader scope clarified: world geometry only*

---

## Core Rule: 2D Billboard Sprites in a 3D World

Huntix uses a **hybrid rendering model**:

| Layer | Type | Technique |
|---|---|---|
| Hunters (all 4) | 2D billboard sprite | `PlaneGeometry` + `MeshBasicMaterial` with sprite atlas texture |
| Enemies | 2D billboard sprite | `PlaneGeometry` + `MeshBasicMaterial`, instanced for grunts |
| Attacks / hit VFX | 2D billboard | `PlaneGeometry` or `Points` |
| Aura effects | 2D billboard particle | Pooled `PlaneGeometry` quads with additive blending |
| Zone floors / walls / platforms / props | **3D GLTF mesh** | `.glb` files, `MeshStandardMaterial`, baked AO — see `WORLD3D.md` |
| Parallax backgrounds | 2D plane layers | `PlaneGeometry` quads at fixed Z offsets behind the play field |
| HUD | HTML overlay | DOM elements absolutely positioned over `renderer.domElement` |

Characters and enemies are **never 3D meshes**. There are no GLTF models for characters, no bone rigs, no `AnimationMixer`, no character `.glb` files in this project. World geometry is the **only** place GLTF is used.

---

## Why This Model

- **Silhouette clarity** — 2D sprites give full pixel control over the hunter silhouette. A 3D mesh rotated slightly off-axis loses the dagger profile or the coat shape. A sprite never does.
- **World depth** — 3D GLTF environment meshes with baked AO give the zones weight, atmosphere, and environmental storytelling that flat `BoxGeometry` cannot. This is the Dead Cells and Hades model: 2D characters in a real 3D world.
- **Aura systems** — per-hunter aura colours, glow crackles, and animation-state effects are sprite frame swaps and particle overlays. The equivalent in 3D requires custom shaders and material blending.
- **Performance** — 60fps on Intel Iris is the target. Sprite quads with an atlas are the lightest possible character draw path. Four hunters + 20 enemies as rigged 3D meshes would blow the draw call and fill rate budgets. World geometry is low-poly (15,000 tri budget per zone) and fully baked.
- **Asset pipeline** — characters follow Mixboard → Google Flow → TexturePacker → sprite atlas. World geometry follows Blender/Meshy → GLTF export → GLTFLoader. See `WORLDASSETPIPELINE.md`.
- **Inspirations** — Castle Crashers (gameplay template), Dead Cells, and Hades all use exactly this hybrid: 2D or flat-shaded characters in a detailed 3D environment world.

---

## Billboard Rule

Every character and enemy sprite must always face the camera. The camera is fixed orthographic with a small oblique tilt (10–12°), so billboard meshes use `PlaneGeometry` in XY plus a counter-tilt on the sprite body (`sprite.rotation.x = -cameraTiltX`) to remain camera-facing. No `lookAt` billboard shader is needed.

```js
// Correct — sprite lives in XY plane, faces the fixed -Z camera automatically
const geo = new THREE.PlaneGeometry(1, 1);
const mat = new THREE.MeshBasicMaterial({ map: spriteAtlas, transparent: true, alphaTest: 0.1 });
const sprite = new THREE.Mesh(geo, mat);
sprite.position.set(x, y, z);
scene.add(sprite);

// WRONG — never do this for characters
const loader = new GLTFLoader();
loader.load('assets/models/characters/dabik.glb', ...); // characters are NEVER GLTF
```

---

## GLTFLoader — Scope

`GLTFLoader` is used in this project for **world geometry only**.

| System | Uses GLTFLoader? |
|--------|------------------|
| Hunters | ❌ No — 2D sprite atlas |
| Enemies | ❌ No — 2D sprite atlas |
| Bosses | ❌ No — 2D sprite atlas |
| Zone floors / walls / props | ✅ Yes — GLTF `.glb` meshes |
| Portals | ✅ Yes — GLTF `.glb` mesh + emissive |

World GLTF assets live in `assets/models/world/`. Full spec in `WORLD3D.md` and `WORLDASSETPIPELINE.md`.

```js
// CORRECT — GLTFLoader for world geometry only
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const loader = new GLTFLoader();
loader.load('./assets/models/world/city-breach/cb-floor.glb', (gltf) => {
  scene.add(gltf.scene);
});
```

---

## Sprite Atlas Format

All character and enemy animations are packed into texture atlases using TexturePacker.

- **Source frames:** exported from Google Flow animation output (green screen #00FF00 removed)
- **Format:** WebP sprite sheet with accompanying JSON frame data
- **Location:** `assets/sprites/` (not `assets/models/`)
- **Per hunter:** one atlas per hunter covering all animation states
- **Per enemy type:** one atlas per enemy type

```
assets/
  sprites/
    hunters/
      dabik-atlas.webp
      dabik-atlas.json
      benzu-atlas.webp
      benzu-atlas.json
      sereisa-atlas.webp
      sereisa-atlas.json
      vesol-atlas.webp
      vesol-atlas.json
    enemies/
      grunt-atlas.webp
      grunt-atlas.json
      ranged-atlas.webp
      ranged-atlas.json
      bruiser-atlas.webp
      bruiser-atlas.json
    bosses/
      vrael-atlas.webp
      vrael-atlas.json
      zarth-atlas.webp
      zarth-atlas.json
      kibad-atlas.webp
      kibad-atlas.json
      thyxis-atlas.webp
      thyxis-atlas.json
    particles/
      fx-atlas.webp
      fx-atlas.json
  models/
    world/               ← ONLY valid models directory
      city-breach/
      ruin-den/
      shadow-core/
      thunder-spire/
      hub/
```

---

## Animation System: Frame-Based, Not Mixer-Based

Character animation is driven by frame index stepping through the sprite atlas — not `THREE.AnimationMixer`, not `crossFadeTo()`, not GLTF clips.

```js
// SpriteAnimator — drives UV offset on the PlaneGeometry material
class SpriteAnimator {
  constructor(material, frameData) { ... }

  play(stateName) {
    this._frames = this._frameData[stateName];
    this._frameIndex = 0;
    this._timer = 0;
  }

  update(dt) {
    this._timer += dt;
    if (this._timer >= this._frameDuration) {
      this._timer = 0;
      this._frameIndex = (this._frameIndex + 1) % this._frames.length;
      this._applyUVOffset(this._frames[this._frameIndex]);
    }
  }
}
```

- State transitions: swap `play(newState)` call — instant hard cut or handled by the transition rules in `ANIMATIONS.md`
- Blending: not used — hard cuts between states only (appropriate for a brawler)
- `AnimationController.js` wraps `SpriteAnimator` per hunter and subscribes to `PlayerState.js` changes

---

## Y-Sort Depth

All game objects (sprites and 3D world meshes) are depth-sorted every frame so characters appear correctly in front of or behind world geometry.

```js
// Applied every frame to every game object
mesh.position.z = -worldY * 0.01;
```

- Higher Y in world space (further from camera in the 2.5D perspective) = lower Z = rendered behind
- Lower Y (closer to camera) = higher Z = rendered in front
- Floor shadows under sprites must also be Y-sorted (slightly below the sprite's Z)

---

## Floor Shadow Under Sprites

Every character and enemy must have a soft drop shadow on the floor to ground them in the 3D world. Without this, sprites float.

```js
// A simple dark ellipse quad placed just below the sprite
const shadowGeo = new THREE.PlaneGeometry(0.8, 0.3);
const shadowMat = new THREE.MeshBasicMaterial({
  color: 0x000000,
  transparent: true,
  opacity: 0.35,
  depthWrite: false
});
const shadow = new THREE.Mesh(shadowGeo, shadowMat);
shadow.position.set(x, floorY + 0.01, z + 0.001);
```

---

## Parallax Background Layers

Each zone has 2–3 background layers at different Z depths to create the 2.5D depth illusion.

```js
// Layer Z positions and camera-follow speeds
const BG_Z   = -20; // background
const MID_Z  =  -8; // midground
const FG_Z   =  -1; // foreground

const BG_SPEED  = 0.05;
const MID_SPEED = 0.30;
const FG_SPEED  = 0.80;
```

---

## What Is Never Used (Character Pipeline Only)

These restrictions apply **to characters, enemies, and bosses only**. World geometry uses GLTF — see above.

- `THREE.AnimationMixer` — not used (characters use frame stepping)
- `THREE.SkinnedMesh` — not used
- `THREE.Bone` — not used
- Character GLTF / GLB files — characters are sprites, not meshes
- `assets/models/characters/` — does not exist; characters use `assets/sprites/`
- Perspective camera — not used (orthographic only)
- Dynamic shadow maps (`THREE.DirectionalLight` shadow maps) — not used (baked AO only)

---

## Instanced Sprites for Grunts

Grunt enemies use `THREE.InstancedMesh` to keep draw calls low when up to 20 are on screen.

```js
const gruntGeo = new THREE.PlaneGeometry(1, 1);
const gruntMat = new THREE.MeshBasicMaterial({ map: gruntAtlas, transparent: true });
const gruntPool = new THREE.InstancedMesh(gruntGeo, gruntMat, 20); // max 20
scene.add(gruntPool);
```

---

## Source of Truth Chain

```
VISUAL-DESIGN.md      — art direction, colour system, Mixboard prompts
ART-DIRECTION-OBLIQUE.md — oblique camera + scale guidance for sprites/world
     ↓
VISUAL-REFERENCE.md   — design lock (read before asset generation)
     ↓
ANIMATIONS.md         — frame budgets, state machine, per-hunter notes
     ↓
RENDERING.md          — THIS FILE — hybrid model: 2D sprites + 3D world
     ↓
WORLD3D.md            — 3D world mesh spec, zone environment design
WORLDASSETPIPELINE.md — how to create and export world meshes
     ↓
src/visuals/HunterMeshes.js       — character sprite implementation
src/visuals/[Zone]Arena.js        — world GLTF loading per zone
src/gameplay/AnimationController.js — animation state wiring
```
