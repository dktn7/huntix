# Huntix — Codex Instructions
# Auto-loaded every Codex session alongside AGENTS.md.
# MAINTAINER NOTE: Update the "Development Phase" section below when advancing phases.

## What This Project Is
Huntix is a 2.5D browser beat 'em up / roguelite brawler built in Three.js r169 for Vibe Jam 2026.
Deadline: 1 May 2026 @ 13:37 UTC. 18-day build window. You are building this game.

## Always Read First
Before touching any code, read `AGENTS.md` at the repo root.

## Non-Negotiable Vibe Jam Rules
- Widget script MUST always be in index.html:
  `<script async src="https://vibej.am/2026/widget.js"></script>`
- No loading screens — game must be playable within seconds
- Free-to-play, no login, public URL, single domain

## Tech Stack (Do Not Change)
- Three.js r169 via CDN importmap — NO npm, NO Vite, NO bundler, NO build step
- ES modules only (`type="module"`)
- Orthographic camera only — never switch to perspective
- No dynamic `import()` at runtime
- Do not upgrade Three.js mid-jam

## Game Loop — Fixed Timestep (Critical)
- GameLoop.js uses a FIXED timestep accumulator: FIXED_DT = 1/60 = 0.01667s always
- The update callback ALWAYS receives exactly 0.01667s — never a variable RAF dt
- MAX_DT cap = 1/20 to prevent spiral of death after tab switch
- Write ALL gameplay code assuming fixed dt = 0.01667s — it never varies
- Do NOT call performance.now() or read RAF timestamps in gameplay code

## Real Input Bindings (from InputManager.js — match these exactly)
P1 Keyboard:
  Move: WASD + Arrow keys
  Light: J | Heavy: K | Dodge: Shift | Special: E | Interact: F | Pause: Escape
P1 Gamepad (index 0):
  Move: axes[0]/axes[1] deadzone 0.3
  Interact: btn 0 | Dodge: btn 1 | Light: btn 2 | Heavy: btn 3 | Special: btn 5 | Pause: btn 9
P2–P4 input: NOT YET IMPLEMENTED — build in Phase 3 only

## Performance Limits
- Max 20 enemies — THREE.InstancedMesh for grunts
- Max 500 particles — pool and reuse, never allocate in game loop
- No dynamic shadows in combat scenes
- Never new THREE.Vector3() / Matrix4 inside animation loop
- 60fps target on Intel Iris
- Total initial asset payload < 3MB

## Code Conventions
- One class per file
- src/engine/ = core | src/gameplay/ = game logic
- dt in all update(dt) calls is always 0.01667s (fixed timestep) — treat as constant
- Input via InputManager.isDown(action) only — never raw keys
- Named string constants for all FSM states — no magic strings
- No console.log except behind if (DEBUG)

## Combat Feel
- Light hitstop: 80ms | Heavy hitstop: 150ms
- Dodge: 300ms, 200ms i-frames, directional
- Every hit: sparks + screenshake + stagger + SFX
- Enemy telegraphs before every attack
- Only cancel: attack → dodge

## Hunter Quick Reference
| Hunter  | HP  | Mana | Dodge           | Status |
|---------|-----|------|-----------------|--------|
| Dabik   | 80  | 120  | Blink           | Bleed  |
| Benzu   | 160 | 70   | Shoulder Charge | Stun   |
| Sereisa | 100 | 100  | Electric Dash   | Slow   |
| Vesol   | 90  | 130  | Flame Scatter   | Burn   |

## Development Phase (Current)
# ─── UPDATE THIS BLOCK WHEN ADVANCING PHASES ───────────────────────────────
Current Phase: 1 — Core Engine (Days 1–3)
Already built: GameLoop.js | Renderer.js | SceneManager.js | InputManager.js | main.js
Next: PlayerState.js → CombatController.js → Hitbox.js → ManaBar.js → EnemyAI.js → EnemySpawner.js
Do NOT add yet: models, textures, audio, zone transitions, P2+ input
# ───────────────────────────────────────────────────────────────────────────

## Phase Gates
| Phase | Days  | Unlocks |
|-------|-------|---------|
| 1 | 1–3   | Core engine + combat input |
| 2 | 4–6   | Enemy AI + juice |
| 3 | 7–9   | Models + 4P input |
| 4 | 10–12 | Zones + bosses |
| 5 | 13–15 | Hub shop + XP |
| 6 | 16–18 | Audio + deploy |

## Available Skills (.agents/skills/)
threejs-skills | systematic-debugging | animation-fsm | game-feel-juice
multiplayer-coop | 3d-model-optimization | spatial-audio | progression-xp
minimax-shader-dev | ibelick-ui-skills | root-cause-tracing | test-driven-development
find-bugs | verification-before-completion | vercel-deploy | create-pr

## Do Not
- Add npm or build tools
- Use perspective camera
- Add loading screens
- Use eval() or runtime dynamic import()
- Commit large binaries to repo root
- Build features not in spec without flagging
- Remove Vibe Jam widget script
- Implement P2–P4 input before Phase 3
