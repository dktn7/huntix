# UPGRADEPATH — Upgrade Tree Spec

*Last updated April 16, 2026*

---

## Overview

Four upgrade paths are available: Power, Survival, Mobility, Style. The path **locks at Level 7** — the shop stops offering cross-path items. Levels 4 and 6 offer path modifiers. Level 10 delivers a capstone unique to path + hunter combination.

See PROGRESSION.md for XP thresholds and the full level structure.

---

## Path Summary

| Path | Identity | Best For |
|---|---|---|
| ⚔️ **Power** | Max damage, longer combos, execute | Dabik, Vesol |
| 🛡 **Survival** | Sustain, tank, lifesteal, second wind | Benzu |
| 💨 **Mobility** | Speed, dodge, i-frames, repositioning | Sereisa, Dabik |
| ✨ **Style** | Synergies, spell efficiency, aura, crit | Any hunter |

---

## ⚔️ Power Path

| Level | Upgrade | Description |
|---|---|---|
| L4 | **Sharpened Edge** | +20% Light Attack damage |
| L6 | **Breaker** | Heavy attacks ignore 30% of enemy stagger threshold |
| L7 | *Path locks* | Shop now only shows Power items |
| L8 | **Relentless** | Combo meter never resets on miss, only on dodge |
| L9 | **Status Amp** | All applied status effects deal +25% tick damage |
| L10 | **Execute** | Kills enemies below 15% HP instantly. Boss execute threshold: 5%. |

### Hunter Variants
- **Dabik Power L10:** Shadow Execute — execute leaves a Bleed pool on ground for 3s
- **Benzu Power L10:** Thunder Finish — execute triggers lightning AoE (120px radius)
- **Sereisa Power L10:** Storm Execute — execute generates a Surge burst (+40 Surge)
- **Vesol Power L10:** Flame Consume — execute triggers Burn explosion (160px AoE)

---

## 🛡 Survival Path

| Level | Upgrade | Description |
|---|---|---|
| L4 | **Iron Skin** | +200 max HP |
| L6 | **Lifesteal** | Light attacks restore 4% of damage dealt as HP |
| L7 | *Path locks* | Shop now only shows Survival items |
| L8 | **Fortify** | Taking damage above 25% of max HP in one hit triggers a 0.5s damage reduction shield (50% DR) |
| L9 | **Endurance** | HP regen: 5 HP/sec in combat |
| L10 | **Last Stand** | Once per zone: survive a lethal hit at 1 HP. Triggers 2s of full invincibility. |

### Hunter Variants
- **Dabik Survival L10:** Shadow Shroud — Last Stand also applies Bleed to all nearby enemies (200px)
- **Benzu Survival L10:** Unbreakable — Last Stand also stuns nearby enemies (150px, 1.5s)
- **Sereisa Survival L10:** Blink Escape — Last Stand also triggers a free full-distance dodge
- **Vesol Survival L10:** Flame Barrier — Last Stand creates a Burn ring (120px, 4s duration)

---

## 💨 Mobility Path

| Level | Upgrade | Description |
|---|---|---|
| L4 | **Swift Step** | +50 movement speed |
| L6 | **Double Dodge** | +1 dodge charge (max 2 simultaneous) |
| L7 | *Path locks* | Shop now only shows Mobility items |
| L8 | **Ghost Frame** | Dodge grants 4 additional I-frames |
| L9 | **Slipstream** | After a dodge, movement speed +40% for 1.5s |
| L10 | **Phase** | Dodge passes through enemies. On exit, deal 30 damage to all passed-through enemies. |

### Hunter Variants
- **Dabik Mobility L10:** Shadow Phase — passing through applies Bleed (100% chance)
- **Benzu Mobility L10:** Thunder Rush — passing through applies Stun (100% chance, 0.8s)
- **Sereisa Mobility L10:** Storm Phase — passing through applies Slow (100% chance) + leaves lightning trail
- **Vesol Mobility L10:** Flame Trail — passing through leaves Burn ground for 2s

---

## ✨ Style Path

| Level | Upgrade | Description |
|---|---|---|
| L4 | **Resonance** | Status effect synergies deal +30% bonus damage |
| L6 | **Silent Cast** | All spell Mana costs −20% |
| L7 | *Path locks* | Shop now only shows Style items |
| L8 | **Crit Weave** | Every 5th hit in a combo is a guaranteed critical (+80% damage) |
| L9 | **Aura Surge** | Aura radius +50%. Enemies inside aura range take +10% damage from all sources. |
| L10 | **Transcend** | For 8 seconds: unlimited Mana, all attacks apply all status effects, synergies trigger on every hit. Cooldown: once per zone. |

### Hunter Variants
- **Dabik Style L10:** Shade Form — Transcend also makes Dabik invisible to enemies for its duration
- **Benzu Style L10:** Thunder God — Transcend also creates a persistent lightning storm (full arena, 8s)
- **Sereisa Style L10:** Storm Eye — Transcend also freezes all enemies in place for 2s at activation
- **Vesol Style L10:** Inferno — Transcend also creates Burn pools everywhere enemies step

---

## Shop UI Text (path-locked items)

When path is locked at L7, shop items display a path badge:
- ⚔️ Power item
- 🛡 Survival item
- 💨 Mobility item
- ✨ Style item

Items from other paths are hidden entirely from the shop after lock.

---

## Co-op Path Synergies

| Path Combo | Bonus |
|---|---|
| Power + Style | Crit hits also apply a random status effect |
| Survival + Mobility | Dodge restores 30 HP |
| Mobility + Style | Slipstream also increases Surge gain rate by 50% |
| Power + Survival | Execute threshold raised to 20% (normal enemies) |
