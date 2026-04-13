---
name: progression-xp
description: Roguelite progression for Huntix — hunter XP and leveling, Essence economy, hub shop upgrades, per-run stat scaling, co-op reward multipliers. Use when building Phase 5 systems.
---

# Progression & XP for Huntix

## Run Structure

Hub → Zone 1 → Zone 2 → Zone 3 → Run End → Essence rewards → Hub

## Hunter XP Thresholds

```js
const XP_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2100, 3000];
function getLevel(xp) {
  let level = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1; else break;
  }
  return level;
}
```

## XP & Essence Rewards

```js
const XP_REWARDS =     { enemyKill:10, eliteKill:40, miniBossKill:100, bossKill:300, zoneComplete:50 };
const ESSENCE_REWARDS = { enemyKill:2,  eliteKill:8,  bossKill:50,     runComplete:100, speedBonus:25 };
```

## Persistent State (localStorage)

```js
const defaultState = { essence:0, totalRuns:0, hunterXP:{dabik:0,benzu:0,sereisa:0,vesol:0}, unlockedUpgrades:[] };
const save = () => localStorage.setItem('huntix_save', JSON.stringify(state));
const load = () => JSON.parse(localStorage.getItem('huntix_save') || 'null') || {...defaultState};
```

## Hub Shop Upgrades

```js
const UPGRADES = [
  { id:'health_up_1',  cost:80,  stat:'maxHp',       value:20,  label:'Vitality I' },
  { id:'damage_up_1', cost:100, stat:'attackDmg',    value:10,  label:'Power I' },
  { id:'speed_up_1',  cost:90,  stat:'moveSpeed',    value:0.5, label:'Agility I' },
  { id:'combo_ext_1', cost:120, stat:'comboWindow',  value:0.2, label:'Flow I' },
];
```

## Co-op Scaling

```js
function getCoopScaling(playerCount) {
  return {
    enemyHpMult:       [1.0, 1.5, 2.0, 2.5][playerCount - 1],
    bossHpMult:        [1.0, 1.8, 2.4, 3.0][playerCount - 1],
    essenceRewardMult: [1.0, 1.2, 1.4, 1.6][playerCount - 1],
  };
}
```

## Economy Balance

- Average run: 150–250 Essence
- Cheapest upgrade: ~80 Essence (1 run)
- Full upgrade tree: ~3,000 Essence (~15–20 runs)
