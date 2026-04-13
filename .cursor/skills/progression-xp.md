---
name: progression-xp
description: Roguelite run progression, hunter XP and leveling, essence shop economy, and per-run upgrade systems for Huntix. Use when building the hub, between-zone shop, hunter stat growth, and run reward systems.
source: mcpmarket.com/tools/skills/categories/game-development
---

# Progression & XP Framework for Huntix

Huntix uses a roguelite loop: short 2–5 min runs, earn Essence, spend in hub shop, grow hunters between runs.

## Run Structure

```
Hub (hunter select + shop)
  └─ Zone 1 (enemies + mini-boss)
      └─ Zone 2 (harder enemies + boss)
          └─ Zone 3 (elite enemies + final boss)
              └─ Run End → Essence rewards → back to Hub
```

## Hunter XP & Leveling

```js
const XP_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2100, 3000];
// Level = index of last threshold exceeded

function getLevel(xp) {
  let level = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}

function getXpToNextLevel(xp) {
  const level = getLevel(xp);
  if (level >= XP_THRESHOLDS.length) return 0; // max level
  return XP_THRESHOLDS[level] - xp;
}

// XP sources per run
const XP_REWARDS = {
  enemyKill: 10,
  eliteKill: 40,
  miniBossKill: 100,
  bossKill: 300,
  zoneComplete: 50,
  noDamageBonus: 75,
};
```

## Essence Economy (Currency)

Essence is the between-run currency spent in the hub shop:

```js
const ESSENCE_REWARDS = {
  enemyKill: 2,
  eliteKill: 8,
  bossKill: 50,
  runComplete: 100,
  speedBonus: 25,      // complete run under 3 min
  noDamageBonus: 50,
};

// Persistent player state (save to localStorage)
const playerState = {
  essence: 0,
  totalRuns: 0,
  hunterXP: { dabik: 0, benzu: 0, sereisa: 0, vesol: 0 },
  unlockedUpgrades: [],
};

function saveState() {
  localStorage.setItem('huntix_save', JSON.stringify(playerState));
}

function loadState() {
  const saved = localStorage.getItem('huntix_save');
  return saved ? JSON.parse(saved) : { ...playerState };
}
```

## Hub Shop Upgrades

```js
const SHOP_UPGRADES = [
  { id: 'health_up_1',    cost: 80,  effect: { stat: 'maxHp', value: 20 },    label: 'Vitality I' },
  { id: 'damage_up_1',   cost: 100, effect: { stat: 'attackDmg', value: 10 }, label: 'Power I' },
  { id: 'speed_up_1',    cost: 90,  effect: { stat: 'moveSpeed', value: 0.5 },label: 'Agility I' },
  { id: 'combo_ext_1',   cost: 120, effect: { stat: 'comboWindow', value: 0.2}, label: 'Flow I' },
  // Elemental upgrades (hunter-specific)
  { id: 'dabik_shadow_1', cost: 150, hunter: 'dabik', effect: { stat: 'shadowDmg', value: 0.2 }, label: 'Shadow Mastery I' },
  { id: 'vesol_flame_1',  cost: 150, hunter: 'vesol',  effect: { stat: 'flameDuration', value: 1 }, label: 'Flame Mastery I' },
];

function canAfford(upgradeId, state) {
  const upgrade = SHOP_UPGRADES.find(u => u.id === upgradeId);
  return upgrade && state.essence >= upgrade.cost && !state.unlockedUpgrades.includes(upgradeId);
}

function purchaseUpgrade(upgradeId, state) {
  if (!canAfford(upgradeId, state)) return false;
  const upgrade = SHOP_UPGRADES.find(u => u.id === upgradeId);
  state.essence -= upgrade.cost;
  state.unlockedUpgrades.push(upgradeId);
  saveState();
  return true;
}
```

## In-Run Stat Scaling

Apply purchased upgrades to base stats at run start:

```js
function buildHunterStats(hunterBase, unlockedUpgrades) {
  const stats = { ...hunterBase };
  for (const id of unlockedUpgrades) {
    const upgrade = SHOP_UPGRADES.find(u => u.id === id);
    if (!upgrade) continue;
    if (!upgrade.hunter || upgrade.hunter === hunterBase.id) {
      stats[upgrade.effect.stat] = (stats[upgrade.effect.stat] || 0) + upgrade.effect.value;
    }
  }
  return stats;
}
```

## Co-op Scaling

Scale enemy HP and Essence rewards based on player count:

```js
function getCoopScaling(playerCount) {
  return {
    enemyHpMultiplier:      [1, 1.5, 2.0, 2.5][playerCount - 1],
    essenceRewardMultiplier:[1, 1.2, 1.4, 1.6][playerCount - 1],
    bossHpMultiplier:       [1, 1.8, 2.4, 3.0][playerCount - 1],
  };
}
```

## Economy Balance Guidelines

- Average run should yield 150–250 Essence
- Cheapest meaningful upgrade: ~80 Essence (1 run)
- Full upgrade tree: ~3,000 Essence (~15–20 runs)
- Never let players feel stuck — always have 1–2 affordable upgrades available
- Show "best value" highlight on shop to guide new players
