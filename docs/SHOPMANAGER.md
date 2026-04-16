# SHOPMANAGER.md — Shop UI, Item Weighting & Path-Lock Rules

> **Source of truth for everything the shop does: what it shows, how items are weighted, how the upgrade path filter works, and the full purchase flow.**

*Last updated April 16, 2026*

---

## Overview

The shop lives in the **Hunter Hub** between zones. It presents 5 random items from the item pool each visit. Players can buy up to 2 items per visit and spend Essence to reroll the selection.

See `docs/PROGRESSION.md` for level unlock rules and `docs/ESSENCEECONOMY.md` for Essence drop values.

---

## Shop Rules (Canonical)

| Rule | Value | Source |
|------|-------|--------|
| Items shown per visit | 5 (random) | `docs/PROGRESSION.md` |
| Max purchases per visit | 2 | `docs/PROGRESSION.md` |
| Reroll cost | 30 Essence | `docs/PROGRESSION.md` |
| Rerolls per visit | Unlimited (while Essence allows) | `docs/PROGRESSION.md` |
| Items refresh between zones | Yes — full new pool each visit | — |

---

## Item Categories

| Category | Icon | Examples | Weight |
|----------|------|----------|---------|
| Power | ⚔️ | Damage boost, combo extender, special power upgrade | 25% |
| Survival | 🛡 | Health restore, armour shard, recovery speed | 25% |
| Mobility | 💨 | Dodge distance, speed boost, cooldown reduction | 20% |
| Utility | 🔧 | Mana regen boost, reroll token, essence magnet | 15% |
| Cosmetic | 🎨 | Aura colour, weapon skin, trail effect | 15% |

> Weights are **base weights before path-lock modifier is applied** (see below).

---

## Item Weighting Algorithm

```
1. Build full item pool (all unlocked items for current zone tier)
2. Apply path-lock weight multiplier if player has chosen an upgrade path
3. Flatten into weighted list
4. Draw 5 without replacement
5. Guarantee: at least 1 non-cosmetic item per draw
```

### Path-Lock Weight Multiplier

Once a player chooses an upgrade path at L3 (Power / Survival / Mobility / Style), items matching that path have their weight multiplied:

| Path chosen | Matching category weight multiplier |
|-------------|-------------------------------------|
| ⚔️ Power | Power items ×2.5 |
| 🛡 Survival | Survival items ×2.5 |
| 💨 Mobility | Mobility items ×2.5 |
| ✨ Style | Cosmetic items ×3.0 |

Other categories retain their base weight. This means the chosen path's items appear roughly 2–3× more often without completely eliminating other categories.

### Zone Tier Unlock

Items are gated by zone progress. Stronger items only appear in the pool from zone 2+:

| Tier | Unlocked from | Examples |
|------|---------------|---------|
| 1 | Zone 1 (always available) | Basic stat boosts, minor heals |
| 2 | Zone 2+ | Combo extenders, dodge upgrades |
| 3 | Zone 3+ | Aura upgrades, damage multipliers |
| 4 | Zone 4 only | Endgame power items, full cosmetics |

---

## Purchase Flow

```
Player enters Hub
  → ShopManager.init(zoneIndex, playerLevel, chosenPath)
    → buildPool(zoneIndex)
    → applyPathWeights(chosenPath)
    → drawFive()
    → renderShopUI(items[5])

Player selects item
  → checkCanPurchase(player.essence, item.cost, purchasesThisVisit)
  → if valid: deductEssence() + applyItem() + markSlotPurchased()
  → if purchasesThisVisit >= 2: grey out remaining slots

Player rerolls
  → checkEssence(30)
  → deductEssence(30)
  → drawFive() (new draw, same pool minus already-purchased items)
  → re-renderShopUI()

Player leaves Hub
  → ShopManager.reset()
  → purchasesThisVisit = 0
```

---

## Shop UI Layout

```
┌─────────────────────────────────────────────────────┐
│  HUNTER HUB — SHOP                    [Essence: 240] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐ │
│  │ Item │  │ Item │  │ Item │  │ Item │  │ Item │ │
│  │  1   │  │  2   │  │  3   │  │  4   │  │  5   │ │
│  │      │  │      │  │      │  │      │  │      │ │
│  │ 50💠 │  │ 80💠 │  │120💠 │  │ 40💠 │  │ 30💠 │ │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘ │
│                                                     │
│  Purchases remaining: 2/2        [🔄 Reroll — 30💠] │
└─────────────────────────────────────────────────────┘
```

- Each item card shows: icon, name, short description, Essence cost
- Purchased slots show a ✅ overlay and are unclickable
- When 2 purchases made: all unpurchased slots greyed out, Reroll button still active
- Reroll button disabled if player has < 30 Essence
- Essence display updates live on every purchase/reroll

---

## Item Cost Ranges

| Tier | Cost range |
|------|------------|
| 1 | 20–50 Essence |
| 2 | 50–100 Essence |
| 3 | 100–180 Essence |
| 4 | 180–300 Essence |

---

## ShopManager.js — Key Methods

```js
ShopManager.init(zoneIndex, playerLevel, chosenPath)
// Called when player enters hub. Builds pool, draws 5, renders UI.

ShopManager.purchase(itemId, player)
// Validates, deducts Essence, applies item effect, updates UI.

ShopManager.reroll(player)
// Validates 30 Essence, draws new 5 (minus purchased), re-renders.

ShopManager.reset()
// Called on hub exit. Resets purchasesThisVisit = 0.

ShopManager.buildPool(zoneIndex)
// Returns weighted item array filtered to zoneIndex tier.

ShopManager.drawFive(pool)
// Weighted draw without replacement. Guarantees 1 non-cosmetic.
```

---

## Related Docs

- `docs/PROGRESSION.md` — XP levels, shop unlock rules
- `docs/ESSENCEECONOMY.md` — Essence drop values and costs
- `docs/UPGRADEPATH.md` — Upgrade path unlock at L3
- `docs/HUB.md` — Full Hunter Hub layout and flow
