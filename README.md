# HUNTIX 🜂
> **3D Browser Beat 'Em Up · Roguelite · 1-4 Player Co-op**  
> Built with Three.js · Vibe Jam 2026 Entry · No login · Free to play

---

## What Is Huntix?

Huntix is a fast-paced 3D brawler where 1-4 players choose elemental hunters and blast through portal-linked combat zones. Inspired by *Solo Leveling*, *Castle Crashers*, and *Dead Cells* — short intense runs (10–20 min), heavy hit-feel, and an addictive Farm → Level → Push loop.

**Core loop:**  
`Hub (select hunter + buy) → Portal → Wave fights → Boss → Essence/XP → Hub → Repeat`

---

## Hunters

| Hunter | Element | Status | Playstyle |
|--------|---------|--------|-----------|
| **Dabik** | Shadow | Bleed | Rogue — fast slashes, shadow clones |
| **Benzu** | Earth / Thunder | Stun | Tank — ground slams, AOE shockwaves |
| **Sereisa** | Lightning | Slow | Striker — chain bolts, rapid dashes |
| **Vesol** | Flame | Burn | Brawler — fire punches, flame pillars |

All hunters share light/heavy/dodge/special inputs. Each has unique stats, mana/surge bars, and 1 ultimate.

---

## Zones & Bosses

| # | Zone | Boss | Co-op Scaling |
|---|------|------|---------------|
| 1 | **City Breach** | Fire Bruiser | + Extra adds (4P) |
| 2 | **Ruin Den** | Earth Tank | Wall spawns |
| 3 | **Shadow Core** | Rogue Dabik | ×2 Clones |
| 4 | **Thunder Spire** | Raiju | Chain lightning |

Each zone has 3 enemy types + 1 miniboss before the main boss. Portals link zones; no loading screens.

---

## Roguelite Run Structure

```
Run Start
 └─ Hub: Pick hunter + weapon loadout
     └─ Zone 1 → Boss → +500 Essence/XP
         └─ Hub Shop (level up if threshold hit)
             └─ Choice: Farm Repeat (prior zone) OR Push Next (+10% enemy HP)
                 └─ Zones 2, 3, 4 → Win: Score bonus + restart
                 └─ Wipe/timeout → Hub (lose buffs/XP, keep 50% Essence)
```

### XP Thresholds (run-tied, reset on fail)
| Level | XP Needed | Reward |
|-------|-----------|--------|
| L1 | 500 | 3 Common mod choices |
| L2 | 1,500 | 3 Rare mod choices |
| L3 | 3,000 | 3 Elite mod choices |
| L4 | 5,000 | 3 Elite mod choices |

XP sources: Enemies 50–200 · Zone clear 500 · Boss 1,500

---

## Combat Feel (Juice)

- Hitstop on heavy hits
- Screen shake + flash
- Combo counter UI (streak multiplier)
- Slow-mo on boss kills
- Ultimate punch cinematic
- Input buffer + cancel windows
- 500 max particles per burst

---

## Co-op System

- **1–4 players**, local input (keyboard splits / gamepad)
- Each player gets a **distinct elemental color**
- HP scales: **+50% per extra player**
- Enemy count scales with player count
- **No friendly fire**
- **AI companions** fill empty slots (follow, use abilities, revive downed players)

---

## Shop & Economy

| Item | Cost (Essence) | Notes |
|------|---------------|-------|
| Weapon upgrade | Varies | 17 weapons total (daggers → guns → portal blades → water) |
| Mod slot | Rarity-based | Max 5 buys per run |
| Cosmetic | Fixed | Aura/colour variants per hunter |

Essence drops from enemies with magnet-pull pickup. Rarities: Common / Rare / Elite.

---

## Tech Spec

| Concern | Approach |
|---------|----------|
| Engine | Three.js (vanilla, no heavy frameworks) |
| Performance | Instanced meshes, max 20 enemies, baked AO, LOD |
| Target | 60fps on mid-range laptop |
| Load time | Near-instant — no loading screens |
| Auth | None — enter username only (optional) |
| Hosting | Single domain (required for Vibe Jam widget tracking) |
| Widget | `<script async src="https://vibej.am/2026/widget.js"></script>` ✅ |

---

## Dev Phases (18 Days · Apr 13 → May 1)

| Phase | Days | Goal | Milestone |
|-------|------|------|-----------|
| 1 · Core Engine | 1–3 | Three.js setup, player controller, hub scene, widget | Solo hunter moves & attacks |
| 2 · Combat | 4–6 | Enemy AI (3 types), hit detection, status effects, juice | Fight grunt waves |
| 3 · Hunters & Co-op | 7–9 | 4 hunters (models/anims), local 1-4P input, AI fill | 4P hub + combat working |
| 4 · Zones & Bosses | 10–12 | 4 zones, portals, boss phases, essence drops | Full run completable |
| 5 · Progression & UI | 13–15 | Hub shop, leveling (XP/choices), HUD, combo UI | Buy/upgrade loop |
| 6 · Polish & Deploy | 16–18 | Audio, SFX, 60fps tuning, domain deploy, submit | Live playable demo |

> ⚠️ **Deadline: May 1, 2026 @ 13:37 UTC**

---

## File Structure

```
huntix/
├── index.html              # Entry point — loads widget, boots game
├── assets/                 # Models, textures, audio
├── projects/               # Dev experiments / prototypes
├── bonus/                  # Extra features (post-MVP)
├── .agents/                # AI agent config (Claude/Cursor)
├── .claude/                # Claude project context
├── START-HERE.md           # Quick-start for AI agents
├── CHANGELOG.md            # What changed and when
└── README.md               # This file
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Performance drops | Instanced meshes + LOD from Day 1 |
| Co-op input bugs | Test local multi-input on Day 7 |
| Asset shortage | Low-poly stylized; reuse/recolour for variants |
| Scope creep | Lock to MVP table above; cut AI companions if needed |

---

## Status

- [x] Repo initialized from Vibe Jam starter pack
- [x] Game spec finalized
- [x] Dev plan locked (18-day timeline)
- [ ] Phase 1: Core engine (in progress)
- [ ] Phase 2: Combat basics
- [ ] Phase 3: Hunters & co-op
- [ ] Phase 4: Zones & bosses
- [ ] Phase 5: Progression & UI
- [ ] Phase 6: Polish & deploy 🚀

---

*Huntix — Hunt the gates. Clear the zones. Become S-Rank.*
