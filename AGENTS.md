# HUNTIX — Agent Context

Read this file before touching any code. It tells you exactly what this project is, where everything lives, and what to build next.

---

## What This Is

Huntix is a 2.5D browser action brawler built in Three.js for Vibe Jam 2026.

- Genre: beat 'em up / roguelite brawler
- Perspective: 2.5D side-scroll with orthographic camera and Y-sort depth
- Players: 1-4 local co-op (shared screen, keyboard + gamepad)
- Engine: Three.js r169 via CDN importmap — no build step, no bundler
- Target: instant browser load, 60fps on a mid-spec laptop, no login required
- Deadline: 1 May 2026 @ 13:37 UTC (Vibe Jam 2026)

---

## Vibe Jam Rules (Non-Negotiable)

- Widget script must stay in index.html at all times:
  `<script async src="https://vibej.am/2026/widget.js"></script>`
- No loading screens — game must be playable within seconds
- Free-to-play, no login
- Game must run on a single domain
- New game created during the jam (April 2026 onwards)

---

## Current Phase: Phase 1 — Core Engine (Days 1-3)

**Focus: game mechanics only. No character models or art yet.**

Milestone: solo hunter moves and attacks feel good with placeholder geometry.

What is already built:
- `src/engine/GameLoop.js` — fixed-timestep RAF loop with FPS tracking
- `src/engine/Renderer.js` — orthographic Three.js renderer
- `src/engine/SceneManager.js` — 2.5D scene, Y-sort, placeholder player box, movement
- `src/engine/InputManager.js` — keyboard + gamepad, all combat actions mapped
- `src/main.js` — bootstrap wiring all engine modules together
- `index.html` — canvas, widget, Three.js importmap, debug panel

What needs to be built next (in order):
1. `src/gameplay/PlayerState.js` — FSM: IDLE, MOVE, ATTACK_LIGHT, ATTACK_HEAVY, DODGE, HURT, DEAD
2. `src/gameplay/CombatController.js` — reads input actions, drives state transitions, hitstop, dodge i-frames, mana
3. `src/gameplay/Hitbox.js` — AABB hit detection, damage, knockback vectors
4. `src/gameplay/ManaBar.js` — mana/surge resource tracking, regen, cost
5. `src/gameplay/EnemyAI.js` — basic grunt: patrol, aggro range, attack
6. `src/gameplay/EnemySpawner.js` — wave spawning, co-op HP scaling

Do not add character models, textures, or art assets until Phase 3.
Do not add audio until Phase 6.
Do not add zone transitions until Phase 4.

---

## Development Phases

| Phase | Days | Focus | Milestone |
|-------|------|-------|-----------|
| 1 | 1-3 | Core engine, player controller, combat input, widget | Solo hunter moves and attacks |
| 2 | 4-6 | Enemy AI, hit detection, status effects, juice (hitstop, shake, sparks) | Fight grunt waves |
| 3 | 7-9 | 4 hunters with models, local 1-4P input, AI companion fill, camera | 4P hub and combat |
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
| `docs/HUNTERS.md` | All 4 hunters: Dabik, Benzu, Sereisa, Vesol — lore, stats, spells, upgrade paths |
| `docs/BOSSES.md` | 4 boss designs with phases, attacks, telegraphs, co-op scaling, perf specs |
| `docs/ENEMIES.md` | 3 enemy types + miniboss: FSM states, HP, AI notes, wave compositions per zone |
| `docs/ZONES.md` | All 4 zones + hub: layout, parallax layers, dimensions, transition flow |
| `docs/INPUT.md` | Full control scheme: P1 keyboard (J/K/Shift/E) + gamepad, P2-4 Phase 3 plan |
| `docs/COOP.md` | Co-op rules: shared camera, HP scaling, AI fill, player colors, synergies |
| `docs/WEAPONS.md` | 17 weapons with costs, stats, best hunter, shop economy |
| `docs/HUD.md` | HUD layout: bar positions, combo counter, damage numbers, boss health bar |
| `docs/AUDIO.md` | Full SFX list per action, hunter sounds, boss stings, music by zone |
| `docs/ANIMATIONS.md` | Animation states, frame budgets, placeholder behaviour, state machine spec |
| `docs/VISUAL-DESIGN.md` | World tone, art direction, character philosophy, color system, visual style |
| `docs/CUSTOMIZATION.md` | Customization system: color slots, outfit variants, co-op readability rules |
| `docs/TECHSTACK.md` | Tech stack: Three.js version, importmap, project structure, perf rules, deploy |
| `docs/PORTAL-WEBRING.md` | Vibe Jam portal webring implementation with Three.js exit/start portals |

---

## Tech Rules

See `docs/TECHSTACK.md` for the full tech reference. Summary:

- Three.js r169 loaded via CDN importmap — no npm, no Vite, no bundler
- ES modules only (`type="module"` in script tags)
- Max 20 enemies on screen — use instanced meshes for grunts
- Max 500 particles — pool and reuse
- Baked AO and LOD for any environment meshes
- 60fps target on Intel Iris / integrated GPU
- No dynamic shadows in combat scenes
- Y-sort all game objects every frame: `mesh.position.z = -worldY * 0.01`
- Orthographic camera — do not switch to perspective

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
- Files live in `src/engine/` (core systems) or `src/gameplay/` (game logic)
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
