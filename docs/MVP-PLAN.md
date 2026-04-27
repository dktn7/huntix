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
| Three.js engine | ✅ Complete | Core foundation systems are in repo |
| Vibe Jam widget | ✅ Live | `<script async src="https://vibej.am/2026/widget.js"></script>` in `index.html` |
| Current shipping focus | 🔄 In progress | 3-day finish line: enemy assets, KIBAD exception, wave pacing, polish, deploy |
| Public roadmap | ✅ Updated | README mirrors the finish-line plan |

---

## Finish-Line Plan

This file mirrors the shipping priorities in `AGENTS.md`.

| Priority | Focus | Done when | Key Files |
|----------|-------|----------|-----------|
| 1 | Enemy and boss assets | Grunts, ranged, bruisers, and bosses are using real assets in-engine; KIBAD is the explicit exception if he needs more time. | `assets/sprites/enemies/`, `assets/sprites/bosses/`, `HunterMeshes.js` |
| 2 | Run completeness | All 4 zones have enough wave pressure and boss flow to feel like a finished run. | `EnemySpawner.js`, `ZoneManager.js`, `BossEncounter.js` |
| 3 | Readability and pacing | Combat, HUD, telegraphs, and encounter spacing are easy to read at full speed. | `HUD.js`, `SceneManager.js`, `CombatController.js` |
| 4 | Audio and UI polish | Core SFX, music transitions, onboarding, and results flow feel intentional. | `AudioManager.js`, `PortalManager.js`, `TitleScreen` |
| 5 | Performance and deploy | The game holds its frame budget, stays within jam rules, and is ready to submit. | `index.html`, `scripts/check-phase.js`, `CHANGELOG.md` |

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

KIBAD is the one deliberate art exception in the current shipping plan. Do not let that block the rest of the enemy and boss asset pass.

---

## Source of Truth Rules

> These rules exist to prevent design drift across documents.

1. **`AGENTS.md`** (repo root) is the master entry point — read before every session.
2. **`AGENTS.md` finish-line priorities** are the canonical repo-wide roadmap. `README.md` and this file should mirror them, not override them.
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
