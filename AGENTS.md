# HUNTIX — Agent Context

---

## ⚡ STEP ZERO — DETECT CURRENT PHASE BEFORE ANYTHING ELSE

**Before writing a single line of code, you MUST determine the current development phase by scanning the actual files in `src/`.** Do not trust any hardcoded phase label. The codebase is the source of truth.

### How to detect the phase:

Check which files exist across the phase checklists below. The current phase is the **lowest-numbered phase that still has missing files**. Everything above that phase is off-limits.

You can also run this to get an instant answer:
```bash
node scripts/check-phase.js
```

### Phase Completion Checklists

**Phase 1 — Core Engine** ✅ complete when ALL exist:
- `src/engine/GameLoop.js`
- `src/engine/Renderer.js`
- `src/engine/SceneManager.js`
- `src/engine/InputManager.js`
- `src/main.js`
- `src/gameplay/PlayerState.js`
- `src/gameplay/CombatController.js`
- `src/gameplay/Hitbox.js`
- `src/gameplay/ManaBar.js`

**Phase 2 — Enemy AI & Juice** ✅ complete when ALL exist:
- `src/gameplay/EnemyAI.js`
- `src/gameplay/EnemySpawner.js`
- `src/gameplay/StatusEffects.js`
- `src/gameplay/SparkPool.js`
- `src/engine/CameraShake.js`

**Phase 3 — 4 Hunters & Co-op** ✅ complete when ALL exist:
- `src/gameplay/HunterController.js`
- `src/gameplay/CoopManager.js`
- `src/gameplay/AICompanion.js`
- `src/gameplay/HunterDabik.js`
- `src/gameplay/HunterBenzu.js`
- `src/gameplay/HunterSereisa.js`
- `src/gameplay/HunterVesol.js`
- `src/gameplay/AnimationController.js`
- `src/visuals/HunterMeshes.js`
- `src/visuals/SpriteAnimator.js`

**Phase 4 — Zones & Bosses** ✅ complete when ALL exist:
- `src/gameplay/ZoneManager.js`
- `src/gameplay/PortalTransition.js`
- `src/gameplay/BossController.js`
- `src/gameplay/EssenceDrop.js`
- `src/visuals/CityBreachArena.js`

**Phase 5 — Hub, Shop & HUD** ✅ complete when ALL exist:
- `src/gameplay/HubScene.js`
- `src/gameplay/ShopManager.js`
- `src/gameplay/LevelingSystem.js`
- `src/gameplay/ComboUI.js`
- `src/gameplay/GameplayHUD.js`

**Phase 6 — Audio, Polish & Deploy** ✅ complete when ALL exist:
- `src/engine/AudioManager.js`
- `src/gameplay/OnboardingFlow.js`
- `src/gameplay/PerfMonitor.js`

### Blocked features per phase

| Feature | Blocked until |
|---------|---------------|
| Sprite atlas integration / real hunter art | Phase 3 |
| P2–P4 input / co-op wiring | Phase 3 |
| Zone transitions / boss phases | Phase 4 |
| HUD / shop UI / combo counter | Phase 5 |
| Audio (SFX, music) | Phase 6 |

---

## What This Is

Huntix is a 2.5D browser action brawler built in Three.js for Vibe Jam 2026.

- Genre: beat ’em up / roguelite brawler
- Perspective: 2.5D side-scroll with orthographic camera and Y-sort depth
- Players: 1-4 local co-op (shared screen, keyboard + gamepad)
- Engine: Three.js r169 via CDN importmap — no build step, no bundler
- Target: instant browser load, 60fps on a mid-spec laptop, no login required
- Deadline: 1 May 2026 @ 13:37 UTC (Vibe Jam 2026)

---

## Rendering Model (Critical — Read Before Any Visual Work)

Huntix uses **2D billboard sprites in a 3D world**. This is non-negotiable.

- **Characters and enemies** = 2D sprite sheets on `PlaneGeometry` with `MeshBasicMaterial` + texture atlas. Always face the camera. Never 3D meshes.
- **World geometry** = 3D `BoxGeometry` / custom mesh for floors, walls, platforms. `MeshStandardMaterial` with baked AO.
- **Parallax backgrounds** = `PlaneGeometry` quads at fixed Z offsets behind the play field.
- **Animation** = frame-based UV stepping through the sprite atlas — NOT `THREE.AnimationMixer`, NOT GLTF clips.
- **No `GLTFLoader`** — not imported anywhere in this project.
- **No `assets/models/`** — sprites live in `assets/sprites/`.
- **Y-sort every frame:** `mesh.position.z = -worldY * 0.01`

Full spec: **`docs/RENDERING.md`** — read before touching any visual system.

---

## Vibe Jam Rules (Non-Negotiable)

- Widget script must stay in index.html at all times:
  `<script async src="https://vibej.am/2026/widget.js"></script>`
- No loading screens — game must be playable within seconds
- Free-to-play, no login
- Game must run on a single domain
- New game created during the jam (April 2026 onwards)

---

## Development Phases

| Phase | Days | Focus | Milestone |
|-------|------|-------|-----------|
| 1 | 1-3 | Core engine, player controller, combat input, widget | Solo hunter moves and attacks |
| 2 | 4-6 | Enemy AI, hit detection, status effects, juice (hitstop, shake, sparks) | Fight grunt waves |
| 3 | 7-9 | Sprite atlas integration, 4 hunters, local 1-4P input, AI companion, camera | 4P hub and combat |
| 4 | 10-12 | 4 zones, portal transitions, miniboss + boss phases, essence drops | Full run clear |
| 5 | 13-15 | Hub shop, cosmetics, leveling, XP, HUD, combo UI | Buy and upgrade loop |
| 6 | 16-18 | Audio SFX, onboarding, perf tweaks, deploy | Playable jam submission |

---

## Project Spec Files

All design documentation lives in `docs/`. Read the relevant doc before implementing any system.

| File | What It Covers |
|------|----------------|
| `docs/GDD.md` | Full game design document: mechanics, combat, zones, progression, all systems |
| `docs/MVP-PLAN.md` | 18-day phased development roadmap with milestones and risk mitigations |
| `docs/RENDERING.md` | **Rendering model — 2D billboard sprites in 3D world. Read before any visual work.** |
| `docs/TECHSTACK.md` | Tech stack: Three.js version, importmap, project structure, perf rules, deploy |
| `docs/HUNTERS.md` | All 4 hunters: Dabik, Benzu, Sereisa, Vesol — lore, stats, spells, upgrade paths |
| `docs/BOSSES.md` | 4 boss designs with phases, attacks, telegraphs, co-op scaling, perf specs |
| `docs/ENEMIES.md` | 3 enemy types + miniboss: FSM states, HP, AI notes, wave compositions per zone |
| `docs/ZONES.md` | All 4 zones + hub: layout, parallax layers, dimensions, transition flow |
| `docs/INPUT.md` | Full control scheme: P1 keyboard (J/K/Shift/E) + gamepad, P2-4 Phase 3 plan |
| `docs/COOP.md` | Co-op rules: shared camera, HP scaling, AI fill, player colours, synergies |
| `docs/WEAPONS.md` | 17 weapons with costs, stats, best hunter, shop economy |
| `docs/HUD.md` | HUD layout: bar positions, combo counter, damage numbers, boss health bar |
| `docs/AUDIO.md` | Full SFX list per action, hunter sounds, boss stings, music by zone |
| `docs/ANIMATIONS.md` | Animation states, frame budgets, placeholder behaviour, sprite state machine spec |
| `docs/VISUAL-DESIGN.md` | World tone, art direction, character philosophy, colour system, Mixboard/Grok prompts |
| `docs/VISUAL-REFERENCE.md` | Canonical design lock — read before any asset generation |
| `docs/CUSTOMIZATION.md` | Customisation system: colour slots, outfit variants, co-op readability rules |
| `docs/PORTAL-WEBRING.md` | Vibe Jam portal webring implementation with Three.js exit/start portals |
| `docs/ATTACKSYSTEM.md` | Full attack system: combo chains, hitstop, active frames, cancel windows |
| `docs/COMBOSYSTEM.md` | Combo counter: scoring, multipliers, decay, UI display |
| `docs/SPELLS.md` | All spells per hunter: minor, advanced, ultimate — costs, effects, hitboxes |
| `docs/MOVEMENT.md` | Movement system: speed values, acceleration, sprint, wall bounds per zone |
| `docs/HITBOX.md` | Hitbox spec: box dimensions per attack, active frames, hurtbox rules |
| `docs/COLLISIONLAYERS.md` | Collision layers: what hits what, player vs enemy vs world vs projectile |
| `docs/DEBUFFS.md` | Debuff system: Bleed, Stun, Slow, Burn — stacks, durations, synergies |
| `docs/PARTICLES.md` | Particle system: pool rules, effect types, per-action specs, perf caps |
| `docs/AURASYSTEM.md` | Aura rendering: per-hunter aura colours, states, intensity levels |
| `docs/CAMERA.md` | Camera system: ortho values, co-op zoom, shake, follow rules |
| `docs/GAMELOOP.md` | Game loop: fixed timestep, accumulator, dt rules |
| `docs/SCENEMANAGER.md` | Scene manager: scene stack, transition flow, scene lifecycle |
| `docs/RUNSTATE.md` | Run state: global run data, persistence across zones, death/restart |
| `docs/WAVEMANAGER.md` | Wave manager: spawn waves, enemy composition, clear conditions |
| `docs/MINIBOSS.md` | Miniboss designs: Fire Bruiser and others — phases, attacks, telegraphs |
| `docs/PROGRESSION.md` | Leveling, XP, upgrade paths, stat scaling per hunter |
| `docs/HUB.md` | Hub scene: layout, NPC positions, shop flow, portal placement |
| `docs/DEATH.md` | Death and respawn: solo death, co-op downed state, run-end flow |
| `docs/CARDSCREEN.md` | Card upgrade screen: post-wave card draw, card types, selection UI |
| `docs/ENDSCREEN.md` | End screen: victory and defeat states, stats display, retry flow |
| `docs/TITLESCREEN.md` | Title screen: layout, menu options, first-run flow |
| `docs/PAUSEMENU.md` | Pause menu: options, audio controls, quit flow |
| `docs/GAMELOOP.md` | Fixed timestep detail and accumulator reference |

---

## Tech Rules

See `docs/TECHSTACK.md` for the full tech reference. Summary:

- Three.js r169 loaded via CDN importmap — no npm, no Vite, no bundler
- ES modules only (`type="module"` in script tags)
- **Characters = 2D billboard sprites** on `PlaneGeometry` — see `docs/RENDERING.md`
- Max 20 enemies on screen — use `InstancedMesh` for grunt sprites
- Max 500 particles — pool and reuse
- No `GLTFLoader`, no `AnimationMixer`, no GLTF/GLB files
- 60fps target on Intel Iris / integrated GPU
- No dynamic shadows in combat scenes
- Y-sort all game objects every frame: `mesh.position.z = -worldY * 0.01`
- Orthographic camera — do not switch to perspective
- Camera: `ORTHO_HEIGHT = 10`, `ORTHO_WIDTH ≈ 17.78`, positioned at `(0, 0, 100)`

---

## Game Loop — Fixed Timestep (Critical)

`GameLoop.js` uses a fixed-timestep accumulator. The `dt` passed to every `update()` call is **always exactly `1/60 = 0.01667s`** — it never varies.

- Do NOT treat `dt` as a variable that changes frame to frame
- Do NOT call `performance.now()` or measure elapsed time in gameplay code
- The `MAX_DT` cap of `1/20` prevents spiral-of-death after tab switches
- All gameplay physics, timers, and animations are fully deterministic as a result

```js
// GameLoop.js — for reference only, already implemented
const FIXED_DT = 1 / 60;  // 0.01667s — always
const MAX_DT   = 1 / 20;  // 50ms cap
this._accum += Math.min(rawDt, MAX_DT);
while (this._accum >= FIXED_DT) {
  this._callback(FIXED_DT); // your update() always receives 0.01667
  this._accum -= FIXED_DT;
}
```

---

## Code Conventions

- One class per file
- Files live in `src/engine/` (core systems), `src/gameplay/` (game logic), or `src/visuals/` (sprite mesh builders)
- `dt` in all `update(dt)` calls is always `0.01667s` (fixed timestep) — use it for all movement and timers
- All input goes through `InputManager.isDown(action)` or `justPressed(action)` — never read raw keys directly
- State machines use string constants, not magic strings inline
- No `console.log` in shipped code except behind `debug` flag
- Comment every public method with a one-line description

---

## Hunter Summary

| Hunter | Element | Weapon | Dodge | Status |
|--------|---------|--------|-------|--------|
| Dabik | Shadow | Twin daggers | Blink (teleports behind nearest enemy) | Bleed |
| Benzu | Thunder/Earth | Gauntlets | Shoulder Charge (staggers enemies hit) | Stun |
| Sereisa | Lightning | Electro-blades | Electric Dash (applies slow on contact) | Slow |
| Vesol | Flame | Wrist focus | Flame Scatter (pushes enemies back) | Burn |

Status synergies: Bleed+Slow = setup/punish, Stun+Wall = trap, Slow+Blink = opening window, Burn+Slam = AoE control.

---

## Resource System Per Hunter

- **Health** — survival (varies per hunter: Dabik 80, Benzu 160, Sereisa 100, Vesol 90)
- **Mana** — powers specials (Dabik 120, Benzu 70, Sereisa 100, Vesol 130)
- **Surge** — unlocks ultimate (fills from kills/hits/streaks, drains on use)
- **Stamina** — limits dodge and sprint (restores on hit, warns UI when low)

---

## Combat Feel Rules

- Light attack hitstop: freeze dt for 80ms
- Heavy attack hitstop: freeze dt for 150ms
- Dodge: 300ms duration, invincibility frames for 200ms, directional from moveVector
- Every hit must produce: spark particles, screen nudge, stagger on enemy
- Enemies must have visible attack telegraphs before every hit
- No attack cancels except dodge cancel (can cancel any attack into dodge)

---

## Do Not

- Do not add any NPM packages or build tools
- Do not switch to a perspective camera
- Do not add loading screens or splash delays
- Do not use `eval()` or dynamic `import()` at runtime
- Do not commit large image or audio binaries to the repo root — use `assets/`
- Do not create gameplay features that are not in the spec without flagging it first
- Do not skip the widget script
- Do not upgrade Three.js mid-jam
- Do not implement P2–P4 input before Phase 3
- Do not build HUD or shop UI before Phase 5
- **Do not load GLTF or GLB files** — there are no 3D character models in this project
- **Do not use `THREE.AnimationMixer`** — animation is sprite frame stepping via `SpriteAnimator.js`
- **Do not create `assets/models/`** — all sprites live in `assets/sprites/`
- **Do not build 3D character meshes** — hunters and enemies are always 2D billboard sprites
