# HUNTIX — Combo & Surge System

> The grade reflects how you fought. The Surge is what you've earned.

*Last updated April 15, 2026*

---

## Overview

Two interlocked systems drive combat expression:

- **Combo System** — tracks hit streaks and evaluates sequence quality with a letter grade (D through SS)
- **Surge System** — builds a personal power bar that, when full, enables the hunter's Ultimate

Both are per-player and independent in co-op. Both feed the end screen stats.

---

## Global Rules

| Rule | Value |
|------|-------|
| Combo reset on hit taken | No — hit **does not reset** combo counter |
| SS lock on hit taken | Yes — taking any hit during a combo sequence **permanently locks SS** for that sequence |
| Surge decay | None — Surge holds at current value until used or run ends |
| Surge scope | Per-player — each hunter builds and uses their own Surge independently |
| Combo reset conditions | 2.0s with no hits dealt, or weapon swap mid-combo (see below) |

---

## Combo System

### What Counts as a Hit

| Action | Counts | Notes |
|--------|--------|-------|
| Light attack landing | ✅ | Each hit in a chain counts separately |
| Heavy attack landing | ✅ | Counts as 1 hit regardless of area size |
| Spell damage landing | ✅ | Each enemy hit by spell counts as 1 hit |
| Status tick damage | ❌ | DoT ticks do not extend or count toward combo |
| Weapon swap | ❌ | Swap resets combo counter and grade to zero |
| Miss (no enemy hit) | ❌ | Attack must connect to count |

### Combo Counter

- Increments by 1 per valid hit
- Resets to 0 after **2.0s of no valid hits**
- Resets to 0 on **weapon swap**
- Does **not** reset on hit taken — but SS is locked for that sequence
- Displayed on HUD top-centre (see HUD.md)
- `stats.highestCombo` in RunState tracks the peak value for end screen

### Combo Essence Bonus

At the end of a combo sequence (reset by timeout or weapon swap), a bonus Essence drop is awarded:

| Combo length | Essence bonus |
|-------------|---------------|
| 5–9 hits | +5 Essence |
| 10–19 hits | +15 Essence |
| 20–34 hits | +30 Essence |
| 35–49 hits | +50 Essence |
| 50+ hits | +80 Essence |

> Bonus appears as a gold float-up pop — same style as regular Essence pickup but larger and gold-coloured.

---

## Grade System

### How Grade Works

Each combo sequence is evaluated in real-time and assigned a letter grade based on **variety and execution**. The grade updates dynamically as the combo builds — it can rise but never drops within a sequence (except SS lock on hit taken).

Grade is displayed next to the combo counter on the HUD — large, bold, aura-coloured flash on each grade increase.

### Grade Criteria

| Grade | Criteria | Display colour |
|-------|----------|-----------------|
| **D** | Light attacks only, no variety | Grey |
| **C** | Mix of light + heavy attacks | White |
| **B** | Light + heavy + at least 1 spell cast in sequence | Green |
| **A** | Light + heavy + spell + dodge cancel + re-engage (within 0.8s) | Yellow |
| **S** | A criteria + status effect proc confirmed + weapon not swapped | Orange |
| **SS** | S criteria + zero hits taken during entire combo sequence | Red-gold (aura blaze) |

> Grade is evaluated cumulatively — once you hit B criteria, you are B-ranked or higher for that sequence. You cannot drop from B to C mid-combo.

### SS Lock Rule

- If the player takes **any damage** during a combo sequence, SS is permanently locked for that sequence
- The grade can still reach S (all other criteria met)
- SS lock is **silent** — no visual indicator. Players discover the rule through play.
- On sequence end: grade flashes its final value. SS sequences get a distinct aura burst effect.

### Grade Essence Bonus

Awarded on sequence end, **stacks with** combo length bonus:

| Grade | Essence bonus |
|-------|---------------|
| D | +0 |
| C | +5 |
| B | +10 |
| A | +20 |
| S | +35 |
| SS | +60 |

> Example: A 25-hit SS combo awards +30 (length) + 60 (grade) = **+90 Essence** total.

### Grade on End Screen

- **Highest grade achieved** during the run is shown on the end screen
- Displayed as a large letter grade with the hunter's aura colour
- SS is shown with a gold shimmer effect
- Label: `BEST COMBO GRADE`

---

## Surge System

### Overview

Surge is a personal power bar (0.0 – 1.0) that builds through combat actions. When full, it enables the hunter's Ultimate ability. It does not decay and persists across zone transitions (resets to 0 on zone **entry** only — see RUNSTATE.md).

### Surge Gain Values

| Action | Surge gained |
|--------|--------------|
| Light attack hit | +0.03 (3%) |
| Heavy attack hit | +0.06 (6%) |
| Spell hit (any enemy) | +0.05 (5%) |
| Kill (non-boss) | +0.08 (8%) |
| Kill (elite enemy) | +0.12 (12%) |
| Hit taken | +0.04 (4%) |
| Dodge through attack (i-frame success) | +0.03 (3%) |
| Status effect proc confirmed | +0.02 (2%) |
| Wave clear bonus | +0.10 (10%) |

> At average play: a full wave of ~8 enemies builds approximately 60–70% Surge. Boss phases are designed to push players to full Surge by Phase 2.

### Surge Fill Rate Reference

| Action count to full Surge (0→1.0) | Approximate scenario |
|-------------------------------------|---------------------|
| ~12 kills (non-boss) | Clean wave clear with no hits |
| ~7 kills + hits taken | Messy wave clear |
| Sustained spell use | Faster for Vesol/Sereisa builds |

### Surge Display

- Yellow bar in player status bars (see HUD.md)
- Ultimate spell slot icon shows radial fill as Surge builds
- At 100%: bar pulses, icon blazes, brief `SURGE READY` text flash (0.8s) in hunter aura colour
- In co-op: each player's Surge is their own — no shared bar

### Surge Usage

- Press **SPECIAL** (E / RB) when Surge bar is full to trigger Ultimate
- Surge drains to 0 immediately on activation — no partial use
- Ultimate plays to completion (armoured — see SPELLS.md)
- Surge bar greys out during Ultimate animation, refills from 0 after

### Surge Reset Rules

| Event | Surge behaviour |
|-------|----------------|
| Zone entry | Resets to 0 |
| Zone clear | Carries over to hub |
| Hub visit | Carries over unchanged |
| Wipe / death | Lost entirely (not kept with Essence) |
| Ultimate activation | Drains to 0 |

### Co-op Surge Notes

- Each player builds Surge from their own actions only
- No cross-player Surge sharing or transfer
- 4 players all hitting full Surge simultaneously is intended — 4 Ultimates in sequence is a power fantasy moment
- Co-op enemy HP scaling (+50% per additional player) means more hits required per kill, which naturally paces Surge build speed

---

## Combo × Surge Interaction

The two systems reinforce each other without being coupled:

- High combo = more hits = more Surge gain per sequence
- SS combo requires no hits taken = requires smart dodging = dodge-through gains Surge too
- A player chasing SS grade is also naturally building Surge efficiently
- Weapon swap resets combo but does **not** affect Surge

---

## End Screen Stats (from RunState)

| Stat | Source field | Notes |
|------|-------------|-------|
| Highest combo | `stats.highestCombo` | Peak hit count in one sequence |
| Best grade | Derived from combo log | Highest grade letter achieved |
| Total damage dealt | `stats.damageDealt` | All hits, spells, status ticks |
| Times SS achieved | Not in MVP RunState — Phase 5 addition | Post-MVP |

---

## Related Docs

| System | Doc |
|--------|-----|
| Surge bar HUD display | [HUD.md](./HUD.md) |
| Ultimate spell behaviour | [SPELLS.md](./SPELLS.md) |
| Surge reset on zone entry | [RUNSTATE.md](./RUNSTATE.md) |
| Grade display on end screen | [RUNSTATE.md](./RUNSTATE.md) |
| Status effects (for S grade proc) | [SPELLS.md](./SPELLS.md) |
