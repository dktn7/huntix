# SPAWNPOINTS — Enemy Spawn Position Spec

*Last updated April 16, 2026*

---

## Overview

Spawn points are fixed positions per arena. Enemies enter from off-screen edges (left/right) or portal tear positions. Spawn positions are defined in world units relative to arena centre (0, 0). Z is fixed per lane.

---

## Arena Layout

Each zone arena is a horizontal stage:
- **Width:** 2400 world units (−1200 to +1200 on X)
- **Height:** 600 world units (−300 to +300 on Y — lane range)
- **Camera view:** 1280×720 world units centred on player group
- **Off-screen buffer:** 160 units beyond camera edge before enemies are visible

---

## Spawn Zones

| Zone ID | Position | Description |
|---|---|---|
| LEFT_EDGE | X: −1200, Y: −60 to +60 | Standard left-side entry |
| RIGHT_EDGE | X: +1200, Y: −60 to +60 | Standard right-side entry |
| LEFT_MID | X: −600, Y: −60 to +60 | Mid-left flanking spawn |
| RIGHT_MID | X: +600, Y: −60 to +60 | Mid-right flanking spawn |
| PORTAL_LEFT | X: −800, Y: 0 | Boss phase grunt reinforcements |
| PORTAL_RIGHT | X: +800, Y: 0 | Boss phase grunt reinforcements |
| AERIAL | X: random ±400, Y: +240 | Drop-in spawn (bruiser intro only) |

---

## Lane Assignments

3 horizontal lanes per arena:

| Lane | Y Position | Typical Occupant |
|---|---|---|
| Top | Y: +80 | Ranged units |
| Centre | Y: 0 | Bruisers, bosses |
| Bottom | Y: −80 | Grunts |

Enemies spawn at their lane Y position ±20 random jitter.

---

## Wave Spawn Rules

- Enemies spawn in **staggered bursts**: 2–3 enemies per 0.8s interval, never all at once.
- Minimum spawn gap between enemies at the same spawn zone: **0.4s**.
- If a spawn zone is occupied (enemy within 80px), delay next spawn at that zone by 0.6s.
- Grunt groups (3+) always split between LEFT_EDGE and RIGHT_EDGE to flank.

---

## Per-Wave Spawn Plans

### Wave 1 (Intro)
| t | Spawn Zone | Enemy Type | Count |
|---|---|---|---|
| 0.0s | LEFT_EDGE | Grunt | 2 |
| 0.8s | RIGHT_EDGE | Grunt | 2 |
| 2.0s | LEFT_MID | Ranged | 1 |

### Wave 2 (Escalation)
| t | Spawn Zone | Enemy Type | Count |
|---|---|---|---|
| 0.0s | LEFT_EDGE | Grunt | 3 |
| 0.4s | RIGHT_EDGE | Bruiser | 1 |
| 1.2s | RIGHT_MID | Ranged | 2 |
| 2.5s | LEFT_MID | Grunt | 2 |

### Wave 3 (Pre-Boss)
| t | Spawn Zone | Enemy Type | Count |
|---|---|---|---|
| 0.0s | LEFT_EDGE | Grunt | 2 |
| 0.0s | RIGHT_EDGE | Grunt | 2 |
| 0.8s | LEFT_MID | Bruiser | 1 |
| 1.6s | RIGHT_MID | Ranged | 2 |
| 3.0s | AERIAL | Bruiser | 1 |

---

## Boss Arena Spawns

During boss fights, Phase 2 and Phase 3 trigger grunt reinforcements from portal spawn zones.

| Boss Phase | Trigger | Spawn Zone | Enemy Type | Count |
|---|---|---|---|---|
| Phase 2 entry | Boss HP < 60% | PORTAL_LEFT | Grunt | 3 |
| Phase 2 entry | Boss HP < 60% | PORTAL_RIGHT | Grunt | 2 |
| Phase 3 entry | Boss HP < 25% | PORTAL_LEFT | Grunt | 2 |
| Phase 3 entry | Boss HP < 25% | PORTAL_RIGHT | Grunt | 2 |

Reinforcement grunts have 50% of normal HP to avoid overwhelming players.

---

## 4-Player Scaling

| Players | Extra Spawn Zones Active | Spawn Rate Multiplier |
|---|---|---|
| 1 | None | 1.0× |
| 2 | None | 1.0× |
| 3 | LEFT_MID active | 1.2× |
| 4 | LEFT_MID + RIGHT_MID active | 1.4× |

Spawn rate multiplier reduces the stagger interval (0.8s → 0.57s at 4P).

---

## Miniboss Spawn

- Gate Warden always spawns from centre of arena (X: 0, Y: 0).
- Entry animation: drops from above (Y: +400 → 0 over 0.8s).
- All regular enemies cleared before miniboss spawns.
- No reinforcements during miniboss fight.
