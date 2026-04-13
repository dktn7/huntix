<div align="center">

<img width="700" height="333" alt="HUNTIX Logo" src="https://github.com/user-attachments/assets/944d925c-4e6e-4b5e-ab9b-d6c3490b5c35" />

# HUNTIX

### *Hunt. Enter. Survive.*

> A browser-based **2.5D** action beat 'em up built in **Three.js** for **Vibe Jam 2026**
> 1–4 hunters · Elemental gates · No login · Instant play

[![Vibe Jam 2026](https://img.shields.io/badge/Vibe%20Jam-2026-blueviolet?style=for-the-badge)](https://vibej.am/2026/)
[![Engine](https://img.shields.io/badge/Engine-Three.js-black?style=for-the-badge&logo=threedotjs)](https://threejs.org/)
[![Style](https://img.shields.io/badge/Style-2.5D%20Brawler-ff69b4?style=for-the-badge)](#)
[![Players](https://img.shields.io/badge/Players-1--4%20Local%20Co--op-green?style=for-the-badge)](#)
[![Status](https://img.shields.io/badge/Status-In%20Development-orange?style=for-the-badge)](#)

</div>

---

## 🎮 Overview

Gates have opened. Elite hunters are the only answer.

**Huntix** is a fast, polished **2.5D** brawler where 1–4 players control S-Rank hunters through portal-linked combat zones. Built in Three.js with 3D models on a fixed orthographic camera — the visual quality of 3D with the readability and tight feel of a classic beat 'em up. Inspired by **Solo Leveling** (dark fantasy escalation), **Castle Crashers** (co-op chaos, readable characters), and **Dead Cells** (tight dodge timing, status synergies).

| Detail | Info |
|--------|------|
| 🔧 Engine | Three.js (browser-native, no install) |
| 🎥 Camera | Fixed orthographic — 2.5D lane-based brawler |
| 👥 Players | 1–4 local co-op (AI fills empty slots) |
| ⏱ Session | 10–20 min full run · 2–5 min per zone |
| 🔁 Run Type | Roguelite — Essence drops, run-tied levelling |
| 🚀 Deployment | Single domain · No login · No loading screens |
| 🏆 Jam Widget | Required ✅ |

```html
<script async src="https://vibej.am/2026/widget.js"></script>
```

---

## 🔄 Core Loop

```
Hub (select hunter + weapon + shop)
  → Enter portal
    → Clear waves + boss
      → Earn Essence + XP
        → Return to Hub
          → Buy / level up
            → Push next zone  ↺
```

> Full clear = 4 zones · Wipe = lose run buffs/XP, keep 50% Essence · Win = high score + Essence bonus

---

## 🧑‍🤝‍🧑 Hunters — S-Rank Roster

All four hunters share the same core controls. Each has unique stats, spells, status effects, and ultimate.

| Hunter | Element | Status | Weapon | Playstyle |
|--------|---------|--------|--------|-----------|
| ⚫ **Dabik** | Shadow | Bleed | Twin curved daggers | Fastest. Blink-backstab, stealth combos, lowest HP |
| 🟤 **Benzu** | Thunder/Earth | Stun | Stone gauntlets | Tank. Charges ultimate by *taking* damage. Slowest |
| 🟡 **Sereisa** | Lightning | Slow | Electro-blades | Speed/chain. Dashes through enemies, shocks entire groups |
| 🔴 **Vesol** | Flame | Burn | Gate crystal focus (wrist) | Mage. Highest mana, precision spells, arena control |

### Hunter Stats At A Glance

| Stat | ⚫ Dabik | 🟤 Benzu | 🟡 Sereisa | 🔴 Vesol |
|------|---------|---------|----------|--------|
| HP | 80 | 160 | 100 | 90 |
| Mana | 120 | 70 | 100 | 130 |
| Move Speed | 9/10 | 4/10 | 8/10 | 6/10 |
| Attack Speed | 9/10 | 3/10 | 8/10 | 5/10 |
| Damage | 6/10 | 10/10 | 7/10 | 8/10 |
| Defense | 3/10 | 9/10 | 5/10 | 4/10 |
| Dodge | Blink (teleport behind enemy) | Shoulder Charge (forward burst) | Electric Dash (through enemies) | Flame Scatter (pushes enemies back) |

### ⚡ Status Synergies (Co-op)

| Combo | Hunters | Effect |
|-------|---------|--------|
| Bleed + Slow | Dabik + Sereisa | Slowed enemies take amplified bleed damage |
| Stun + Wall | Benzu + Vesol | Stunned enemies trapped inside flame wall |
| Slow + Blink | Sereisa + Dabik | Free backstab on shocked target |
| Burn + Slam | Vesol + Benzu | Burning enemies take bonus stagger on slam |

---

## 🌍 Zones & Bosses

All zones are flat horizontal stages — 2.5D scrolling arenas with parallax depth layers.

| # | Zone | Tone | Boss | Boss Mechanic | Co-op Scale |
|---|------|------|------|---------------|-------------|
| 1 | 🏙 City Breach | Ruined streets, intro zone | Fire Bruiser | Charge phases | +Adds at 4P |
| 2 | 🏚 Ruin Den | Underground dungeon | Earth Tank | Wall slams | Wall spawns |
| 3 | 🌑 Shadow Core | Dark, final-act tone | Rogue Dabik | x2 Clones + invisibility | Full kit required |
| 4 | ⚡ Thunder Spire | Elevated platform stages | Raiju Thunderbeast | Chain lightning + dive | Platform combat |

---

## 💥 Combat Feel

| Effect | Detail |
|--------|--------|
| Hit Stop | 40–80ms on heavy hits |
| Screen Shake | Tiered by hit weight |
| Flash | 1–2 frame white flash on connect |
| Input Buffer | 10–15 frames (cancel dodge → light) |
| Combo UI | Active counter on screen |
| Slow-mo Kills | Triggered on boss finishers |
| Ultimate Punch | Cinematic wind-up per hunter |

---

## 📊 Resource System

Each hunter has **3 bars:**

| Bar | Function | Recovers By |
|-----|----------|-------------|
| ❤️ Health | Take damage, die at zero | Potions, hub shop |
| 🔵 Mana | Powers spells | Passively + light attack hits |
| 🟠 Surge | Unlocks ultimate when full | Kills, damage taken, hit streaks |

### Spell Tiers

| Tier | Mana Cost | Speed | Effect |
|------|-----------|-------|--------|
| Minor | Low | Instant | Quick status, short dash, small hit |
| Advanced | Medium | Short wind-up | AoE, combo extender, shield |
| Ultimate | Full Surge | Cinematic | Hunter-specific, unstoppable moment |

---

## 🌟 Hunter Ultimates

| Hunter | Ultimate | Effect |
|--------|----------|--------|
| ⚫ Dabik | **Monarch's Domain** | All enemies frozen 4s; Dabik enters invisible rapid-strike mode |
| 🟤 Benzu | **Titan's Wrath** | Full-screen ground shatter; all enemies stunned 5s; Benzu takes zero damage |
| 🟡 Sereisa | **Storm Surge** | Untouchable 6s; every dash deals damage; speed doubles |
| 🔴 Vesol | **Inferno** | Entire arena fills with fire 6s; all enemies burn; Vesol immune to own flames |

---

## 🛒 Progression & Shop

**Essence Economy:** Drops 5–500 per kill/boss · Max 5 buys per run · Refresh costs 10 Essence

| Category | Examples |
|----------|---------|
| ⚔️ Power | Damage boost, combo extender, special power upgrade |
| 🛡 Survival | Health restore, armour, recovery speed |
| 💨 Mobility | Dodge distance, speed, cooldown reduction |
| 🔧 Utility | Mana regen boost, reroll |
| 🎨 Cosmetic | Aura colours, weapon skins |

### Level-Up (Run-Tied XP)

| Source | XP Reward |
|--------|-----------|
| Enemy kill | 50–200 |
| Zone clear | 500 |
| Boss kill | 1500 |

| Level | XP Threshold | Unlock |
|-------|-------------|--------|
| L1 | 500 | Base hunter kit |
| L2 | 1500 | Unlock a modifier |
| L3 | 3000 | Choose upgrade path |
| L4 | 5000 | Strengthen chosen path |

Max level 4 per run. Resets on wipe.

**Upgrade Paths (choose one at L3):**
- ⚔️ **Power** — damage, combo length, special impact
- 🛡 **Survival** — health, shield, recovery
- 💨 **Mobility** — dodge distance, speed, cooldown
- ✨ **Style** — aura intensity, cosmetic flair, silent casting

---

## ⚔️ Weapons (21 Total — Randomised Each Run)

| Weapon | Type | Cost | Best Hunter | Notes |
|--------|------|------|-------------|-------|
| Twin Daggers | Melee Fast | 60 | Dabik | Default |
| Gauntlets | Heavy | 90 | Benzu | Castle Crashers feel |
| Electro-Blades | Melee Chain | 80 | Sereisa | Dead Cells feel |
| Flame Rod | Ranged | 70 | Vesol | Burn DoT |
| Shadow Kunai | Thrown | 65 | Dabik | Tracking + Bleed |
| Earth Maul | Slam AoE | 95 | Benzu | Stun wall + HP |
| Lightning Bow | Ranged | 85 | Sereisa | Chain slow |
| Inferno Glaive | Reach | 100 | Vesol | Burn sweep |
| Gatebreaker Rifle | Gun | 110 | Benzu | Range + stun shot |
| Portal Dagger | Melee | 75 | Dabik | Blink teleport |
| Oni Katana | Melee Reach | 85 | All | Damage + bleed slash |
| Balloon Blade | Melee Float | 55 | Sereisa | Jump + light AoE |
| Yokai Feather | Thrown | 65 | Sereisa | Slow fan + air dodge |
| Storm Umbrella | Shield/Melee | 70 | Vesol | Block slow + spin |
| Mana Staff | Ranged | 80 | Vesol | Mana regen + burn bolt |
| Portal Blaster | Gun | 120 | Dabik | Summon ally portal |
| Tsunami Squirt | Ranged | 90 | Benzu | Slow wave + wet debuff |

---

## 👾 Enemy Types

| Type | Behaviour |
|------|-----------|
| Grunt | Standard melee, basic rush pattern |
| Ranged Unit | Keeps distance, fires projectiles |
| Bruiser | Slow, high HP, hard to stagger |
| Mini-boss | Zone gatekeeper — stronger patterns, telegraphed |
| Boss | Zone finale — multiple phases, dramatic telegraphs |

Elemental variants: shadow grunt (bleed), fire grunt (burn), etc.

**Co-op Scaling:** HP +50% per player · Max 20 enemies on screen · Enemy count scales with player count

---

## 🎮 Controls

| Action | ⌨️ Keyboard | 🎮 Controller |
|--------|------------|--------------|
| Move | WASD | Left stick |
| Light Attack | Left mouse | X / Square |
| Heavy Attack | Right mouse | Y / Triangle |
| Dodge | Shift | B / Circle |
| Special | E | RB / R1 |
| Interact | F | A / Cross |

> Camera: fixed orthographic (2.5D). Zooms out smoothly as players spread apart. No rotation — readability first.

---

## 🔧 Tech Stack

| Layer | Choice |
|-------|--------|
| Engine | Three.js |
| Camera | Fixed orthographic — 2.5D presentation |
| Movement | X/Y plane only — Z is visual depth layering |
| Collision | AABB (flat 2D hit boxes) |
| Enemy AI | Lane-based pathing (Yuka.js or custom) |
| Weapons | Bone-attach system |
| Status | Stackable (Confusion, Bleed, Burn, Slow, Stun) |
| Co-op | Local-first · 1–4 players · AI companions fill empty slots |
| Performance | 60fps · max 20 enemies instanced · 500 particles |
| Deployment | Single domain/subdomain · no login · no loading screen |
| Vibe Jam Widget | `<script async src="https://vibej.am/2026/widget.js"></script>` |

---

## 🗺 MVP Scope

**Build now:**
- Hunter hub (character select, shop 6–8 slots, portal select)
- All 4 hunters — Dabik, Benzu, Sereisa, Vesol
- 1–4 local players + optional AI companion
- 3 enemy types + 1 mini-boss + 1 final boss
- Shop with items + level-up system
- 3 short portal zones (City Breach, Ruin Den, Shadow Core)
- Parallax background layers per zone
- Vibe Jam widget embedded
- Instant browser load, no login

**Post-MVP (do later):**
- Online multiplayer
- Thunder Spire (zone 4)
- Additional hunters
- Save system
- Quest and dialogue system
- Procedural generation
- Complex inventory management

---

## 📅 18-Day Build Plan

> **Jam Deadline: 1 May 2026 @ 12:37 GMT** *(Birmingham, UK)*

| Phase | Days | Focus | Milestone |
|-------|------|-------|-----------|
| 1 — Core Engine | 1–3 | Three.js 2.5D setup (orthographic cam, X/Y movement), player controller, hub, widget | ✅ Solo hunter moves + attacks |
| 2 — Combat Basics | 4–6 | Enemy AI (lane-based, 3 types), AABB hit detection, status effects, mana/surge/spells, juice | ✅ Fight grunt waves |
| 3 — Hunters + Co-op | 7–9 | All 4 hunters, local 1–4P input, orthographic cam zoom, AI companions, co-op scaling | ✅ 4P hub + combat |
| 4 — Zones + Bosses | 10–12 | 4 zones, portals, parallax backgrounds, mini-boss + boss phases, Essence drops | ✅ Full run clearable |
| 5 — Progression + UI | 13–15 | Hub shop, cosmetics, weapons, levelling, XP thresholds, HUD, combo UI | ✅ Buy + upgrade loop |
| 6 — Polish + Deploy | 16–18 | Audio/SFX, onboarding, 60fps tweaks, deploy to domain, widget confirm | ✅ Playable jam entry |

---

## ✅ Jam Compliance

| Rule | Status |
|------|--------|
| New game (created during jam period — April 2026) | ✅ |
| Web-accessible, no login, free-to-play | ✅ |
| Vibe Jam widget included | ✅ |
| ≥90% AI-assisted code | ✅ |
| Three.js (recommended engine) | ✅ |
| Instant load — no loading screen | ✅ |
| 1–4 players (multiplayer capable) | ✅ |
| Single domain tracking for widget | ✅ |

---

## 📁 File Structure

```
huntix/
├── index.html          # Entry point — widget included here
├── assets/             # Models, textures, audio
├── projects/           # Cursor/AI project context files
├── bonus/              # Extras, references, scratchpad
├── .agents/            # AI agent config
├── .claude/            # Claude project instructions
├── CHANGELOG.md        # Version log
└── START-HERE.md       # Starter pack notes (reference)
```

---

<div align="center">

*Huntix — Vibe Jam 2026 entry · Solo dev + AI · Built in Three.js · 2.5D brawler*

**[▶ Play (coming soon)](#)** · **[📋 Changelog](CHANGELOG.md)** · **[🚀 Start Here](START-HERE.md)**

</div>
