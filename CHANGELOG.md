# HUNTIX — CHANGELOG

> Tracks all significant changes across the project. Newest first.

---

## [Unreleased]

### In Progress
- Phase 3: All 4 hunters + co-op input
- HunterController.js, SpriteAnimator.js, AnimationController.js

---

## [0.2.0] — 2026-04-16

### Added
- Full docs suite: 50 docs across all systems
- `docs/AICONTROLLER.md` — enemy & companion AI state machine
- `docs/PROJECTILES.md` — projectile pooling + collision
- `docs/STATBLOCK.md` — canonical raw stats for all entities
- `docs/PERFORMANCEBUDGET.md` — FPS targets, draw call caps
- `docs/ASSETPIPELINE.md` — sprite → atlas → Three.js workflow
- `docs/SPAWNPOINTS.md` — spawn zones, lane assignments
- `docs/ESSENCEECONOMY.md` — drop values, shop costs
- `docs/STATUSEFFECTS.md` — Bleed/Burn/Slow/Stun full spec
- `docs/UPGRADEPATH.md` — upgrade tree per path per hunter
- `docs/SHOPMANAGER.md` — shop UI, item weighting, path-lock rules
- `docs/PORTAL.md` — portal transition animation spec
- `docs/LORE.md` — hunter backstories, world lore
- README docs table reorganised into 10 categories
- AGENTS.md source hierarchy expanded to 12 priority levels
- AGENTS.md gap tracker added
- Rendering model clarified: 2D sprites in 3D world (not 3D models)

### Fixed
- README and GDD references to "3D models" corrected to "2D sprites"

---

## [0.1.0] — 2026-04-15

### Added
- Phase 1 complete: Three.js 2.5D engine setup
- Fixed orthographic camera (Z=100)
- Fixed timestep game loop (dt = 0.01667s)
- InputManager.js — keyboard + gamepad routing
- PlayerState.js — movement on X/Y plane
- PlaneGeometry sprite renderer
- Basic HUD scaffold
- Phase 2 complete: Enemy AI & combat basics
- EnemyAI.js — Idle → Aggro → Telegraph → Action → Recover FSM
- EnemySpawner.js — wave-based spawning
- Hitbox.js — AABB collision
- Hitstop: 40ms light / 80ms heavy
- Screen shake system
- Combo counter scaffold
- Initial docs suite: GDD, TECHSTACK, HUNTERS, ENEMIES, ZONES, BOSSES
- All 4 hunter character sheets (VESOL, DABIK, BENZU, SEREISA)
- All 4 boss specs (VRAEL, ZARTH, KIBAD, THYXIS)
- All 4 zone docs (CITY-BREACH, RUIN-DEN, SHADOW-CORE, THUNDER-SPIRE)
- AGENTS.md — AI agent instructions
- Vibe Jam 2026 widget integrated in index.html

---

## Format

Follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versions: `[MAJOR.MINOR.PATCH]` — bump MINOR on each phase complete, PATCH on hotfixes.
