# Huntix Tech Stack

Complete technical reference for every layer of the project. Read before writing any code.

> **Rendering model:** Characters and enemies are **2D billboard sprites** in a 3D world. See `docs/RENDERING.md` for the full spec. There are no 3D character models, no GLTF files, no AnimationMixer.

---

## Core Stack

| Layer | Choice | Reason |
|---|---|---|
| Renderer | Three.js r169 | 2.5D orthographic, sprite-in-3D-world, CDN — no build step |
| Camera | OrthographicCamera | Fixed, 2.5D readability, no rotation needed |
| Module system | ES Modules (`type="module"`) | Native browser, no bundler |
| Bundler | None | Instant load, jam rules, no npm |
| Package manager | None | CDN importmap only |
| Audio | Howler.js (CDN) | Phase 6 — lightweight, Web Audio API wrapper |
| Physics | Custom AABB | No physics library — X/Y plane only, simple enough |
| Build / Deploy | Static files | Push to domain, GitHub Pages, Netlify, or Fly.io |

---

## Three.js Setup

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"
  }
}
</script>
<script type="module" src="src/main.js"></script>
```

**Version:** Three.js `0.169.0` — locked. Do not upgrade mid-jam.

**Addons used:**
- `three/addons/controls/OrbitControls.js` — debug only, never shipped

**Addons NOT used:**
- `GLTFLoader` — no 3D models in this project
- `AnimationMixer` — animation is frame-based sprite stepping, not GLTF clips

---

## Camera

```js
// From src/engine/Renderer.js — the real values used in production
import { ORTHO_WIDTH, ORTHO_HEIGHT } from './Renderer.js';
// ORTHO_HEIGHT = 10  (world units visible vertically)
// ORTHO_WIDTH  = ORTHO_HEIGHT * (1280 / 720)  ≈ 17.78

const cam = new THREE.OrthographicCamera(
  -ORTHO_WIDTH  / 2,  // left
   ORTHO_WIDTH  / 2,  // right
   ORTHO_HEIGHT / 2,  // top
  -ORTHO_HEIGHT / 2,  // bottom
  0.1,                // near
  1000                // far
);
// Camera sits at Z=100 looking straight down -Z axis
cam.position.set(0, 0, 100);
cam.lookAt(0, 0, 0);
```

- Fixed orthographic — never switch to perspective
- `ORTHO_HEIGHT = 10` world units; `ORTHO_WIDTH ≈ 17.78` (16:9 ratio)
- Camera position is `(0, 0, 100)` — looking at origin, never moved
- Zoom for co-op: lerp `ORTHO_HEIGHT` multiplier when players spread (Phase 3)
- Do not rotate camera

---

## Project Structure

```
huntix/
├── index.html            # Entry point, importmap, widget
├── src/
│   ├── main.js           # Bootstrap — wires all modules
│   ├── engine/           # Core systems (renderer, loop, input, scene)
│   │   ├── GameLoop.js
│   │   ├── Renderer.js
│   │   ├── SceneManager.js
│   │   └── InputManager.js
│   ├── gameplay/         # Game logic (combat, AI, spawner, state)
│   │   ├── PlayerState.js       (Phase 1)
│   │   ├── CombatController.js  (Phase 1)
│   │   ├── Hitbox.js            (Phase 1)
│   │   ├── ManaBar.js           (Phase 1)
│   │   ├── EnemyAI.js           (Phase 2)
│   │   ├── EnemySpawner.js      (Phase 2)
│   │   ├── AnimationController.js (Phase 3)
│   │   ├── HunterController.js  (Phase 3)
│   │   ├── ZoneManager.js       (Phase 4)
│   │   ├── PortalManager.js     (Phase 4)
│   │   ├── ShopManager.js       (Phase 5)
│   │   └── HUD.js               (Phase 5)
│   └── visuals/          # Sprite rendering helpers
│       ├── HunterMeshes.js      (Phase 3) — builds PlaneGeometry sprites per hunter
│       └── SpriteAnimator.js    (Phase 3) — drives UV frame stepping on sprite atlas
├── assets/
│   ├── sprites/          # Sprite atlases (PNG + JSON) for hunters and enemies
│   ├── audio/            # MP3 SFX and music (Phase 6)
│   ├── textures/         # Baked AO maps, parallax background layers
│   └── logo-huntix.png   # Huntix logo
├── docs/                 # All design documentation
└── .agents/              # AI coding agent context
```

> `assets/sprites/` stores all sprite atlases. There is no `assets/models/` directory — do not create one.

---

## Performance Targets

| Target | Value |
|---|---|
| Frame rate | 60fps on Intel Iris / integrated GPU |
| Max enemies | 20 simultaneous (instanced sprite meshes) |
| Max particles | 500 per frame (pooled, reused) |
| Draw calls | <50 per frame |
| Initial load | <3s on 10Mbps connection |
| No loading screen | Game loop starts on first frame |

---

## Rendering Rules

- **Characters are 2D billboard sprites** — `PlaneGeometry` + `MeshBasicMaterial` + sprite atlas. See `docs/RENDERING.md`.
- **No dynamic shadows** — baked AO only on world geometry; drop shadow is a simple dark ellipse quad under each sprite
- **Y-sort every frame:** `mesh.position.z = -worldY * 0.01`
- **Instanced sprites** for grunts (up to 20 per `InstancedMesh`)
- **No LOD for characters** — sprites already minimal; LOD only applies to heavy world geometry if needed
- **Particle pool:** pre-allocate 500 `Points` objects or sprite quads, reuse — never `new` in game loop
- **No `eval()`**, no runtime `import()`

---

## Input System

All input routed through `InputManager.js`. Never read raw keys directly.

```js
// Correct
if (input.justPressed('LIGHT')) { ... }

// Wrong — never do this
if (keys['j']) { ... }
```

**Input buffer:** 3 actions queued, 10-15 frame window for cancels.

**Gamepad:** Gamepad API polled each frame (not event-based). Supports Xbox/PS layout.

---

## Code Conventions

- One class per file
- `src/engine/` — core systems only (renderer, loop, input, scene)
- `src/gameplay/` — all game logic
- `src/visuals/` — sprite mesh builders and animation helpers
- Use `dt` (delta time in seconds) for all movement and timers — always exactly `0.01667s` (fixed timestep)
- State machines use string constants: `const STATES = { IDLE: 'IDLE', ... }`
- No `console.log` in shipped code except behind `if (DEBUG)` flag
- Comment every public method with a one-line JSDoc
- No TypeScript — plain ES modules only

---

## Audio (Phase 6)

```html
<!-- Howler.js via CDN -->
<script src="https://cdn.jsdelivr.net/npm/howler@2.2.4/dist/howler.min.js"></script>
```

- All audio gated behind user interaction (browser autoplay policy)
- Preload SFX as short MP3s in `assets/audio/`
- Music: loop via Howler `sprite` or separate `<audio>` element
- Hitstop: lower music volume 30% for 80ms on heavy hit
- Volume controls in pause menu: master / music / SFX

See [AUDIO.md](./AUDIO.md) for full SFX and music list.

---

## Deployment

- Single domain or subdomain (e.g. `huntix.yourdomain.com`)
- Static file hosting — GitHub Pages, Netlify, Fly.io, or Vercel
- No server-side code required
- No login, no signup, no loading screens
- Widget must be in `index.html` at all times:

```html
<script async src="https://vibej.am/2026/widget.js"></script>
```

**Deadline:** 1 May 2026 @ 13:37 UTC

---

## Do Not

- Do not add npm, Vite, Webpack, or any bundler
- Do not switch to a perspective camera
- Do not add loading screens or splash delays
- Do not use dynamic `import()` at runtime
- Do not commit large binaries to repo root — use `assets/`
- Do not upgrade Three.js mid-jam
- Do not remove the Vibe Jam widget
- **Do not load GLTF or GLB files** — there are no 3D character models
- **Do not use `THREE.AnimationMixer`** — animation is frame-based sprite stepping
- **Do not create `assets/models/`** — sprites live in `assets/sprites/`
