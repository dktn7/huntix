# Huntix Vibe Jam 2026 MVP Development Plan

**Deadline:** May 1, 2026 @ 13:37 UTC (18 days from April 13)
**Team:** Solo dev + AI assistance
**Stack:** Three.js browser brawler, 1–4 local co-op, roguelite runs 10–20min
**Focus:** Instant load, 60fps, no login/no shadows, widget included

---

## Core Loop

Hub (customize/shop) → Portal → Zone (fight waves/boss) → Essence/XP → Repeat

---

## MVP Scope

| Feature | Details |
|---|---|
| Hub | Character select (4 hunters), cosmetics/weapons, shop (6–8 slots), portals |
| Hunters | Dabik/Benzu/Sereisa/Vesol — shared controls, unique stats/spells/status |
| Combat | Light/heavy/dodge/special, mana/surge bars, synergies, juice (hitstop/shake) |
| Enemies/Bosses | 3 types + 1 miniboss + 1 boss/zone, co-op scaling (HP/enemy count) |
| Zones | 4 fixed — City Breach, Ruin Den, Shadow Core, Thunder Spire |
| Progression | Essence drops, shop buys, run-tied levels (4 max, 3 choices each) |
| Co-op | 1–4 local, AI fill, no friendly fire, distinct player colours |
| Tech | Max 20 enemies (instanced), 500 particles, baked AO/LOD |

**Post-MVP:** Online MP, more zones

---

## Roguelite Run Structure

- **Hub → 4 Zones → Bosses → Loop** (10–20min full clear)
- **Start:** Select hunters/weapons, base kit
- **Progress:** Clear zone → 500 Essence/XP → Hub shop → level if threshold hit
- **Choices:** Farm (repeat prior zones) or Push (next zone, +10% enemy HP)
- **Failure:** Wipe/timeout → Hub, lose buffs/XP, keep 50% Essence
- **Win:** Clear all 4 → high score + Essence bonus → restart run

### Leveling (Run-Tied XP)

| Source | XP Reward |
|---|---|
| Enemy | 50–200 |
| Boss | 1500 |
| Zone clear | 500 |

**Thresholds (cumulative):** L1: 500 · L2: 1500 · L3: 3000 · L4: 5000

**Shop level-up:** 3 choices (Common/Rare/Elite mods, e.g. "Dash damages"). Max 4/run, reset on fail.

### Zones & Bosses

| Zone | Boss | Co-op Scale |
|---|---|---|
| 1 — City Breach | Fire Bruiser | Adds in 4P |
| 2 — Ruin Den | Earth Tank | Wall spawns |
| 3 — Shadow Core | Rogue Dabik | ×2 Clones |
| 4 — Thunder Spire | Raiju | Chain lightning |

---

## Phased Timeline

| Phase | Days (from Apr 13) | Tasks | Milestone |
|---|---|---|---|
| 1 — Core Engine | 1–3 | Three.js setup, player controller (move/dodge/attack), basic scene/hub, widget integration | Solo hunter moves + attacks |
| 2 — Combat Basics | 4–6 | Enemy AI (3 types), hit detection/status, mana/surge/spells, juice (shake/spark/slow-mo) | Fight grunt waves |
| 3 — Hunters & Co-op | 7–9 | 4 hunters (models/animations), local 1–4P input/camera, AI companions, scaling | 4P hub + combat |
| 4 — Zones & Bosses | 10–12 | 4 zones/portals/transitions, miniboss + boss phases, drops, magnet essence | Full run clear |
| 5 — Progression/UI | 13–15 | Hub shop/customize, weapons/cosmetics, leveling (XP/thresholds/choices), HUD/combo UI | Buy + upgrade loop |
| 6 — Polish & Deploy | 16–18 | Audio/SFX, onboarding prompts, perf tweaks (60fps), submit/deploy domain + widget | Playable demo |

**Rate:** 4–6 hrs/day with AI for code/models; GitHub repo.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Performance | Instanced meshes + LOD early |
| Co-op input bugs | Test local input Day 7 |
| Asset quality | Low-poly stylized; reuse for variants |
| Scope creep | Lock to table above; cut AI companion if needed |

---

## Combat Feel / Juice

- Hitstop/shake/flash + SFX
- Combo UI (scales 1–20×, colour shifts green→red, audio ramp)
- Kill slow-mo (final wave enemy: 0.3× speed for 500ms)
- Gold magnet (particles lerp to player within 5m)
- Ultimate: 200ms hitstop + camera zoom-punch
- Input buffer/cancels (10–15 frames)

---

## Deployment Checklist

- [ ] Single domain (e.g. `huntix.yourdomain.com`)
- [ ] No login/signup
- [ ] No loading screens
- [ ] Widget included:

```html
<script async src="https://vibej.am/2026/widget.js"></script>
```

- [ ] Submit before **May 1, 2026 @ 13:37 UTC**
