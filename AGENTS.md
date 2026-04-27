# HUNTIX — AGENTS.md

> **This is the first file you read. Every session. No exceptions.**

*Last updated April 18, 2026*

---

## What Is Huntix

Huntix is a 2.5D local co-op brawler built in Three.js for Vibe Jam 2026. 1–4 players pick from 4 hunters and fight through 4 zones of enemy waves, ending each zone with a boss. Between zones players visit the Hunter Hub to shop and upgrade. A full run takes 10–20 minutes.

**Core aesthetic:** Castle Crashers × Hades × Hunter × Hunter. High-energy, highly readable, stylised low-poly **2D sprites** in a **3D parallax world**.

---

## Rendering Model — Read This Before Touching Any Visual Code

> Characters, enemies, and bosses are **2D billboard sprites** rendered on `PlaneGeometry` quads inside a 3D Three.js scene. There are NO 3D character models, NO GLTF files, NO `AnimationMixer`.

- World geometry (floors, walls, parallax layers) is **3D**
- Characters/enemies/bosses are **2D sprites**: `PlaneGeometry` + `MeshBasicMaterial` + sprite atlas
- Animation = UV frame stepping via `SpriteAnimator.js`
- Camera = fixed `OrthographicCamera` at Z=100 looking at origin
- See `docs/RENDERING.md` and `docs/SPRITES.md` for the full spec

**Do not:**
- Create `assets/models/`
- Import `GLTFLoader`
- Use `THREE.AnimationMixer`
- Switch to a perspective camera

---

## Source of Truth Hierarchy

When two docs conflict, the lower number wins.

| Priority | File | Covers |
|----------|------|--------|
| 1 | `docs/TECHSTACK.md` | All technical decisions, rendering model, code conventions |
| 2 | `docs/RENDERING.md` | Sprite rendering spec — 2D billboards in 3D world |
| 3 | `docs/SPRITES.md` | Sprite atlas format, UV stepping, adding new characters |
| 4 | `docs/STATBLOCK.md` | **Canonical raw numbers** for all entities — hunters, enemies, bosses |
| 5 | `docs/HUNTERS.md` | Canonical character stats, spells, appearance |
| 6 | `docs/GDD.md` | Master gameplay document |
| 7 | `docs/PROGRESSION.md` | Level table (10 levels), shop rules |
| 8 | `docs/ENEMIES.md` | Enemy stats, XP, essence drops |
| 9 | `docs/STATUSEFFECTS.md` | Status tick rates, duration, stack rules |
| 10 | `docs/AICONTROLLER.md` | AI state machine — enemies and companions |
| 11 | `docs/ESSENCEECONOMY.md` | Drop values, shop costs, balance levers |
| 12 | All other `docs/*.md` | System-specific detail |

> If `docs/BOSSES.md` contradicts `docs/ENEMIES.md` on XP/essence values — **ENEMIES.md wins**. Boss XP = 500. Boss essence = 200.

---

## Finish Line Plan

Run `node scripts/check-phase.js` if you need inventory context, but the planning model is now time-based, not phase-based.

We have 3 days left. The goal is to ship a complete, readable, stable game, not to finish the roadmap in order.

### What Matters Now

- Finish enemy and boss art integration using existing assets wherever possible.
- Treat KIBAD as the explicit exception. If his final art is not ready, keep the special-case treatment and do not block the rest of the game on it.
- Increase wave pressure where needed so the run still feels full.
- Polish the player-facing flow: onboarding, HUD clarity, results screens, boss readability, and audio timing.
- Finish the deploy pass: performance caps, jam compliance, and any bug fixes that improve the shipped build.

### Shipping Priority

| Priority | Focus | Done when |
|----------|-------|-----------|
| 1 | Enemy and boss assets | Grunts, ranged, bruisers, and bosses are using real assets in-engine; KIBAD remains the controlled exception if needed. |
| 2 | Run completeness | All 4 zones have enough wave content and boss flow to feel like a finished run. |
| 3 | Readability and pacing | Combat, HUD, telegraphs, and wave spacing are easy to read at full speed. |
| 4 | Audio and UI polish | Core SFX, music transitions, onboarding, and results flow feel intentional. |
| 5 | Performance and deploy | The game holds its frame budget, stays within the jam rules, and is ready to submit. |

Do not spend time on new systems unless they directly improve the finish line.

---

## Asset Workflow

All character, enemy, boss, and background art follows this pipeline:

1. **Mixboard (GPT Image 1.5)** — Generate full-body reference/design sheet from text prompt
2. **Google Flow (Nano Banana 2)** — Upload Mixboard output as reference image. Generate animation frames and 4-direction sprite sheet
3. **Background removal** — remove.bg or Photoshop. Export PNG with alpha at correct frame size
4. **TexturePacker** — Pack frames into atlas (MaxRects, 2048×2048, JSON Array + WebP)
5. **Load in Three.js** — via `HunterMeshes.js` / `SpriteAnimator.js` UV stepping

> Enemy art now uses existing assets wherever possible. KIBAD is the deliberate exception and may stay custom or placeholder until the final pass.

> Prompts for all 4 hunters are in `docs/VISUAL-DESIGN.md` sections 15 (Mixboard) and 16 (Google Flow).
> The section 16 heading says "Grok" — treat these as **Google Flow prompts**. Same content, different tool.
> Full pipeline spec: `docs/ASSETPIPELINE.md`

### Asset Status Tracker

| Asset | Design Sheet | Animation Frames | Atlas (TexturePacker) | In Engine |
|-------|-------------|------------------|-----------------------|-----------|
| **Dabik** | 🔲 | 🔲 | 🔲 | 🔲 |
| **Benzu** | 🔲 | 🔲 | 🔲 | 🔲 |
| **Sereisa** | 🔲 | 🔲 | 🔲 | 🔲 |
| **Vesol** | 🔲 | 🔲 | 🔲 | 🔲 |
| **Grunt** | 🔲 | 🔲 | 🔲 | 🔲 |
| **Ranged Unit** | 🔲 | 🔲 | 🔲 | 🔲 |
| **Bruiser** | 🔲 | 🔲 | 🔲 | 🔲 |
| **VRAEL** | 🔲 | 🔲 | 🔲 | 🔲 |
| **ZARTH** | 🔲 | 🔲 | 🔲 | 🔲 |
| **KIBAD** | 🔲 | 🔲 | 🔲 | 🔲 |
| **THYXIS** | 🔲 | 🔲 | 🔲 | 🔲 |
| **FX Atlas** | — | 🔲 | 🔲 | 🔲 |
| **Hub BG (3 layers)** | — | — | 🔲 | 🔲 |
| **City Breach BG (3 layers)** | — | — | 🔲 | 🔲 |
| **Ruin Den BG (3 layers)** | — | — | 🔲 | 🔲 |
| **Shadow Core BG (3 layers)** | — | — | 🔲 | 🔲 |
| **Thunder Spire BG (3 layers)** | — | — | 🔲 | 🔲 |

Update this table as assets are completed. ✅ when done, 🔄 when in progress.

---

## Hard Rules (Non-Negotiable)

- Widget MUST stay in `index.html`: `<script async src="https://vibej.am/2026/widget.js"></script>`
- No npm, no Vite, no bundler — Three.js r169 via CDN importmap only
- No loading screens, no login, free-to-play, single domain
- Fixed timestep: `dt` is always `0.01667s` — never variable
- Orthographic camera only — never perspective
- Max 20 enemies simultaneous
- Max 500 particles per frame
- No `new` allocations inside the game loop — pool everything
- One class per file
- All input routed through `InputManager.js` — never read raw keys directly
- No `console.log` in shipped code except behind `if (DEBUG)`
- Do not upgrade Three.js mid-jam (locked at r169)
- Characters/enemies are **2D sprites only** — no 3D models, no GLTF, no AnimationMixer

---

## Key Number Reference (Canonical)

These values are locked. If any doc says otherwise, these win.

| Value | Number | Source |
|-------|--------|--------|
| Levels per run | 10 | `docs/PROGRESSION.md` |
| Shop items shown | 5 random | `docs/PROGRESSION.md` |
| Max shop purchases per visit | 2 | `docs/PROGRESSION.md` |
| Reroll cost | 30 Essence | `docs/PROGRESSION.md` |
| Boss XP | 500 | `docs/ENEMIES.md` / `docs/PROGRESSION.md` |
| Boss Essence | 200 | `docs/ENEMIES.md` |
| Max enemies on screen | 20 | `docs/TECHSTACK.md` |
| Max particles per frame | 500 | `docs/TECHSTACK.md` |
| Arena width | 40 world units | `docs/ZONES.md` |
| Arena height | 10 world units | `docs/ZONES.md` |
| Ortho height | 10 world units | `docs/TECHSTACK.md` |
| Hitstop (light) | 40ms | `docs/ATTACKSYSTEM.md` |
| Hitstop (heavy) | 80ms | `docs/ATTACKSYSTEM.md` |
| Fixed timestep `dt` | 0.01667s | `docs/TECHSTACK.md` |
| Stun duration | 1.2s | `docs/STATUSEFFECTS.md` |
| Bleed tick rate | 8 dmg/sec | `docs/STATUSEFFECTS.md` |
| Burn tick rate | 12 dmg/sec | `docs/STATUSEFFECTS.md` |
| Projectile pool size | 60 | `docs/PROJECTILES.md` |
| Grunt Essence drop | 5–15 | `docs/ESSENCEECONOMY.md` |
| Bruiser Essence drop | 25–40 | `docs/ESSENCEECONOMY.md` |

---

## Project Structure

```
huntix/
├── AGENTS.md             ← YOU ARE HERE
├── CHANGELOG.md          # Version history
├── PORTAL-WEBRING.md     # Vibe Jam 2026 webring portal guide (optional feature)
├── index.html            # Entry point, importmap, widget
├── scripts/
│   └── check-phase.js    # Phase detector — run before every session
├── src/
│   ├── main.js
│   ├── engine/           # Core systems — renderer, loop, input, scene
│   ├── gameplay/         # Game logic — combat, AI, spawner, state
│   └── visuals/          # Sprite mesh builders and animation helpers
├── assets/
│   ├── sprites/          # Sprite atlases WebP + JSON — NO models/ folder
│   │   ├── hunters/      # dabik-atlas.webp/.json etc.
│   │   ├── enemies/      # grunt-atlas.webp/.json etc.
│   │   ├── bosses/       # vrael-atlas.webp/.json etc.
│   │   └── particles/    # fx-atlas.webp/.json
│   ├── backgrounds/      # [zone]-bg/mid/fg.webp (2048×512px per layer)
│   ├── audio/
│   └── textures/
├── docs/                 # All design documentation
└── .agents/
    ├── instructions.md   # Codex role and task protocol
    └── skills/           # Skill files — load max 2 at a time
```

---

## Docs Quick Reference

All docs live in `docs/`. Key files by category:

| Category | Key docs |
|----------|----------|
| **Core design** | `GDD.md`, `MVP-PLAN.md`, `TECHSTACK.md`, `STATBLOCK.md` |
| **Hunters** | `HUNTERS.md`, `hunters/VESOL.md`, `hunters/DABIK.md`, `hunters/BENZU.md`, `hunters/SEREISA.md`, `SPELLS.md`, `UPGRADEPATH.md` |
| **Enemies/Bosses** | `ENEMIES.md`, `BOSSES.md`, `bosses/VRAEL.md`, `bosses/ZARTH.md`, `bosses/KIBAD.md`, `bosses/THYXIS.md` |
| **Zones** | `ZONES.md`, `SPAWNPOINTS.md`, `WAVEMANAGER.md`, `zones/CITY-BREACH.md`, `zones/RUIN-DEN.md`, `zones/SHADOW-CORE.md`, `zones/THUNDER-SPIRE.md` |
| **Combat** | `ATTACKSYSTEM.md`, `COMBOSYSTEM.md`, `HITBOX.md`, `COLLISIONLAYERS.md`, `PROJECTILES.md`, `STATUSEFFECTS.md`, `DEBUFFS.md`, `MOVEMENT.md` |
| **AI & Systems** | `AICONTROLLER.md`, `GAMELOOP.md`, `RUNSTATE.md`, `SCENEMANAGER.md`, `PROGRESSION.md`, `ESSENCEECONOMY.md`, `COOP.md` |
| **Rendering** | `RENDERING.md`, `SPRITES.md`, `PARTICLES.md`, `AURASYSTEM.md`, `CAMERA.md`, `ASSETPIPELINE.md`, `PERFORMANCEBUDGET.md` |
| **Visuals** | `VISUAL-DESIGN.md`, `VISUAL-REFERENCE.md`, `CUSTOMIZATION.md`, `ANIMATIONS.md` |
| **UI/Screens** | `HUD.md`, `HUB.md`, `TITLESCREEN.md`, `CARDSCREEN.md`, `PAUSEMENU.md`, `ENDSCREEN.md`, `DEATH.md`, `SHOPMANAGER.md` |
| **Narrative** | `LORE.md` |
| **Systems** | `PORTAL.md`, `WEAPONS.md` |
| **Audio/Input** | `AUDIO.md`, `INPUT.md` |
| **Meta** | `CHANGELOG.md` (root) |

---

## Docs Gap Tracker

✅ **No known gaps.** All previously flagged missing docs have been created:

| Doc | Created |
|-----|---------|
| `CHANGELOG.md` | ✅ April 16, 2026 |
| `docs/SHOPMANAGER.md` | ✅ April 16, 2026 |
| `docs/PORTAL.md` | ✅ April 16, 2026 |
| `docs/LORE.md` | ✅ April 16, 2026 |
| `PORTAL-WEBRING.md` | ✅ April 16, 2026 (moved to root) |
| `src/visuals/RuinDenArena.js` | ✅ April 16, 2026 (stub) |
| `src/visuals/ShadowCoreArena.js` | ✅ April 16, 2026 (stub) |
| `src/visuals/ThunderSpireArena.js` | ✅ April 16, 2026 (stub) |

Add new gaps here as they are discovered.

---

## Skill Map (Quick Reference)

Load skills from `.agents/skills/`. Load max 2 at a time.

| What you are building | Load this skill |
|-----------------------|-----------------|
| Sprite animation, UV stepping, atlas | `sprite-animation.md` |
| Hit feedback, particles, screenshake | `game-feel-juice.md` |
| Combo counter, multiplier | `combo-system.md` |
| Enemy AI, FSMs | `animation-fsm.md` |
| Co-op input, shared camera | `multiplayer-coop.md` |
| XP, levelling, progression | `progression-xp.md` |
| HUD, shop, combo UI | `game-hud-ui.md` |
| Shaders, aura effects | `minimax-shader-dev.md` |
| Three.js patterns | `threejs-builder/SKILL.md` |
| Boss entrance, boss state transitions | `boss-intro.md` |
| Player death, co-op revive | `death-and-respawn.md` |
| Debugging | `systematic-debugging.md` |

---

## Jam Compliance (Must Pass Before Deploy)

- [ ] `<script async src="https://vibej.am/2026/widget.js"></script>` in `index.html`
- [ ] Game on single domain/subdomain
- [ ] No login, no signup
- [ ] Free to play
- [ ] Instant browser load — no loading screens
- [ ] New game created after April 1, 2026
- [ ] ≥90% of code written by AI
- [ ] Submitted before May 1, 2026 @ 13:37 UTC
