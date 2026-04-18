# HUNTIX — MVP Build Plan

*Last updated: April 18, 2026*

---

## Current Status

| Area | Status | Notes |
|---|---|---|
| GDD | ✅ Complete | `docs/GDD.md` |
| AGENTS.md | ✅ Complete | Repo root — read first every session |
| Hunter designs | ✅ Complete | `docs/HUNTERS.md` — canonical source of truth |
| Hunter individual files | ✅ Complete | `docs/hunters/` — corrected from HUNTERS.md |
| Visual reference lock | ✅ Complete | `docs/VISUAL-REFERENCE.md` — read before any asset work |
| Sprite pipeline doc | ✅ Complete | `docs/SPRITES.md` — rendering model, UV stepping, atlas format |
| Character art prompts | ✅ Complete | Mixboard + Google Flow prompts embedded |
| Asset pipeline | ✅ Complete | Mixboard → Google Flow → TexturePacker → Three.js |
| Three.js engine | ✅ Complete | Phases 1–5 foundation systems are in repo |
| Vibe Jam widget | ✅ Live | `<script async src="https://vibej.am/2026/widget.js"></script>` in `index.html` |
| Current repo phase | 🔄 In progress | **Phase 6 — Screen Flow & Loop Closure** |
| Public roadmap | ✅ Updated | README now mirrors repo-wide 16-phase structure |

---

## Repo-Wide Phase Plan

This file now mirrors the canonical 16-phase roadmap in `AGENTS.md`.

| Phase | Status | Name | Goal | Key Files |
|-------|--------|------|------|-----------|
| 1 | ✅ Done | Core Engine | Three.js scene, camera, game loop, player controller, widget live | `GameLoop.js`, `Renderer.js`, `InputManager.js`, `PlayerState.js` |
| 2 | ✅ Done | Combat Basics | Hit detection, status effects, HUD bars, grunt enemy FSM | `EnemyAI.js`, `EnemySpawner.js`, `Hitbox.js` |
| 3 | ✅ Done | All 4 Hunters + Co-op | Hunter stubs, stat differences, co-op input, `AnimationController`, `SpriteAnimator`, `HunterMeshes` present as files | `HunterController.js`, `AnimationController.js`, `HunterMeshes.js`, `SpriteAnimator.js` |
| 4 | ✅ Done | Zones + Bosses | City Breach wired, hub return, all 4 arena stubs created, `ZoneManager`, `PortalManager` | `ZoneManager.js`, `PortalManager.js`, arena stubs |
| 5 | ✅ Done | Progression + UI | `ShopManager.js`, `HUD.js`, `ProgressionData.js`, `RunState.js` wired | `ShopManager.js`, `HUD.js`, `ProgressionData.js` |
| 6 | 🔄 **CURRENT** | Screen Flow & Loop Closure | Title → Hunter Select → Hub → Portal → Zone → Boss → Victory → Hub fully wired end-to-end. Every transition in `SceneManager.js` working. No dead ends. | `SceneManager.js`, `TitleScreen`, `HunterSelectScreen`, `EndScreen` |
| 7 | 🔲 | Hunter Sprite Pipeline | Mixboard → Google Flow for all 4 hunters. 8 animation states each. Background removal, TexturePacker atlas, loaded into `HunterMeshes.js`. Real sprites replace placeholder boxes. | `assets/sprites/hunters/`, `HunterMeshes.js` |
| 8 | 🔲 | Enemy & Boss Sprite Pipeline | Grunt, Ranged, Bruiser sprites. All 4 boss sprites. Particle FX atlas (spark/smoke/blood/lightning/fire/shadow/glow-ring). | `assets/sprites/enemies/`, `assets/sprites/bosses/`, `assets/sprites/particles/` |
| 9 | 🔲 | Zone Background Art | All 5 zones × 3 parallax layers = 15 WebP files wired into parallax renderer. | `assets/backgrounds/` |
| 10 | 🔲 | Animation State Machine Live | `AnimationController.js` + `SpriteAnimator.js` fully wired. All 14 states per hunter drive from gameplay. | `AnimationController.js`, `SpriteAnimator.js` |
| 11 | 🔲 | Spells, Surge & Combat Depth | Minor + Advanced spells per all 4 hunters live. Surge bar fills and Ultimate fires with cinematic entry. Status synergy pairs trigger correctly. | `CombatController.js`, `StatusEffects.js`, `PlayerState.js` |
| 12 | 🔲 | Zones 1–2 Full | City Breach + Ruin Den complete with enemy waves, VRAEL + ZARTH boss FSMs, boss entrance cinematic, boss HP bar, essence drops. | `BossEncounter.js`, `zones/CITY-BREACH`, `zones/RUIN-DEN` |
| 13 | 🔲 | Zones 3–4 Full | Shadow Core + Thunder Spire complete with KIBAD mirror-hunter mechanics, THYXIS multi-phase FSM, polished transitions. | `zones/SHADOW-CORE`, `zones/THUNDER-SPIRE`, `BossEncounter.js` |
| 14 | 🔲 | Progression & Shop Live | Full 10-level XP curve active, spell unlocks, upgrade path lock, shop 5-item/2-buy/30-essence-reroll rules working in-game, aura intensity scales with level. | `ShopManager.js`, `ProgressionData.js`, `AuraShader.js` |
| 15 | 🔲 | Audio | `AudioManager.js`: hit SFX, spell SFX, dodge SFX, boss stingers, ambient zone audio, combo feedback. Web Audio API buffer pool. | `AudioManager.js`, `assets/audio/` |
| 16 | 🔲 | Deploy & Jam Submission | 60fps performance pass, onboarding control prompt, jam compliance checks, single-domain deploy, submitted before deadline. | `index.html`, `scripts/check-phase.js`, `CHANGELOG.md` |

---

## Asset Status

This table now reflects the real locked/incomplete state from `AGENTS.md`, not placeholder completion.

| Asset | Design Sheet | Animation Frames | Atlas | In Engine |
|---|---|---|---|---|
| Dabik | 🔲 | 🔲 | 🔲 | 🔲 |
| Benzu | 🔲 | 🔲 | 🔲 | 🔲 |
| Sereisa | 🔲 | 🔲 | 🔲 | 🔲 |
| Vesol | 🔲 | 🔲 | 🔲 | 🔲 |
| Grunt | 🔲 | 🔲 | 🔲 | 🔲 |
| Ranged Unit | 🔲 | 🔲 | 🔲 | 🔲 |
| Bruiser | 🔲 | 🔲 | 🔲 | 🔲 |
| VRAEL | 🔲 | 🔲 | 🔲 | 🔲 |
| ZARTH | 🔲 | 🔲 | 🔲 | 🔲 |
| KIBAD | 🔲 | 🔲 | 🔲 | 🔲 |
| THYXIS | 🔲 | 🔲 | 🔲 | 🔲 |
| FX Atlas | — | 🔲 | 🔲 | 🔲 |
| Hub BG (3 layers) | — | — | 🔲 | 🔲 |
| City Breach BG (3 layers) | — | — | 🔲 | 🔲 |
| Ruin Den BG (3 layers) | — | — | 🔲 | 🔲 |
| Shadow Core BG (3 layers) | — | — | 🔲 | 🔲 |
| Thunder Spire BG (3 layers) | — | — | 🔲 | 🔲 |

Update to ✅ only when assets are genuinely complete and integrated.

---

## Source of Truth Rules

> These rules exist to prevent design drift across documents.

1. **`AGENTS.md`** (repo root) is the master entry point — read before every session.
2. **`AGENTS.md` phase table** is the canonical repo-wide roadmap. `README.md` and this file should mirror it, not override it.
3. **`docs/HUNTERS.md`** is the master character document. All appearance, stats, spells sourced from here.
4. **`docs/VISUAL-REFERENCE.md`** is the canonical design lock for asset generation. Read before any Mixboard/Google Flow prompt.
5. **`docs/GDD.md`** is the master gameplay document. All mechanics sourced from here.
6. **`docs/PROGRESSION.md`** owns all numbers: levels (10), shop slots (5), reroll cost (30 Essence), max purchases (2).
7. **`docs/ENEMIES.md`** owns all enemy XP and Essence drop values. Boss XP = 500, Boss Essence = 200.
8. **Individual hunter files** (`docs/hunters/`) are derived from HUNTERS.md — they embed prompts but do not override the master.
9. **Never source character details from conversation history.** Always read the file.

---

## Canonical Numbers (Quick Reference)

| Value | Number |
|-------|--------|
| Levels per run | 10 |
| Shop items shown | 5 random |
| Max shop purchases per visit | 2 |
| Reroll cost | 30 Essence |
| Boss XP | 500 |
| Boss Essence | 200 |
| Max enemies on screen | 20 |
| Max particles per frame | 500 |

---

## Jam Compliance Checklist

- [x] Widget script in HTML: `<script async src="https://vibej.am/2026/widget.js"></script>`
- [ ] Game on single domain or subdomain
- [ ] No login, no signup required
- [ ] Free to play
- [ ] Instant browser load (no heavy loading screens)
- [ ] New game — created during jam period (after April 1, 2026)
- [ ] At least 90% of code written by AI
- [ ] Submitted before May 1, 2026 @ 13:37 UTC
