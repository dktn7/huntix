# HUNTIX — Movement System

> Movement is the foundation of everything. If it doesn't feel good to walk, nothing else matters.

*Last updated April 15, 2026*

---

## Overview

Huntix uses a 2.5D flat-arena movement system. All movement is on the X/Y plane. There is no Z-axis movement — depth is visual only (parallax layers). The movement system covers:

- Ground movement and acceleration
- Jump (single, no air attacks in MVP)
- 8-directional dodge with i-frames
- Movement during combat states
- Per-hunter movement feel differences

---

## Global Movement Rules

| Property | Value |
|----------|-------|
| Movement plane | X/Y only — no Z movement |
| Direction | Left / right (X axis) + up / down (Y axis, compressed 2.5D) |
| Camera | Fixed orthographic — no scroll |
| Arena bounds | Hard walls at X edges, soft push at Y edges |
| Max simultaneous movement inputs | All 8 directions (WASD or left stick) |

---

## Ground Movement

### Speed Values

| Hunter | Base move speed | Sprint multiplier | Notes |
|--------|----------------|-------------------|-------|
| Dabik | 7.0 units/s | 1.0× (no sprint) | Fastest base — always at top speed |
| Benzu | 4.0 units/s | 1.0× (no sprint) | Slowest — weight is his identity |
| Sereisa | 6.0 units/s | 1.0× (no sprint) | Second fastest, upright aggressive stride |
| Vesol | 5.5 units/s | 1.0× (no sprint) | Medium — controlled jog |

> No sprint mechanic in MVP. Each hunter has a single move speed. Sprint is post-MVP.

### Acceleration & Deceleration

| Property | Value | Notes |
|----------|-------|-------|
| Acceleration | 40 units/s² | Time to full speed from stop: ~0.18s |
| Deceleration | 60 units/s² | Time to stop from full speed: ~0.12s |
| Direction change | Instant — no momentum carry | Feels snappy, not slippery |

> Deceleration is faster than acceleration intentionally — stopping feels decisive. Direction changes are instant to keep combat responsive.

### Movement During Combat States

| State | Movement allowed | Speed modifier |
|-------|-----------------|----------------|
| IDLE | Full | 1.0× |
| RUN | Full | 1.0× |
| ATTACK_LIGHT | None during wind-up + active frames | 0× during attack, 0.5× during recovery |
| ATTACK_HEAVY | None during wind-up + active frames | 0× during attack, 0× during recovery |
| SPELL_MINOR | Partial | 0.5× |
| SPELL_ADVANCED | Partial | 0.5× |
| DODGE | Full dodge velocity | Overrides move speed |
| HURT | None | 0× (stagger pushback only) |
| KNOCKDOWN | None | 0× |
| GETUP | None during first 8f | 0× then 0.5× |
| ULTIMATE | None — rooted | 0× |
| JUMP (airborne) | Full horizontal | 1.0× horizontal |

> Spell cast movement at 0.5× applies to both SPELL_MINOR and SPELL_ADVANCED. The hunter can walk slowly while casting but cannot run. This makes ranged hunters slightly vulnerable without rooting them completely.

---

## Jump

### Jump Rules

| Property | Value |
|----------|-------|
| Jump type | Single jump — no double jump in MVP |
| Jump input | Space / South button (A/Cross) |
| Jump height | 2.5 world units |
| Jump arc duration | 0.5s total (0.25s rise, 0.25s fall) |
| Horizontal control | Full — can change X direction freely while airborne |
| Air attacks | ❌ Not in MVP |
| Landing | Instant — no landing lag |
| Jump cancel | Cannot cancel jump into attack or spell while airborne |
| Coyote time | 0.08s — can jump briefly after walking off a ledge (future-proofing) |

### Jump Purpose in MVP

Jump is purely evasive — used to arc over ground hazards:

| Hazard | Zone | Jump clears it? |
|--------|------|----------------|
| Boss fire pools (VRAEL) | City Breach | ✅ Yes |
| Seismic Slam crater (ZARTH) | Ruin Den | ✅ Yes |
| Shadow pools (KIBAD) | Shadow Core | ✅ Yes |
| Storm DoT floor patches (THYXIS) | Thunder Spire | ✅ Yes |

> Jump does not affect combat combos. Airborne state does not count as a dodge and does not grant i-frames.

### Post-MVP: Jump Attacks

Not in MVP. When vertical arenas or flying enemies are added post-jam:
- Universal rule: light attack input while airborne = 1.0× plunging strike on landing
- Adds ATTACK_LIGHT_AIR state to all hunters
- Landing strike hitbox: 1.5m radius on landing point

---

## 8-Directional Dodge

### Dodge Rules

| Property | Value |
|----------|-------|
| Dodge input | Left Shift / West button (X/Square) |
| Directions | 8-directional — follows current move input direction |
| Default (no input) | Dodges in currently facing direction |
| Distance | 3.5 world units |
| Duration | 300ms (18 frames) |
| I-frame window | Frames 5–14 (167ms) — invincible to all damage |
| Cooldown | 0.8s after dodge completes |
| Dodge during cast | ❌ Not allowed — casts are committed |
| Dodge during HURT | ❌ Not allowed — plays to completion |
| Dodge during ULTIMATE | ❌ Not allowed — armoured |
| Surge gain (standard) | +3% |
| Surge gain (perfect dodge) | +8% (see ATTACKSYSTEM.md) |

### Per-Hunter Dodge Feel

| Hunter | Dodge type | Visual |
|--------|-----------|--------|
| Dabik | Blink | Dissolve out → teleport VFX → dissolve in. No travel arc. Instant repositioning. |
| Benzu | Shoulder Charge | Body drops low, explosive surge forward. Enemies in path stagger (0.3s). |
| Sereisa | Electric Dash | Forward blur through enemies. Lightning trail left behind at path. |
| Vesol | Flame Scatter | Arms push out, ember burst radially. Brief backward drift. |

> Each dodge type covers the same 3.5 units and has the same i-frame window — the difference is purely visual and feel. Benzu's stagger on enemies in path is the one mechanical exception.

### Dodge Direction Examples

```
Move input → Dodge direction

Left          → Dodge left
Right         → Dodge right
Up            → Dodge up (back in 2.5D)
Down          → Dodge down (forward in 2.5D)
Up-Left       → Dodge up-left diagonal
Up-Right      → Dodge up-right diagonal
Down-Left     → Dodge down-left diagonal
Down-Right    → Dodge down-right diagonal
No input      → Dodge in facing direction
```

---

## Arena Bounds

| Bound | Behaviour |
|-------|----------|
| Left wall (X min) | Hard stop — hunter cannot pass. Wall collision. |
| Right wall (X max) | Hard stop — same. |
| Top edge (Y max) | Soft push — hunter slows at edge, cannot fully leave frame |
| Bottom edge (Y min) | Soft push — same |
| Arena width | 40 world units (combat zones), 60 world units (hub) |

> No fall-off in MVP. The arena is a flat enclosed space. Enemies and hunters cannot leave the arena bounds.

---

## Co-op Movement

| Rule | Value |
|------|-------|
| Camera | Tracks centroid of all active players |
| Camera zoom | Zooms out as players spread apart (min zoom: 0.7×, max: 1.0×) |
| Player collision | Hunters do not collide with each other — pass through freely |
| Knockback | Each player's knockback is independent — no chain knockback between hunters |

> Hunters passing through each other prevents co-op gridlock in tight corridors. This is intentional — Castle Crashers uses the same rule.

---

## Movement State Machine

```
IDLE
  → RUN (move input)
  → JUMP (jump input)
  → DODGE (dodge input)
  → ATTACK_LIGHT (light input)
  → ATTACK_HEAVY (heavy input)
  → SPELL_MINOR (spell input, L1 unlocked)

RUN
  → IDLE (no move input)
  → JUMP (jump input)
  → DODGE (dodge input)
  → ATTACK_LIGHT (light input)
  → ATTACK_HEAVY (heavy input)
  → SPELL (spell input)

JUMP (airborne)
  → LAND → IDLE (on ground contact)
  → No attacks, no spells, no dodge while airborne

DODGE
  → IDLE / RUN (on completion)
  → Cannot be cancelled

SPELL_MINOR / SPELL_ADVANCED
  → IDLE / RUN (on completion)
  → Movement at 0.5× during cast
  → Cannot be cancelled into dodge
```

---

## Per-Hunter Movement Identity Summary

| Hunter | Speed | Jump feel | Dodge feel | Combat movement |
|--------|-------|-----------|------------|-----------------|
| Dabik | Fastest (7.0) | Light, quick arc | Instant blink — disorienting to enemies | Weaves in and out constantly |
| Benzu | Slowest (4.0) | Heavy, low arc | Charges forward — aggressive, not evasive | Plants and trades hits |
| Sereisa | Fast (6.0) | Upright, controlled | Electric dash through enemies | Constant motion, never static |
| Vesol | Medium (5.5) | Measured, deliberate | Scatters backward — maintains range | Holds ground, controls space |

---

## Related Docs

| System | Doc |
|--------|-----|
| Dodge i-frames and perfect dodge | [ATTACKSYSTEM.md](./ATTACKSYSTEM.md) |
| Surge gain on dodge | [COMBOSYSTEM.md](./COMBOSYSTEM.md) |
| Per-hunter dodge animations | [ANIMATIONS.md](./ANIMATIONS.md) |
| Co-op camera zoom | [ZONES.md](./ZONES.md) |
| Ground hazards by zone | [ZONES.md](./ZONES.md) |
