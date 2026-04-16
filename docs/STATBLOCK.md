# STATBLOCK — Canonical Stat Tables

*Last updated April 16, 2026*

---

## Overview

This is the single source of truth for all numeric stats. When a value appears here it overrides any number in other docs. All values are at **Level 1 / base state** unless noted. Co-op scaling multipliers are listed separately.

---

## Hunters

| Hunter | HP | Mana | Speed | Light Dmg | Heavy Dmg | Stagger Threshold | Dodge I-frames |
|---|---|---|---|---|---|---|---|
| Dabik | 900 | 120 | 320 | 18 | 42 | 3 hits | 12 frames |
| Benzu | 1400 | 80 | 240 | 22 | 65 | 5 hits | 8 frames |
| Sereisa | 750 | 160 | 380 | 14 | 30 | 2 hits | 16 frames |
| Vesol | 800 | 200 | 280 | 12 | 28 | 2 hits | 10 frames |

- **Surge bar:** 100 units for all hunters. Fills at 1 unit per kill, 0.5 per hit taken, 2 per hit streak (5+).
- **Mana regen:** 3 units/sec passive. +5 per light attack landed.
- **HP regen:** None in combat. Potions only (see ESSENCEECONOMY.md).

---

## Enemies

| Enemy | HP | Speed | Light Dmg | Heavy Dmg | Stagger Threshold | XP Drop | Essence Drop |
|---|---|---|---|---|---|---|---|
| Grunt | 120 | 180 | 12 | — | 2 hits | 15 | 5–15 |
| Ranged | 80 | 140 | — | — | 1 hit | 18 | 10–20 |
| Bruiser | 420 | 100 | 28 | 55 | 5 hits | 40 | 25–40 |

- Ranged unit damage is projectile-based: 12 per bolt (see PROJECTILES.md).
- Bruiser heavy = rock throw arc projectile: 30 damage.
- Stagger threshold = number of hits before stagger state triggers.

---

## Mini-Boss — Gate Warden

| Stat | Value |
|---|---|
| HP | 1800 |
| Speed | 160 |
| Light Dmg | 35 |
| Heavy Dmg | 80 |
| Stagger Threshold | 8 hits |
| XP Drop | 200 |
| Essence Drop | 80–120 |
| Status Immunity | Stun |

---

## Bosses

| Boss | Zone | HP | Speed | P1 Dmg | P2 Dmg | P3 Dmg | Essence Drop | XP Drop |
|---|---|---|---|---|---|---|---|---|
| VRAEL | City Breach | 4000 | 140 | 40 | 55 | 70 | 200–300 | 500 |
| ZARTH | Ruin Den | 5000 | 110 | 50 | 65 | 85 | 250–350 | 600 |
| KIBAD | Shadow Core | 4500 | 180 | 38 | 52 | 75 | 275–375 | 650 |
| THYXIS | Thunder Spire | 6000 | 130 | 55 | 75 | 100 | 300–400 | 800 |

### Boss Status Immunities

| Boss | Immune To | Resistant To |
|---|---|---|
| VRAEL | Burn | — |
| ZARTH | Stun | Slow |
| KIBAD | Bleed | Stun |
| THYXIS | Slow | Burn |

---

## Co-op HP Scaling

Enemy and boss HP scales with active player count to maintain challenge.

| Players | Enemy HP Multiplier | Boss HP Multiplier |
|---|---|---|
| 1 | 1.0× | 1.0× |
| 2 | 1.5× | 1.6× |
| 3 | 1.9× | 2.1× |
| 4 | 2.2× | 2.5× |

- Damage output does **not** scale — more players = more DPS naturally.
- Essence and XP drops do **not** scale — shared among players who hit the enemy.

---

## Level Scaling (Hunter Stats Per Level)

Base stats grow each level. Multipliers are cumulative from Level 1.

| Level | HP Multiplier | Damage Multiplier | Speed Bonus |
|---|---|---|---|
| 1 | 1.00× | 1.00× | +0 |
| 2 | 1.12× | 1.10× | +0 |
| 3 | 1.25× | 1.22× | +10 |
| 4 | 1.40× | 1.35× | +10 |
| 5 | 1.58× | 1.50× | +15 |
| 6 | 1.78× | 1.68× | +15 |
| 7 | 2.00× | 1.88× | +20 |
| 8 | 2.25× | 2.10× | +20 |
| 9 | 2.55× | 2.35× | +25 |
| 10 | 2.90× | 2.65× | +25 |

---

## Projectile Offset Reference

| Entity | Offset X | Offset Y |
|---|---|---|
| Dabik | 0 | +40 |
| Sereisa | ±30 | +30 |
| Vesol | 0 | +50 |
| Ranged Grunt | ±20 | +20 |
| Bruiser | ±35 | +60 |

Positive X = right-facing. Mirror on left-facing.
