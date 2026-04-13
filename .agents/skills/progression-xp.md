---
name: progression-xp
description: Roguelite progression — hunter XP, Essence economy, hub shop with all 17 weapons (from docs/WEAPONS.md), stat upgrades, co-op scaling. Use for Phase 5.
---

# Progression & XP for Huntix

## Run Structure

Hub → Zone 1 → Zone 2 → Zone 3 → Run End → Essence → Hub

## Hunter XP

```js
const XP_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2100, 3000];
function getLevel(xp) {
  let level = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1; else break;
  }
  return level;
}
const XP_REWARDS = { enemyKill:10, eliteKill:40, miniBossKill:100, bossKill:300, zoneComplete:50 };
const ESSENCE_REWARDS = { enemyKill:2, eliteKill:8, bossKill:50, runComplete:100, speedBonus:25 };
```

## Persistent State

```js
const DEFAULT_STATE = { essence:0, totalRuns:0, hunterXP:{dabik:0,benzu:0,sereisa:0,vesol:0}, unlockedUpgrades:[], unlockedWeapons:[] };
const save = s => localStorage.setItem('huntix_save', JSON.stringify(s));
const load = () => JSON.parse(localStorage.getItem('huntix_save') || 'null') || {...DEFAULT_STATE};
```

## All 17 Weapons (docs/WEAPONS.md)

```js
const WEAPONS = [
  { id:'twin_daggers',      cost:60,  hunter:'dabik',    status:'bleed', label:'Twin Daggers' },
  { id:'gauntlets',         cost:90,  hunter:'benzu',    status:'stun',  label:'Gauntlets' },
  { id:'electro_blades',    cost:80,  hunter:'sereisa',  status:'slow',  label:'Electro-Blades' },
  { id:'flame_rod',         cost:70,  hunter:'vesol',    status:'burn',  label:'Flame Rod' },
  { id:'shadow_kunai',      cost:65,  hunter:'dabik',    status:'bleed', label:'Shadow Kunai' },
  { id:'earth_maul',        cost:95,  hunter:'benzu',    status:'stun',  label:'Earth Maul' },
  { id:'lightning_bow',     cost:85,  hunter:'sereisa',  status:'slow',  label:'Lightning Bow' },
  { id:'inferno_glaive',    cost:100, hunter:'vesol',    status:'burn',  label:'Inferno Glaive' },
  { id:'gatebreaker_rifle', cost:110, hunter:'benzu',    status:'stun',  label:'Gatebreaker Rifle' },
  { id:'portal_dagger',     cost:75,  hunter:'dabik',    status:null,    label:'Portal Dagger' },
  { id:'oni_katana',        cost:85,  hunter:'all',      status:'bleed', label:'Oni Katana' },
  { id:'balloon_blade',     cost:55,  hunter:'sereisa',  status:null,    label:'Balloon Blade' },
  { id:'yokai_feather',     cost:65,  hunter:'sereisa',  status:'slow',  label:'Yokai Feather' },
  { id:'storm_umbrella',    cost:70,  hunter:'vesol',    status:'slow',  label:'Storm Umbrella' },
  { id:'mana_staff',        cost:80,  hunter:'vesol',    status:'burn',  label:'Mana Staff' },
  { id:'portal_blaster',    cost:120, hunter:'dabik',    status:null,    label:'Portal Blaster' },
  { id:'tsunami_squirt',    cost:90,  hunter:'benzu',    status:'slow',  label:'Tsunami Squirt' },
];
// Shop: 6–8 slots per visit | Refresh: 10 Essence | Max 5 buys per run
// Rarities: common < 80 | rare 80–100 | elite > 100
function generateShop(hunter, count = 7) {
  return WEAPONS.filter(w => w.hunter === hunter || w.hunter === 'all').sort(() => Math.random() - 0.5).slice(0, count);
}
```

## Stat Upgrades

```js
const STAT_UPGRADES = [
  { id:'health_up_1',  cost:80,  stat:'maxHp',      value:20,  label:'Vitality I' },
  { id:'damage_up_1', cost:100, stat:'attackDmg',   value:10,  label:'Power I' },
  { id:'speed_up_1',  cost:90,  stat:'moveSpeed',   value:0.5, label:'Agility I' },
  { id:'combo_ext_1', cost:120, stat:'comboWindow', value:0.2, label:'Flow I' },
  { id:'dabik_shadow_1',   cost:150, hunter:'dabik',   stat:'shadowDmg',    value:0.2, label:'Shadow Mastery I' },
  { id:'benzu_thunder_1',  cost:150, hunter:'benzu',   stat:'stunDuration', value:0.3, label:'Thunder Mastery I' },
  { id:'sereisa_lightning_1', cost:150, hunter:'sereisa', stat:'slowStrength', value:0.15, label:'Lightning Mastery I' },
  { id:'vesol_flame_1',    cost:150, hunter:'vesol',   stat:'flameDuration',value:1.0, label:'Flame Mastery I' },
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
