# HUNTIX — End Screen & Game Over Screen

> The run is over. Show them what they did.

*Last updated April 15, 2026*

---

## Two Screens

| Screen | Trigger | Tone |
|--------|---------|------|
| **Victory Screen** | Zone 4 boss defeated, `runComplete = true` | Triumphant — earned |
| **Game Over Screen** | All players wiped, `runWiped = true` | Respectful — not mocking |

Both share the same visual language and stat layout. The difference is the header, colour tone, and music.

---

## Visual Style

| Property | Value |
|----------|-------|
| Background | Full black. No hub, no zone — pure dark. |
| Layout | Centred single column for solo. 2×2 grid for co-op (one panel per player). |
| Font | Same monospace stack as HUD — `'Courier New', Courier, monospace` |
| Colour tone (Victory) | Hunter aura colour — gold shimmer on header |
| Colour tone (Game Over) | Deep red `#c0392b` header, otherwise same white-on-black |
| Entry animation | Fade in from black over 0.8s. Stats count up one by one (100ms between each). |
| HUNTIX logo | Appears top-centre, small — same as hub watermark. Always present. |

---

## Victory Screen Layout

```
┌─────────────────────────────────────────────────────────┐
│                   HUNTIX                           │
│                                                     │
│             GATE CLOSED                             │
│         ─────────────────────────────                │
│                                                     │
│   [Hunter name]          [Aura colour dot]          │
│   [Role — Element]                                  │
│                                                     │
│   RUN TIME          00:14:32                        │
│   ZONES CLEARED     4 / 4                           │
│   FINAL LEVEL       10                              │
│   UPGRADE PATH      MOBILITY                        │
│                                                     │
│   KILLS             ██████████ 142               │
│   DAMAGE DEALT      ████████░░ 84,320            │
│   DAMAGE TAKEN      ███░░░░░░░ 2,140             │
│   HIGHEST COMBO     ███████░░░ 38                │
│   BEST GRADE        SS  ⭐                          │
│   SPELLS CAST       ████░░░░░░ 47                │
│   TIMES DOWNED      0                               │
│                                                     │
│   ESSENCE REMAINING 🟠 340                           │
│                                                     │
│         [ RETURN TO HUB ]   [ QUIT ]               │
└─────────────────────────────────────────────────────────┘
```

### Victory Header
- Title: `GATE CLOSED` — in the world of Huntix, closing the gate is the mission
- Colour: Hunter aura colour, gold shimmer animation (slow pulse)
- Subtext (small, below header): `"The gate is closed. The hunt is complete."`

---

## Game Over Screen Layout

```
┌─────────────────────────────────────────────────────────┐
│                   HUNTIX                           │
│                                                     │
│             HUNTER DOWN                             │
│         ─────────────────────────────                │
│                                                     │
│   [Hunter name]          [Aura colour dot]          │
│   [Role — Element]                                  │
│                                                     │
│   RUN TIME          00:07:14                        │
│   ZONES CLEARED     2 / 4                           │
│   REACHED           Shadow Core — Wave 2            │
│   FINAL LEVEL       6                               │
│                                                     │
│   KILLS             ██████░░░░ 74                │
│   DAMAGE DEALT      ████░░░░░░ 41,200            │
│   DAMAGE TAKEN      ███████░░░ 6,800             │
│   HIGHEST COMBO     ███░░░░░░░ 18                │
│   BEST GRADE        B                               │
│                                                     │
│   ESSENCE KEPT      🟠 120  (50% of 240)             │
│                                                     │
│      [ TRY AGAIN ]         [ QUIT ]                 │
└─────────────────────────────────────────────────────────┘
```

### Game Over Header
- Title: `HUNTER DOWN` — respectful, not mocking
- Colour: Deep red `#c0392b`
- Subtext: `"The gate remains open. Return when you're ready."`
- Essence kept shown explicitly with the calculation: `(50% of [amount])`

---

## Stat Bar Visualisation

Stats with a bar use a 10-block progress bar relative to the run's own max value (not a global leaderboard). The bar shows performance relative to the best stat in that run.

```js
// Bar fill = stat / maxStatThisRun
// maxStatThisRun = highest value across all players in this run
barFill = Math.min(stat / maxStatThisRun, 1.0)
```

> In solo: bar always fills to 100% for the highest stat (kills bar always full). In co-op: bars compare across players — the player with the most kills has a full bar, others are relative.

---

## Grade Display

| Grade | Display |
|-------|--------|
| D | Grey `#888888`, small |
| C | White `#ffffff`, normal |
| B | Green `#2ecc71`, normal |
| A | Yellow `#f1c40f`, slightly larger |
| S | Orange `#e67e22`, large, brief scale pulse on reveal |
| SS | Red-gold gradient, large, gold shimmer animation, `⭐` icon beside it |

---

## Co-op Layout

In co-op, the screen splits into a **2×2 grid** (or 1×2 for 2 players). Each player gets their own panel with their stats. Layout:

```
┌───────────────────────────────┐
│  [ P1 panel ] [ P2 panel ]  │
│  [ P3 panel ] [ P4 panel ]  │
│                             │
│   RUN TIME    00:18:44      │
│   [ RETURN TO HUB ] [QUIT]  │
└───────────────────────────────┘
```

- Run time is shared (one timer for the whole run)
- Each panel shows that player's individual stats
- Eliminated players (co-op wipe) show their panel with a dim red border and `[ELIMINATED]` tag
- `RETURN TO HUB` returns all players together — one button, shared action

---

## Button Actions

| Button | Victory screen | Game Over screen |
|--------|---------------|------------------|
| Primary | `RETURN TO HUB` — new run from hub, Essence carries | `TRY AGAIN` — new run from hub, kept Essence carries |
| Secondary | `QUIT` — returns to character select / title | `QUIT` — same |
| Auto-advance | None — screen holds until input | None — screen holds until input |

> No auto-advance. Players should be able to screenshot their stats. The screen holds indefinitely.

---

## Transition Out

| Action | Transition |
|--------|------------|
| `RETURN TO HUB` / `TRY AGAIN` | Fade to black (0.5s) → hub scene loads → `initRunState()` called with kept Essence |
| `QUIT` | Fade to black (0.5s) → character select screen |

---

## Music

| Screen | Music |
|--------|-------|
| Victory | Slow, triumphant ambient — same electronic tone as hub but resolved, warmer |
| Game Over | Sparse, low ambient — minimal, respectful. Not dramatic. Not a fanfare of failure. |

---

## RunState Fields Used

| Stat shown | RunState field |
|------------|---------------|
| Run time | `runTimer` (formatted mm:ss) |
| Zones cleared | `zonesCleared` |
| Final level | `players[i].level` |
| Upgrade path | `players[i].upgradePath` |
| Kills | `players[i].stats.kills` |
| Damage dealt | `players[i].stats.damageDealt` |
| Damage taken | `players[i].stats.damageTaken` |
| Highest combo | `players[i].stats.highestCombo` |
| Best grade | Derived from combo log during run |
| Spells cast | `players[i].stats.spellsCast` |
| Times downed | `players[i].stats.timesDown` |
| Essence kept/remaining | `players[i].essence` |

---

## Related Docs

| System | Doc |
|--------|-----|
| Run state fields | [RUNSTATE.md](./RUNSTATE.md) |
| Essence keep calculation on wipe | [RUNSTATE.md](./RUNSTATE.md) |
| Grade system | [COMBOSYSTEM.md](./COMBOSYSTEM.md) |
| Hub scene on return | [HUB.md](./HUB.md) |
