# Skill: sprite-animation

Load this skill when working on: sprite rendering, UV frame stepping, atlas loading, `SpriteAnimator.js`, `HunterMeshes.js`, or any task involving character/enemy visuals.

---

## The Model

Huntix uses **2D billboard sprites in a 3D world**. Characters are `PlaneGeometry` quads with a `MeshBasicMaterial` pointing at a sprite atlas PNG. Animation is UV offset/repeat stepping — NOT `AnimationMixer`, NOT GLTF clips.

**Full spec:** `docs/SPRITES.md` — read it alongside this skill.

---

## Critical Rules

- `THREE.NearestFilter` on all atlas textures — never linear
- `wrapS = wrapT = THREE.ClampToEdgeWrapping` — never RepeatWrapping on an atlas
- `texture.flipY = false` — TexturePacker JSON is top-left origin
- Pivot = bottom-centre: `geo.translate(0, height / 2, 0)` so world position is at feet
- Flip facing via `mesh.scale.x = -1` — never rotate the mesh
- Y-sort every frame: `mesh.renderOrder = worldY * 10`
- Clone the texture per sprite: `mat.map = atlasTexture.clone(); mat.map.needsUpdate = true;`
- Never call `material.map.needsUpdate = true` after changing offset/repeat — not needed, wastes a flag
- Never create a new `THREE.Texture` inside the game loop — load once, reuse

---

## UV Calculation

For frame `{ x, y, w, h }` on atlas size `{ W, H }`:

```js
texture.offset.set(x / W, 1 - (y + h) / H);
texture.repeat.set(w / W, h / H);
```

Three.js UV origin is bottom-left. TexturePacker JSON origin is top-left. The `1 - (y + h) / H` term converts between them.

---

## SpriteAnimator Pattern

```js
class SpriteAnimator {
  constructor(material, atlasData) {
    this.material = material;
    this.frames = atlasData.frames;  // { frameName: { frame: {x,y,w,h}, sourceSize } }
    this.meta = atlasData.meta;      // { size: { w, h } }
    this.W = atlasData.meta.size.w;
    this.H = atlasData.meta.size.h;

    this.currentState = null;
    this.currentFrame = 0;
    this.elapsed = 0;
    this.loop = true;
    this.onComplete = null;
    this.frameList = [];   // ordered frame keys for current state
    this.fps = 8;
  }

  play(state, loop = true, onComplete = null) {
    if (this.currentState === state) return;  // already playing
    this.currentState = state;
    this.loop = loop;
    this.onComplete = onComplete;
    this.currentFrame = 0;
    this.elapsed = 0;
    // Build ordered frame list: all keys matching "state_00", "state_01", ...
    this.frameList = Object.keys(this.frames)
      .filter(k => k.startsWith(state + '_'))
      .sort();
    this.fps = FPS_OVERRIDES[state] ?? 8;
    this._applyFrame();
  }

  update(dt) {
    if (!this.frameList.length) return;
    this.elapsed += dt;
    const frameDuration = 1 / this.fps;
    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      this.currentFrame++;
      if (this.currentFrame >= this.frameList.length) {
        if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.frameList.length - 1;  // hold last frame
          if (this.onComplete) { this.onComplete(); this.onComplete = null; }
          return;
        }
      }
      this._applyFrame();
    }
  }

  _applyFrame() {
    const key = this.frameList[this.currentFrame];
    if (!key) return;
    const { x, y, w, h } = this.frames[key].frame;
    const map = this.material.map;
    map.offset.set(x / this.W, 1 - (y + h) / this.H);
    map.repeat.set(w / this.W, h / this.H);
  }
}

const FPS_OVERRIDES = {
  idle: 6,
  run: 10,
  attack_light_1: 14,
  attack_light_2: 14,
  attack_light_3: 14,
  attack_heavy: 10,
  hurt: 18,
  dodge: 14,
};
```

---

## Common Mistakes to Avoid

| Mistake | Fix |
|---------|-----|
| `texture.needsUpdate = true` each frame | Only needed once after initial load. offset/repeat changes don't need it |
| `new THREE.Texture()` in game loop | Load atlas once at scene init, store in a map |
| All grunts share one material | Each active sprite needs its own `mat.map = texture.clone()` |
| `mesh.rotation.y = Math.PI` to flip | Use `mesh.scale.x = -1` |
| `texture.flipY = true` (default) | Must be `false` for TexturePacker JSON coords |
| RepeatWrapping on atlas | Use ClampToEdgeWrapping — repeat wrapping bleeds adjacent frames |
| Linear filter on pixel-art sprites | Always `NearestFilter` for both mag and min |

---

## Instanced Sprites (Groups of Same Enemy)

Use `THREE.InstancedMesh` when 3+ of the same enemy type are active and in the same animation state.

```js
const mesh = new THREE.InstancedMesh(geo, mat, MAX_COUNT);
// Update position each frame:
const dummy = new THREE.Object3D();
dummy.position.set(x, y, -y * 0.01);
dummy.updateMatrix();
mesh.setMatrixAt(i, dummy.matrix);
mesh.instanceMatrix.needsUpdate = true;
```

**Caveat:** All instances share UVs. When an individual enemy transitions to `hurt`, `attack`, or `dead`, spawn a standalone non-instanced mesh for that enemy and hide its instance slot.

---

## Atlas Load Pattern (Reference)

```js
async function loadAtlas(name) {
  const [atlasData, texture] = await Promise.all([
    fetch(`assets/sprites/${name}.json`).then(r => r.json()),
    new Promise(res => new THREE.TextureLoader().load(`assets/sprites/${name}.png`, res)),
  ]);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = false;
  return { texture, atlasData };
}
```

Call this once per character type during scene init. Store results in a shared `AtlasRegistry` map.

---

## Y-Sort

Run this every frame for every sprite after updating world position:

```js
// Option A — renderOrder (preferred, no Z fighting)
mesh.renderOrder = Math.round(entity.worldY * 100);

// Option B — Z position (also valid)
mesh.position.z = -entity.worldY * 0.01;
```

Pick one and use it consistently across the entire project. `renderOrder` is cleaner and doesn't affect physics raycasts.

---

## Related Docs

- `docs/SPRITES.md` — full pipeline spec, atlas format, world sizes
- `docs/RENDERING.md` — rendering pipeline overview
- `docs/ANIMATIONS.md` — per-hunter animation state lists
- `docs/TECHSTACK.md` — hard rules (no GLTF, no AnimationMixer)
