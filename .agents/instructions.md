# Huntix — Codex Instructions
# Auto-loaded every Codex session alongside AGENTS.md.

## What This Project Is
Huntix is a 2.5D browser beat 'em up / roguelite brawler built in Three.js r169 for Vibe Jam 2026.
Deadline: 1 May 2026 @ 13:37 UTC. 18-day build window. You are building this game.

## Always Read First
Before touching any code, read `AGENTS.md` at the repo root. It contains:
- Full phase plan and what to build next
- All design doc locations in `docs/`
- Hunter stats, combat feel rules, code conventions

## Non-Negotiable Vibe Jam Rules
- Widget script MUST always be in index.html:
  `<script async src="https://vibej.am/2026/widget.js"></script>`
- No loading screens — game must be playable within seconds
- Free-to-play, no login, public URL, single domain
- New game only — created April 2026 onwards

## Tech Stack (Do Not Change)
- Three.js r169 via CDN importmap — NO npm, NO Vite, NO bundler, NO build step
- ES modules only (`type="module"`)
- Orthographic camera only — never switch to perspective
- No dynamic `import()` at runtime
- Do not upgrade Three.js mid-jam

## Performance Limits
- Max 20 enemies on screen — use THREE.InstancedMesh for grunts
- Max 500 particles — pool and reuse, never allocate in game loop
- No dynamic shadows in combat scenes
- Never `new THREE.Vector3()` inside the animation loop
- Target 60fps on Intel Iris / integrated GPU
- Total initial asset payload < 3MB
- All assets preloaded before first frame — no runtime fetches mid-game

## Code Conventions
- One class per file
- `src/engine/` = core systems | `src/gameplay/` = game logic
- All movement uses `dt` (delta time in seconds) — never frame-count timers
- All input via InputManager.isDown(action, playerIndex) only — never read raw keys
- State machines use named string constants — no magic strings inline
- No `console.log` in shipped code except behind `if (DEBUG)` flag
- Comment every public method with a one-line description

## Combat Feel (Exact Values)
- Light attack hitstop: freeze dt for 80ms
- Heavy attack hitstop: freeze dt for 150ms
- Dodge: 300ms total, 200ms i-frames, directional from moveVector
- Every hit must produce: sparks + screenshake + stagger + SFX
- Enemy must show telegraph before every attack
- Only valid cancel: any attack → dodge

## Hunter Quick Reference
| Hunter  | Element       | HP  | Mana | Dodge           | Status |
|---------|---------------|-----|------|-----------------|--------|
| Dabik   | Shadow        | 80  | 120  | Blink           | Bleed  |
| Benzu   | Thunder/Earth | 160 | 70   | Shoulder Charge | Stun   |
| Sereisa | Lightning     | 100 | 100  | Electric Dash   | Slow   |
| Vesol   | Flame         | 90  | 130  | Flame Scatter   | Burn   |

## Available Skills
Skills live in `.agents/skills/` — reference them when relevant:
- `threejs-skills` — core engine, always relevant
- `systematic-debugging` — always load alongside threejs
- `game-feel-juice` — Phase 2 combat feedback systems
- `multiplayer-coop` — Phase 3 1-4P systems
- `3d-model-optimization` — Phase 3+ asset pipeline
- `spatial-audio` — Phase 6 audio systems
- `progression-xp` — Phase 5 hub shop and leveling
- `minimax-shader-dev` — elemental VFX shaders
- `ui-skills` — HUD and overlay components
- `root-cause-tracing` — when bugs keep reappearing
- `test-driven-development` — for pure logic systems
- `find-bugs` — pre-merge code review
- `verification-before-completion` — before marking any task done
- `vercel-deploy` — production deployment
- `create-pr` — pull request workflow

## Current Phase
Phase 1 — Core Engine (Days 1–3)
Next: PlayerState.js → CombatController.js → Hitbox.js → ManaBar.js → EnemyAI.js → EnemySpawner.js
Do NOT add: models, textures, audio, zone transitions yet.

## Do Not
- Add npm packages or build tools
- Use perspective camera
- Add loading screens or splash delays
- Use eval() or runtime dynamic import()
- Commit large binaries to repo root — use assets/
- Build features not in spec without flagging
- Remove or modify the Vibe Jam widget script
- Skip reading AGENTS.md before coding
