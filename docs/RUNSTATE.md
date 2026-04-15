# HUNTIX — Run State

> What the game tracks, what persists, what resets, and how zones connect.

*Last updated April 15, 2026*

---

## Overview

A run is a single attempt through all 4 zones starting from the Hunter Hub. Run state is the full data object that lives in memory from the moment a run begins until it ends (wipe or clear). It is passed between every scene transition — hub → zone → hub → zone — and is the single source of truth for all systems.

There is **no save system in MVP**. Run state is in-memory only. Closing or refreshing the browser ends the run.

---

## Run State Schema

The full run state object. Every system that needs player data reads from here.

```js
RunState = {

  // ─── Meta ───────────────────────────────────────────────
  runId:            String,   // Unique ID for this run (timestamp-based)
  runTimer:         Number,   // Elapsed seconds since run start (counts up)
  zonesCleared:     Number,   // 0–4
  currentZone:      String,   // 'hub' | 'city-breach' | 'ruin-den' | 'shadow-core' | 'thunder-spire'

  // ─── Per-player (array, index = player slot 0–3) ────────
  players: [
    {
      // Identity
      hunterId:         String,   // 'dabik' | 'benzu' | 'sereisa' | 'vesol'
      playerIndex:      Number,   // 0–3
      isAI:             Boolean,  // true if AI companion filling slot

      // Resources
      hp:               Number,   // Current HP (carries between zones, +30 on zone clear)
      hpMax:            Number,   // Max HP (base + any Iron Skin purchases)
      mana:             Number,   // Current mana
      manaMax:          Number,   // Max mana (base + any Mana Shard purchases)
      surge:            Number,   // Current surge (0.0–1.0, resets to 0 on zone entry)

      // Progression
      xp:               Number,   // Current XP total this run
      level:            Number,   // Current level (1–10)
      upgradePath:      String | null,  // null until L7 lock — 'power' | 'survival' | 'mobility' | 'style'

      // Spell state
      minorSpellId:     String,   // e.g. 'shadow-step'
      advancedSpellId:  String | null,  // null until L3
      ultimateSpellId:  String | null,  // null until L9
      minorMod:         String | null,  // Card chosen at L4 — e.g. 'double-blink'
      advancedMod:      String | null,  // Card chosen at L6

      // Weapons
      slot1WeaponId:    String,   // Signature — never changes
      slot2WeaponId:    String | null,  // null until shop purchase
      activeSlot:       Number,   // 0 = slot1, 1 = slot2

      // Economy
      essence:          Number,   // Current Essence balance

      // Shop tracking
      shopBuysThisVisit: Number,  // Resets to 0 on each hub entry. Max 2.

      // Run stats (for end screen)
      stats: {
        kills:          Number,
        damageDealt:    Number,
        damageTaken:    Number,
        spellsCast:     Number,
        highestCombo:   Number,
        timesDown:      Number,   // Co-op: times entered downed state
      },

      // Death state (co-op only)
      isDown:           Boolean,  // true = downed, awaiting revive
      downTimer:        Number,   // Countdown from 8.0s — 0 = full wipe
    }
  ],

  // ─── Run-level flags ────────────────────────────────────
  isCoOp:           Boolean,  // true if 2+ human players
  runComplete:      Boolean,  // true when Zone 4 boss defeated
  runWiped:         Boolean,  // true when all players are eliminated

  // ─── Card state ─────────────────────────────────────────
  pendingCardPick:  Boolean,  // true when level-up card screen is waiting for input
  cardLevel:        Number,   // Which level triggered the current card pick
}
```

---

## What Resets vs Persists

### On Zone Entry (hub → zone)

| Field | Behaviour |
|-------|-----------|
| `hp` | Carries over exactly from last zone exit |
| `mana` | Resets to `manaMax` |
| `surge` | Resets to 0 |
| `shopBuysThisVisit` | Resets to 0 |
| `xp`, `level`, spells, weapons, `essence` | All carry over unchanged |
| `isDown`, `downTimer` | Resets to false / 0 |

### On Zone Clear (boss defeated)

| Event | Effect |
|-------|--------|
| HP restore | Each player gains +30 HP (capped at `hpMax`) |
| Essence drop | Boss Essence drops added to each player's balance |
| Zone clear bonus | +100 Essence per player |
| No-damage wave bonus | +50 Essence per player (if applicable) |
| `zonesCleared` | Increments by 1 |
| Scene transition | After 2s delay → fade to hub |

### On Hub Entry (between zones)

| Field | Behaviour |
|-------|-----------|
| `shopBuysThisVisit` | Resets to 0 (fresh shop visit) |
| `currentZone` | Set to `'hub'` |
| All other fields | Unchanged |

### On Full Run Clear (Zone 4 boss defeated)

| Field | Behaviour |
|-------|-----------|
| `runComplete` | Set to true |
| `runTimer` | Stops |
| Scene | → End screen (see below) |

---

## Wipe & Death Rules

### Solo Mode

1. Player HP reaches 0
2. Death animation plays (0.5s)
3. Screen fades to black (0.8s)
4. **Game Over screen** shown:
   - Run timer
   - Zones cleared
   - Kill count
   - Highest combo
   - Essence kept (50% of balance at time of wipe, floored to nearest integer)
5. Player returns to Hub with kept Essence
6. All other run state resets — XP, level, spells, weapons, HP back to base

### Co-op Mode

**Downed state:**
1. Player HP reaches 0 → enters `isDown = true`
2. `downTimer` starts counting down from 8.0s
3. Downed player cannot move or act
4. Any teammate within 2m can hold **F / A button** for 1.5s to revive
5. On revive: player returns with 30% of `hpMax`, `isDown = false`, `downTimer = 0`
6. If `downTimer` reaches 0 with no revive → player is eliminated for the rest of the zone

**Full wipe (co-op):**
- Triggers when ALL players are either eliminated or downed simultaneously with no active revivers
- Same Game Over screen as solo, same 50% Essence keep rule
- Each player keeps their own 50% independently

### Essence on Wipe — Exact Calculation

```js
essenceKept = Math.floor(player.essence * 0.5)
```

Applied at the moment of wipe. Carried into the next run as starting Essence.

---

## Zone Transition Flow

```
Hub
  → Player selects portal
  → Fade out (0.5s)
  → Zone scene loads
  → RunState: currentZone updated, mana reset, surge reset
  → Fade in (0.5s)
  → Combat begins

Zone boss defeated
  → Boss death animation
  → Essence drops spawn
  → Zone clear banner (1.5s)
  → HP restore (+30, capped)
  → Fade out (0.8s)
  → Hub scene loads
  → RunState: zonesCleared++, shopBuysThisVisit reset
  → Fade in (0.5s)
  → Hub resumes — shop refreshed, portal for next zone unlocked

Zone 4 boss defeated
  → Same flow as above but:
  → runComplete = true
  → runTimer stops
  → Fade to End Screen instead of Hub
```

---

## End Screen

Shown on full run clear. Displays per-player:

| Stat | Source |
|------|--------|
| Total run time | `runTimer` formatted as mm:ss |
| Zones cleared | `zonesCleared` (always 4 on clear) |
| Hunter played | `hunterId` |
| Final level | `level` |
| Upgrade path | `upgradePath` |
| Spell modifications | `minorMod`, `advancedMod` |
| Kills | `stats.kills` |
| Damage dealt | `stats.damageDealt` |
| Highest combo | `stats.highestCombo` |
| Times downed | `stats.timesDown` (co-op) |
| Essence remaining | `essence` |

> No persistent leaderboard in MVP. End screen is cosmetic — a satisfying summary of the run. Post-MVP: online leaderboard by run time.

---

## XP & Level-Up Flow

```
XP event fires (kill, combo bonus, etc.)
  → RunState.players[i].xp += amount
  → Check against threshold for next level (see PROGRESSION.md)
  → If threshold crossed:
      → level++
      → pendingCardPick = true
      → cardLevel = level
      → Game pauses (combat freezes)
      → Card screen shown (see HUB.md when written)
      → Player picks card
      → pendingCardPick = false
      → Combat resumes
```

> In co-op: each player levels independently. Card screen pauses only for the player levelling up — other players continue fighting. If 2 players level simultaneously, card screens queue (player 0 first, then player 1).

---

## Run State Initialisation

Called when a new run begins (character selected, first portal entered).

```js
function initRunState(playerConfigs) {
  return {
    runId: Date.now().toString(),
    runTimer: 0,
    zonesCleared: 0,
    currentZone: 'hub',
    isCoOp: playerConfigs.filter(p => !p.isAI).length > 1,
    runComplete: false,
    runWiped: false,
    pendingCardPick: false,
    cardLevel: null,
    players: playerConfigs.map((config, i) => ({
      hunterId: config.hunterId,
      playerIndex: i,
      isAI: config.isAI,
      hp: HUNTER_BASE_STATS[config.hunterId].hp,
      hpMax: HUNTER_BASE_STATS[config.hunterId].hp,
      mana: HUNTER_BASE_STATS[config.hunterId].mana,
      manaMax: HUNTER_BASE_STATS[config.hunterId].mana,
      surge: 0,
      xp: 0,
      level: 1,
      upgradePath: null,
      minorSpellId: HUNTER_BASE_STATS[config.hunterId].minorSpell,
      advancedSpellId: null,
      ultimateSpellId: null,
      minorMod: null,
      advancedMod: null,
      slot1WeaponId: HUNTER_BASE_STATS[config.hunterId].signature,
      slot2WeaponId: null,
      activeSlot: 0,
      essence: config.carryEssence || 0,
      shopBuysThisVisit: 0,
      stats: { kills: 0, damageDealt: 0, damageTaken: 0, spellsCast: 0, highestCombo: 0, timesDown: 0 },
      isDown: false,
      downTimer: 0,
    }))
  }
}
```

> `config.carryEssence` is the 50% kept from a previous wipe. 0 on a fresh run.

---

## Related Docs

| System | Doc |
|--------|-----|
| XP thresholds & level card contents | [PROGRESSION.md](./PROGRESSION.md) |
| Spell unlock & modification values | [SPELLS.md](./SPELLS.md) |
| Weapon slot behaviour | [WEAPONS.md](./WEAPONS.md) |
| Hub scene layout & shop UI | HUB.md (pending) |
| HUD elements displaying run state | [HUD.md](./HUD.md) |
