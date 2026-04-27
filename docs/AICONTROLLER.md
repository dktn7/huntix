# AICONTROLLER — Enemy & Companion AI Spec

*Last updated April 16, 2026*

---

## Overview

All enemy and AI companion logic runs on the X/Y plane only. Z-axis is visual depth — AI never navigates in Z. The controller is a simple state machine per entity, ticked in the main game loop. No external pathfinding library is required for MVP; lane-based heuristics are sufficient.

---

## State Machine

Every enemy runs the same state machine. Bosses extend it with phase-specific overrides.

```
IDLE → PATROL → AGGRO → TELEGRAPH → ATTACK → RECOVER → STAGGER → AGGRO
                                                      ↘ DEAD
```

| State | Description | Exit Condition |
|---|---|---|
| **IDLE** | Stationary, plays idle anim | Player enters aggro range |
| **PATROL** | Moves left/right in lane, loops | Player enters aggro range |
| **AGGRO** | Moves toward target on X axis | Within attack range |
| **TELEGRAPH** | Pre-attack wind-up animation | Telegraph timer expires |
| **ATTACK** | Executes attack hitbox | Attack animation completes |
| **RECOVER** | Post-attack cooldown | Recovery timer expires |
| **STAGGER** | Hit-stun, brief knockback | Stagger timer expires |
| **DEAD** | Death animation, loot drop | Animation completes |

---

## Aggro Ranges (per enemy type)

| Enemy | Aggro Range (X) | Attack Range (X) | De-aggro Range |
|---|---|---|---|
| Grunt | 400px | 80px | 600px |
| Ranged | 500px | 300px | 700px |
| Bruiser | 250px | 100px | 450px |
| Boss | Full arena | Phase-dependent | Never |

All ranges are measured in world units on the X axis. Y tolerance is ±60px (lane width).

---

## Target Selection (1–4 Players)

In multiplayer, enemies must pick a target each aggro cycle (re-evaluated every 1.5s).

| Priority | Rule |
|---|---|
| 1 | Nearest player on X axis within aggro range |
| 2 | Player who last dealt damage to this enemy |
| 3 | Lowest HP player if tie on distance |
| 4 | Random if all else equal |

- Grunts and bruisers: always pick one target and commit until de-aggro or death.
- Ranged units: re-evaluate every 0.8s and strafe to maintain distance.
- Boss: splits target attention by phase — Phase 1 targets nearest, Phase 2 targets random, Phase 3 targets all simultaneously via AoE.

---

## Lane Pathing

Movement is constrained to horizontal lanes on the X axis. No Z navigation.

- Enemies spawn at the edge of the arena and walk toward players.
- Multiple enemies spread across available Y lanes (up to 3 lanes per arena).
- Bruisers occupy the center lane; grunts fill flanks.
- Ranged units hold back 50–100px from their aggro edge and strafe ±40px.
- Enemies do not stack — a 60px minimum separation is enforced on X.

---

## Boss AI Phases

Each boss has 3 phases triggered by HP thresholds. See individual boss files for specific move sets.

| Phase | HP Threshold | Behaviour Change |
|---|---|---|
| Phase 1 | 100%–60% | Standard attack patterns, telegraphed |
| Phase 2 | 60%–25% | Faster attacks, new move unlocked, spawn grunts |
| Phase 3 | 25%–0% | Enrage — all attacks faster, AoE added, no patrol |

Phase transitions always trigger:
1. Brief pause (0.5s)
2. Visual flash / aura burst
3. Roar SFX
4. Phase-specific music layer activates

---

## AI Companion (Solo Fill)

When a player slot is empty, an optional AI companion fills it.

- Controlled by the same state machine as enemies, but targeting enemies instead.
- Follows the human player within 200px on X.
- Uses only Light Attack — no spells, no dodge.
- Has the same HP/stats as the equivalent hunter at current level.
- Does not collect Essence or XP — those go to the human player.
- Dies like a player: knocked out, needs revive prompt (or auto-revives between zones in solo).

---

## Implementation Notes

- State machine ticked in `GameLoop.update()` after physics, before rendering.
- Each enemy instance owns its own controller — no shared state.
- Re-use the same controller class for all enemy types; override `attackRange` and `aggroRange` via the stat block (see `STATBLOCK.md`).
- Boss controllers extend `EnemyAIController` with `phaseCheck()` called each tick.
- AI companion uses `CompanionAIController` — subclass with inverted target logic.
