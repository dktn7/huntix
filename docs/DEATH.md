# HUNTIX — Death & Downed System

> Death is not the end. Being downed is a moment. A wipe is a statement.

*Last updated April 15, 2026*

---

## Overview

Huntix uses two death models depending on player count:

| Mode | Model |
|------|-------|
| Solo | HP → 0 = instant game over. No second chance. |
| Co-op | HP → 0 = DOWNED state. Teammates can revive. Full wipe only when all are down simultaneously. |

---

## Solo Death

### Flow

```
HP reaches 0
  → DEAD state triggers
  → Death animation plays (0.5s)
     — hunter collapses, aura flickers out
     — camera slow zooms in slightly (0.8× over 0.5s)
  → Screen fades to black (0.8s)
  → HUNTER DOWN screen shown
  → 50% Essence kept (Math.floor(essence * 0.5))
  → All other run state resets
  → Player returns to hub with kept Essence
```

### What Resets on Solo Death

| Field | On death |
|-------|----------|
| HP | Resets to base |
| Mana | Resets to base |
| Surge | Resets to 0 |
| XP / Level | Resets to 1 |
| Spells | Resets to Minor only |
| Weapon slot 2 | Cleared |
| Essence | 50% kept, rest lost |
| Stats (kills, combo, etc.) | Shown on end screen, then discarded |

---

## Co-op Downed State

### Trigger

- Player HP reaches 0
- `isDown = true`, `downTimer = 8.0`
- Player enters DOWNED animation state (see ANIMATIONS.md)

### While Downed

| Property | Value |
|----------|-------|
| Can move | No |
| Can attack | No |
| Can use spells | No |
| Can be hit | Yes — but takes no additional damage (already at 0 HP) |
| Aura | Dim pulse — 50% opacity, slow throb |
| HUD | Red pulsing border, countdown replaces HP bar |
| Timer | 8.0s countdown. Visible to all players. |

### Revive

| Property | Value |
|----------|-------|
| Who can revive | Any active (not downed) teammate |
| Proximity required | Within 2.0 world units |
| Input | Hold F (keyboard) / Hold A button (gamepad) |
| Hold duration | 1.5s continuous — interrupted if player moves or takes a hit |
| Revive HP | 30% of `hpMax` |
| Revive visual | Brief white flash on revived hunter, aura rekindles from dim to full |
| Revive particle | 12 aura-coloured sparks burst upward from revived hunter |
| Reviver Surge | +10% Surge bonus for successful revive |
| In-world prompt | `[Hold F to revive]` above downed hunter, visible only to nearby players |

### Down Timer Expiry

- `downTimer` reaches 0 with no revive
- Player is **eliminated** for the rest of the zone
- `isDown` stays true but timer stops — player is spectating
- Slot remains in RunState but `hp = 0`, `isDown = true`, revive no longer possible
- Re-enters at start of next zone with 50% HP restore (zone entry rules)

> Eliminated players are not truly dead — they return at the next zone. This prevents a single death from removing a player for the entire run.

---

## Full Wipe

### Trigger Conditions

| Condition | Result |
|-----------|--------|
| Solo: HP = 0 | Immediate wipe |
| Co-op: all players downed simultaneously | Wipe — no active revivers |
| Co-op: all players eliminated (all timers expired) | Wipe at next zone entry attempt |

### Wipe Flow

```
Wipe condition met
  → runWiped = true
  → runTimer stops
  → All enemies freeze (0.5s)
  • Brief silence
  → Screen fades to black (1.0s)
  → HUNTER DOWN end screen shown
  → Essence keep calculated per player: Math.floor(essence * 0.5)
  → Run state resets except kept Essence
```

### Enemy Freeze on Wipe

- All enemies pause for 0.5s on wipe trigger
- Visual: enemies slow-mo freeze mid-animation
- Audio: combat SFX fades out, brief silence before screen fade
- Creates a cinematic "moment of failure" rather than an abrupt cut

---

## Death Animations

### Hunter Death (Solo)

| Frame | Action |
|-------|--------|
| 1–6 | Staggers back 0.5 units |
| 7–12 | Knees buckle, starts to fall |
| 13–20 | Collapses to ground |
| 21–30 | Aura flickers out (opacity 1.0 → 0.0) |
| 31+ | Fade to black begins |

### Hunter Downed (Co-op)

See ANIMATIONS.md — `DOWNED` state. Hunter falls to one knee, one hand on ground. Aura dims to 50% pulse. Does not fully collapse — they are down but fighting.

### Hunter Revived

| Frame | Action |
|-------|--------|
| 1–8 | Rising from downed pose |
| 9–12 | White flash on full stand |
| 13–18 | Aura rekindles — sparks burst upward |
| 19+ | Returns to IDLE state, combat resumes |

---

## Essence Keep Rule

```js
// Applied at moment of wipe, before run state reset
essenceKept = Math.floor(player.essence * 0.5)

// Carried into next run
newRunState.players[i].essence = essenceKept
```

> 50% is kept regardless of how far through the run the wipe occurred. Zone 1 wipe and Zone 4 wipe both follow the same rule. No penalty multiplier for early wipes.

---

## Related Docs

| System | Doc |
|--------|-----|
| Run state schema | [RUNSTATE.md](./RUNSTATE.md) |
| Downed HUD display | [HUD.md](./HUD.md) |
| Downed animation states | [ANIMATIONS.md](./ANIMATIONS.md) |
| End screen on wipe | [ENDSCREEN.md](./ENDSCREEN.md) |
| Essence economy | [PROGRESSION.md](./PROGRESSION.md) |
