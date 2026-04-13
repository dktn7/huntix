# Huntix Tech Stack

Complete technical reference for every layer of the project. Read before writing any code.

---

## Core Stack

| Layer | Choice | Reason |
|---|---|---|
| Renderer | Three.js r169 | 2.5D orthographic, 3D models, CDN — no build step |
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
- `three/addons/loaders/GLTFLoader.js` — 3D model loading (Phase 3)
- `three/addons/controls/OrbitControls.js` — debug only, never shipped

---

## Camera

```js
const frustumSize = 20;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
  -frustumSize * aspect / 2,
   frustumSize * aspect / 2,
   frustumSize / 2,
  -frustumSize / 2,
  0.1, 100
);
camera.position.set(0, 0, 10);
```

- Fixed orthographic — never switch to perspective
- Tracks player group centroid
- Zoom out smoothly when players spread apart (lerp frustumSize)
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
│   └── gameplay/         # Game logic (combat, AI, spawner, state)
│       ├── PlayerState.js       (Phase 1)
│       ├── CombatController.js  (Phase 1)
│       ├── Hitbox.js            (Phase 1)
│       ├── ManaBar.js           (Phase 1)
│       ├── EnemyAI.js           (Phase 2)
│       ├── EnemySpawner.js      (Phase 2)
│       ├── AnimationController.js (Phase 3)
│       ├── HunterController.js  (Phase 3)
│       ├── ZoneManager.js       (Phase 4)
│       ├── PortalManager.js     (Phase 4)
│       ├── ShopManager.js       (Phase 5)
│       └── HUD.js               (Phase 5)
├── assets/
│   ├── models/           # GLTF/GLB files (Phase 3+)
│   ├── audio/            # MP3 SFX and music (Phase 6)
│   ├── textures/         # Baked AO maps, parallax layers
│   └── logo-huntix.png   # Huntix logo
├── docs/                 # All design documentation
└── .agents/              # AI coding agent context
```

---

## Performance Targets

| Target | Value |
|---|---|
| Frame rate | 60fps on Intel Iris / integrated GPU |
| Max enemies | 20 simultaneous (instanced meshes) |
| Max particles | 500 per frame (pooled, reused) |
| Draw calls | <50 per frame |
| Initial load | <3s on 10Mbps connection |
| No loading screen | Game loop starts on first frame |

---

## Rendering Rules

- **No dynamic shadows** — baked AO only (post-MVP)
- **Y-sort every frame:** `mesh.renderOrder = mesh.position.y * -1` or `mesh.position.z = -worldY * 0.01`
- **Instanced meshes** for grunts (up to 10 per draw call)
- **LOD** on bosses: switch to low-poly mesh at >10 world units from camera
- **Particle pool:** pre-allocate 500 `Points` objects, reuse — never `new` in game loop
- **No `eval()`**, no runtime `import()`

---

## Input System

All input routed through `InputManager.js`. Never read raw keys directly.

```js
// Correct
if (input.justPressed('LIGHT_ATTACK')) { ... }

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
- Use `dt` (delta time in seconds) for all movement and timers
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
