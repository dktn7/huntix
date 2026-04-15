# Huntix Rendering Model

> **This is the canonical source of truth for how characters, enemies, and the world are rendered.**
> All other docs defer to this file on rendering approach. Agents must read this before touching any visual system.

---

## Core Rule: 2D Billboard Sprites in a 3D World

Huntix uses a **hybrid rendering model**:

| Layer | Type | Technique |
|---|---|---|
| Hunters (all 4) | 2D billboard sprite | `PlaneGeometry` + `MeshBasicMaterial` with sprite atlas texture |
| Enemies | 2D billboard sprite | `PlaneGeometry` + `MeshBasicMaterial`, instanced for grunts |
| Attacks / hit VFX | 2D billboard | `PlaneGeometry` or `Points` |
| Aura effects | 2D billboard particle | Pooled `PlaneGeometry` quads with additive blending |
| Zone floors / walls / platforms | 3D mesh geometry | `BoxGeometry` / custom mesh, `MeshStandardMaterial`, baked AO |
| Parallax backgrounds | 2D plane layers | `PlaneGeometry` quads at fixed Z offsets behind the play field |
| HUD | HTML overlay | DOM elements absolutely positioned over `renderer.domElement` |

Characters and enemies are **never 3D meshes**. There are no GLTF models, no bone rigs, no `AnimationMixer`, no `GLTFLoader` in this project.

---

## Why This Model

- **Silhouette clarity** — 2D sprites give full pixel control over the hunter silhouette. A 3D mesh rotated slightly off-axis loses the dagger profile or the coat shape. A sprite never does.
- **Aura systems** — per-hunter aura colours, glow crackles, and animation-state effects (lightning on Sereisa's blade, shadow drift at Dabik's feet) are sprite frame swaps and particle overlays. The equivalent in 3D requires custom shaders and material blending.
- **Performance** — 60fps on Intel Iris is the target. Sprite quads with an atlas are the lightest possible character draw path. Four hunters + 20 enemies as rigged 3D meshes would blow the draw call and fill rate budgets.
- **Asset pipeline** — the art pipeline is Mixboard → Grok → TexturePacker → sprite atlas → Three.js. There is no 3D modelling step.
- **Inspirations** — Castle Crashers (the direct gameplay template) uses exactly this model: flat 2D sprites in a 3D scrolling world with Y-sort depth.

---

## Billboard Rule

Every character and enemy sprite must always face the camera. Since the camera is fixed orthographic looking straight down the -Z axis, sprites are created as `PlaneGeometry` in the XY plane and never rotated. They automatically face the camera — no billboard shader or `lookAt` call needed.

```js
// Correct — sprite lives in XY plane, faces the fixed -Z camera automatically
const geo = new THREE.PlaneGeometry(1, 1);
const mat = new THREE.MeshBasicMaterial({ map: spriteAtlas, transparent: true, alphaTest: 0.1 });
const sprite = new THREE.Mesh(geo, mat);
sprite.position.set(x, y, z);
scene.add(sprite);

// WRONG — never do this for characters
const loader = new GLTFLoader();
loader.load('assets/models/dabik.glb', ...);
```

---

## Sprite Atlas Format

All character and enemy animations are packed into texture atlases using TexturePacker.

- **Source frames:** exported from Grok animation output (green screen #00FF00 removed)
- **Format:** PNG sprite sheet with accompanying JSON frame data
- **Location:** `assets/sprites/` (not `assets/models/`)
- **Per hunter:** one atlas per hunter covering all animation states
- **Per enemy type:** one atlas per enemy type

```
assets/
  sprites/
    dabik.png         — full sprite sheet
    dabik.json        — frame data (x, y, w, h per frame)
    benzu.png
    benzu.json
    sereisa.png
    sereisa.json
    vesol.png
    vesol.json
    enemy-grunt.png
    enemy-grunt.json
    enemy-ranged.png
    enemy-ranged.json
    enemy-bruiser.png
    enemy-bruiser.json
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
- `AnimationController.js` (Phase 3) wraps `SpriteAnimator` per hunter and subscribes to `PlayerState.js` changes

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
shadow.position.set(x, floorY + 0.01, z + 0.001); // just above floor, just behind sprite
```

---

## Parallax Background Layers

Each zone has 2–3 background layers at different Z depths to create the 2.5D depth illusion.

```js
// Layer Z positions — behind the play field (Z=0 is play field)
const BG_FAR_Z   = -5;   // distant background (buildings, skyline)
const BG_MID_Z   = -2;   // mid layer (rubble, environmental detail)
const BG_NEAR_Z  =  0;   // play field floor
// Characters render at Z derived from worldY (Y-sort)
// Foreground props: positive Z (in front of characters)
```

---

## What Is Never Used

- `GLTFLoader` — not imported, not used
- `THREE.AnimationMixer` — not used
- `THREE.SkinnedMesh` — not used
- `THREE.Bone` — not used
- GLTF / GLB files — not in this project
- `assets/models/` directory — does not exist; use `assets/sprites/`
- Perspective camera — not used (orthographic only)
- Dynamic shadows (`THREE.DirectionalLight` shadow maps) — not used

---

## Instanced Sprites for Grunts

Grunt enemies use `THREE.InstancedMesh` to keep draw calls low when up to 20 are on screen.

```js
const gruntGeo = new THREE.PlaneGeometry(1, 1);
const gruntMat = new THREE.MeshBasicMaterial({ map: gruntAtlas, transparent: true });
const gruntPool = new THREE.InstancedMesh(gruntGeo, gruntMat, 20); // max 20
scene.add(gruntPool);
// Update each instance matrix per frame
```

---

## Source of Truth Chain

```
VISUAL-DESIGN.md   — art direction, colour system, Mixboard prompts
     ↓
VISUAL-REFERENCE.md — design lock (read before asset generation)
     ↓
ANIMATIONS.md      — frame budgets, state machine, per-hunter notes
     ↓
RENDERING.md       — THIS FILE — how sprites are built and rendered in Three.js
     ↓
src/visuals/HunterMeshes.js — implementation
src/gameplay/AnimationController.js — state machine wiring
```
