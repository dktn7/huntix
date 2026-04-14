# HUNTIX — MVP Build Plan

*Last updated: April 14, 2026*

---

## Current Status

| Area | Status | Notes |
|---|---|---|
| GDD | ✅ Complete | `docs/GDD.md` |
| Hunter designs | ✅ Complete | `docs/HUNTERS.md` — canonical source of truth |
| Hunter individual files | ✅ Updated | `docs/hunters/` — corrected from HUNTERS.md |
| Visual reference lock | ✅ New | `docs/VISUAL-REFERENCE.md` — read before any asset work |
| Character art prompts | ✅ In each hunter file | Mixboard + Grok prompts embedded |
| Asset pipeline | 🔄 In progress | Mixboard → Kling/Grok → Blender → TexturePacker → Three.js |
| Three.js engine | 🔲 Not started | Phase 1 |
| Combat system | 🔲 Not started | Phase 2 |
| All 4 hunters playable | 🔲 Not started | Phase 3 |
| Zones (3) | 🔲 Not started | Phase 4 |
| Bosses | 🔲 Not started | Phase 4 |
| Shop / progression | 🔲 Not started | Phase 5 |
| Polish + deploy | 🔲 Not started | Phase 6 |
| Vibe Jam widget | 🔲 Pending | Required — add to HTML before deploy |

---

## Build Phases

### Phase 1 — Core Engine (Days 1–3)

**Goal:** Solo hunter moves and attacks in a working Three.js scene.

- [ ] Three.js project setup — public repo, single domain
- [ ] 2.5D fixed-angle scene + camera (Castle Crashers angle)
- [ ] Basic player controller — WASD move, Space jump, LShift dodge
- [ ] Hunter hub placeholder scene
- [ ] Vibe Jam widget integration: `<script async src="https://vibej.am/2026/widget.js"></script>`
- [ ] Light attack chain (3 hits), heavy attack
- [ ] Basic aura particle system placeholder

**Milestone:** One hunter moves, attacks, and dodges. Widget live.

---

### Phase 2 — Combat Basics (Days 4–6)

**Goal:** Fight grunt waves with status effects and feedback.

- [ ] 3 enemy types: Grunt (melee), Ranged Unit, Bruiser
- [ ] Enemy FSM: idle → telegraph → action → recover
- [ ] Hit detection + hitstop (40–80ms)
- [ ] Status effects: Bleed, Stun, Slow, Burn
- [ ] Health / Mana / Surge bars (HUD)
- [ ] Mana system — passive regen + on-hit regen
- [ ] Surge system — builds on kills / hits taken / streaks
- [ ] Screen shake + hit sparks + stagger
- [ ] Minor spell (tap E) per hunter

**Milestone:** Fight and kill grunt waves with status feedback.

---

### Phase 3 — All Hunters + Co-op (Days 7–9)

**Goal:** 4P hub and combat working.

- [ ] All 4 hunters implemented: Dabik, Benzu, Sereisa, Vesol
- [ ] Hunter stat differences active (speed, damage, defense)
- [ ] Each hunter dodge unique: Blink / Shoulder Charge / Electric Dash / Flame Scatter
- [ ] Advanced spell (hold E) per hunter
- [ ] Ultimate (full Surge) per hunter
- [ ] Local 1–4P input handling
- [ ] Camera pan/zoom for co-op visibility
- [ ] Optional AI companion placeholder
- [ ] Status effect synergies: Bleed+Slow, Stun+Wall, Slow+Blink, Burn+Slam
- [ ] Co-op enemy HP scaling (+50% per additional player)

**Milestone:** 4P hub and combat working, all ultimates fire.

---

### Phase 4 — Zones + Bosses (Days 10–12)

**Goal:** Full run clearable from hub to final boss.

- [ ] City Breach zone — ruined streets, intro enemies, Fire Bruiser miniboss
- [ ] Ruin Den zone — underground dungeon, aggressive waves, Earth Tank boss
- [ ] Shadow Core zone — final boss: Rogue Dabik (mirror hunter)
- [ ] Zone portal transitions
- [ ] Boss phase FSM (Phase 1 → Phase 2 on HP threshold)
- [ ] Essence/gold drops from enemies and bosses
- [ ] Boss HP bar HUD
- [ ] Co-op boss HP scaling
- [ ] Juice: slow-mo kill, tiered screen shake, aura ramp on boss

**Milestone:** Full run: Hub → 3 zones → 3 bosses → Victory.

---

### Phase 5 — Progression + UI (Days 13–15)

**Goal:** Buy, upgrade, and level loop working.

- [ ] Hub shop (6–8 slots, 1 reroll)
- [ ] Shop categories: Power, Survival, Utility, Cosmetic
- [ ] Level-up system (4 levels, 3 upgrade paths per hunter)
- [ ] Upgrade paths: Power / Survival / Mobility / Style
- [ ] Combo counter UI
- [ ] Full HUD: health/mana/surge per hunter, currency, boss bar
- [ ] Character select screen
- [ ] Screen flow: Title → Hub → Shop → Portal → Zone → Boss → Victory

**Milestone:** Buy upgrades, level up, visual aura changes on progression.

---

### Phase 6 — Polish + Deploy (Days 16–18)

**Goal:** Playable public demo. Jam submission ready.

- [ ] Audio: hit SFX, spell SFX, ambient zone audio, boss stingers
- [ ] Combo audio feedback
- [ ] Onboarding: control prompt on first load
- [ ] 60fps performance pass — LOD, instanced meshes, particle caps
- [ ] Max 20 enemies on screen at once enforced
- [ ] Max 500 particles enforced
- [ ] Deploy to single domain (no login, no signup, instant load)
- [ ] Verify Vibe Jam widget is live and tracking
- [ ] Portal webring (optional): exit portal → `https://vibej.am/portal/2026`
- [ ] Final test: 1P and 4P local co-op run clear

**Milestone:** Submitted to Vibe Jam 2026. Publicly playable.

---

## Post-MVP (After May 1)

- Online multiplayer
- Thunder Spire zone + Raiju boss
- Additional hunters
- Save/progression system
- Quest and dialogue
- Procedural generation
- Complex inventory

---

## Asset Status

| Hunter | Design Sheet | Animation | Blender Key | Atlas | In Engine |
|---|---|---|---|---|---|
| Dabik | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 |
| Benzu | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 |
| Sereisa | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 |
| Vesol | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 |

---

## Source of Truth Rules

> These rules exist to prevent design drift across documents.

1. **`docs/HUNTERS.md`** is the master character document. All appearance, stats, spells sourced from here.
2. **`docs/VISUAL-REFERENCE.md`** is the canonical design lock for asset generation. Read before any Mixboard/Grok/Kling prompt.
3. **`docs/GDD.md`** is the master gameplay document. All mechanics sourced from here.
4. **Individual hunter files** (`docs/hunters/`) are derived from HUNTERS.md — they embed prompts but do not override the master.
5. **Never source character details from conversation history.** Always read the file.

---

## Jam Compliance Checklist

- [ ] Widget script in HTML: `<script async src="https://vibej.am/2026/widget.js"></script>`
- [ ] Game on single domain or subdomain
- [ ] No login, no signup required
- [ ] Free to play
- [ ] Instant browser load (no heavy loading screens)
- [ ] New game — created during jam period (after April 1, 2026)
- [ ] At least 90% of code written by AI
- [ ] Submitted before May 1, 2026 @ 13:37 UTC
