---
name: progression-xp
description: Roguelite progression for Huntix — hunter XP and leveling, Essence economy, hub shop upgrades including all 17 weapons, per-run stat scaling, co-op reward multipliers. Use when building Phase 5 systems. Reference docs/WEAPONS.md and docs/GDD.md.
---

# Progression & XP for Huntix

Huntix uses a roguelite loop: short runs, earn Essence, spend in hub shop on upgrades AND weapons, grow hunters between runs.

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
// Max level = 8

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

const XP_REWARDS = {
  enemyKill: 10,
  eliteKill: 40,
  miniBossKill: 100,
  bossKill: 300,
  zoneComplete: 50,
  noDamageBonus: 75,
};
```

## Essence Economy (Run Currency)

```js
const ESSENCE_REWARDS = {
  enemyKill: 2,
  eliteKill: 8,
  bossKill: 50,
  runComplete: 100,
  speedBonus: 25,      // complete run under 3 min
  noDamageBonus: 50,
};

// Average run = 150–250 Essence
// Cheapest upgrade = ~60 Essence (1 run)
// Full unlock tree = ~3,000 Essence (~15–20 runs)
```

## Persistent State (localStorage)

```js
const DEFAULT_STATE = {
  essence: 0,
  totalRuns: 0,
  hunterXP: { dabik: 0, benzu: 0, sereisa: 0, vesol: 0 },
  unlockedUpgrades: [],
  unlockedWeapons: [],
};

function saveState(state) {
  localStorage.setItem('huntix_save', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('huntix_save');
  return saved ? { ...DEFAULT_STATE, ...JSON.parse(saved) } : { ...DEFAULT_STATE };
}
```

## Hub Shop — Stat Upgrades

```js
const STAT_UPGRADES = [
  { id: 'health_up_1',   cost: 80,  stat: 'maxHp',       value: 20,  label: 'Vitality I' },
  { id: 'health_up_2',  cost: 150, stat: 'maxHp',       value: 30,  label: 'Vitality II' },
  { id: 'damage_up_1',  cost: 100, stat: 'attackDmg',   value: 10,  label: 'Power I' },
  { id: 'damage_up_2',  cost: 180, stat: 'attackDmg',   value: 15,  label: 'Power II' },
  { id: 'speed_up_1',   cost: 90,  stat: 'moveSpeed',   value: 0.5, label: 'Agility I' },
  { id: 'combo_ext_1',  cost: 120, stat: 'comboWindow', value: 0.2, label: 'Flow I' },
  // Hunter-specific elemental upgrades
  { id: 'dabik_shadow_1',    cost: 150, hunter: 'dabik',    stat: 'shadowDmg',      value: 0.2, label: 'Shadow Mastery I' },
  { id: 'benzu_thunder_1',   cost: 150, hunter: 'benzu',    stat: 'stunDuration',   value: 0.3, label: 'Thunder Mastery I' },
  { id: 'sereisa_lightning_1', cost: 150, hunter: 'sereisa', stat: 'slowStrength',  value: 0.15, label: 'Lightning Mastery I' },
  { id: 'vesol_flame_1',     cost: 150, hunter: 'vesol',    stat: 'flameDuration',  value: 1.0, label: 'Flame Mastery I' },
];
```

## Hub Shop — Weapons (from docs/WEAPONS.md)

21 weapons total. Shop shows 6–8 per visit. Refresh costs 10 Essence. Max 5 buys per run.

```js
const WEAPONS = [
  { id: 'twin_daggers',     cost: 60,  type: 'melee_fast',    hunter: 'dabik',    status: 'bleed',  effect: 'Bleed +20%',      label: 'Twin Daggers' },
  { id: 'gauntlets',        cost: 90,  type: 'heavy',         hunter: 'benzu',    status: 'stun',   effect: 'Stun +15%',       label: 'Gauntlets' },
  { id: 'electro_blades',   cost: 80,  type: 'melee_chain',   hunter: 'sereisa',  status: 'slow',   effect: 'Slow +25%',       label: 'Electro-Blades' },
  { id: 'flame_rod',        cost: 70,  type: 'ranged',        hunter: 'vesol',    status: 'burn',   effect: 'Burn DoT',        label: 'Flame Rod' },
  { id: 'shadow_kunai',     cost: 65,  type: 'thrown',        hunter: 'dabik',    status: 'bleed',  effect: 'Tracking Bleed',  label: 'Shadow Kunai' },
  { id: 'earth_maul',       cost: 95,  type: 'slam_aoe',      hunter: 'benzu',    status: 'stun',   effect: 'Stun Wall',       label: 'Earth Maul' },
  { id: 'lightning_bow',    cost: 85,  type: 'ranged',        hunter: 'sereisa',  status: 'slow',   effect: 'Chain Slow',      label: 'Lightning Bow' },
  { id: 'inferno_glaive',   cost: 100, type: 'reach',         hunter: 'vesol',    status: 'burn',   effect: 'Burn Sweep',      label: 'Inferno Glaive' },
  { id: 'gatebreaker_rifle',cost: 110, type: 'gun',           hunter: 'benzu',    status: 'stun',   effect: 'Stun Shot',       label: 'Gatebreaker Rifle' },
  { id: 'portal_dagger',    cost: 75,  type: 'melee',         hunter: 'dabik',    status: null,     effect: 'Blink Teleport',  label: 'Portal Dagger' },
  { id: 'oni_katana',       cost: 85,  type: 'melee_reach',   hunter: 'all',      status: 'bleed',  effect: 'Bleed Slash',     label: 'Oni Katana' },
  { id: 'balloon_blade',    cost: 55,  type: 'melee_float',   hunter: 'sereisa',  status: null,     effect: 'Jump + Light AoE',label: 'Balloon Blade' },
  { id: 'yokai_feather',    cost: 65,  type: 'thrown',        hunter: 'sereisa',  status: 'slow',   effect: 'Slow Fan',        label: 'Yokai Feather' },
  { id: 'storm_umbrella',   cost: 70,  type: 'shield_melee',  hunter: 'vesol',    status: 'slow',   effect: 'Block + Spin',    label: 'Storm Umbrella' },
  { id: 'mana_staff',       cost: 80,  type: 'ranged',        hunter: 'vesol',    status: 'burn',   effect: 'Mana Regen',      label: 'Mana Staff' },
  { id: 'portal_blaster',   cost: 120, type: 'gun',           hunter: 'dabik',    status: null,     effect: 'Summon Portal',   label: 'Portal Blaster' },
  { id: 'tsunami_squirt',   cost: 90,  type: 'ranged',        hunter: 'benzu',    status: 'slow',   effect: 'Slow Wave',       label: 'Tsunami Squirt' },
];

// Rarities: Common (cost < 80) | Rare (80–100) | Elite (> 100)
function getWeaponRarity(weapon) {
  if (weapon.cost > 100) return 'elite';
  if (weapon.cost >= 80) return 'rare';
  return 'common';
}

// Generate a shop rotation (6–8 weapons, randomised)
function generateShopInventory(playerHunter, count = 7) {
  const eligible = WEAPONS.filter(w => w.hunter === playerHunter || w.hunter === 'all');
  return eligible.sort(() => Math.random() - 0.5).slice(0, count);
}

function canAffordWeapon(weaponId, state) {
  const weapon = WEAPONS.find(w => w.id === weaponId);
  return weapon && state.essence >= weapon.cost;
}

function purchaseWeapon(weaponId, state) {
  if (!canAffordWeapon(weaponId, state)) return false;
  const weapon = WEAPONS.find(w => w.id === weaponId);
  state.essence -= weapon.cost;
  state.unlockedWeapons.push(weaponId);
  saveState(state);
  return true;
}
```

## In-Run Stat Scaling

```js
function buildHunterStats(hunterBase, state) {
  const stats = { ...hunterBase };
  for (const id of state.unlockedUpgrades) {
    const upgrade = STAT_UPGRADES.find(u => u.id === id);
    if (!upgrade) continue;
    if (!upgrade.hunter || upgrade.hunter === hunterBase.id) {
      stats[upgrade.stat] = (stats[upgrade.stat] || 0) + upgrade.value;
    }
  }
  return stats;
}
```

## Co-op Scaling

```js
function getCoopScaling(playerCount) {
  return {
    enemyHpMult:        [1.0, 1.5, 2.0, 2.5][playerCount - 1],
    bossHpMult:         [1.0, 1.8, 2.4, 3.0][playerCount - 1],
    essenceRewardMult:  [1.0, 1.2, 1.4, 1.6][playerCount - 1],
  };
}
```

## Economy Balance Rules

- Average run: 150–250 Essence
- Cheapest meaningful upgrade: ~60 Essence (1 run)
- Full upgrade tree: ~3,000 Essence (~15–20 runs)
- Shop always has 1–2 items the player can afford
- Refresh (10 Essence) available if nothing is affordable
- Show "Best Value" badge on highest impact / cost ratio item
