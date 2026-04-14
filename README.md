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

All four hunters share the same core controls. Each has unique stats, spells, status effects, and ultimate. They come from different corners of the world and share one purpose — when the gates open, they enter.

---

### ⚫ DABIK — Shadow Striker

> *Silence is the last thing you hear.*

| Attribute | Detail |
|---|---|
| Origin | Caribbean-African |
| Element | Shadow |
| Status | Bleed |
| Weapon | Twin curved daggers |
| Build | Muscular agile — compact power, fast and controlled |
| Skin | Dark brown |
| Hair | Short wild spiky white |
| Eyes | Purple — calm, unnatural, faint glow in power states |
| Aura | Black with deep purple edges, spreads like a shadow at dusk |
| Palette | Black, purple, muted silver |

**Background:** Born on a small island between the Caribbean Sea and the Atlantic, to a family with deep West African roots. His grandfather was a tracker. Dabik inherited the instinct. He entered his first gate alone at C-Rank on a dare. Walked out A-Rank. Nobody saw what happened inside. Reached S-Rank through principle, not brute force — *the most dangerous thing is what you never see coming.*

**Combat:** Don't fight the enemy. End the encounter. Blink behind target, bleed methodically, vanish, repeat.

| Stat | Value |
|---|---|
| HP | 80 |
| Move Speed | 9/10 (fastest) |
| Attack Speed | 9/10 |
| Damage | 6/10 |
| Defense | 3/10 |
| Dodge | Blink — teleports behind nearest enemy |

---

### 🟤 BENZU — Iron Breaker

> *I don't dodge. I don't need to.*

| Attribute | Detail |
|---|---|
| Origin | South American / Brazilian |
| Element | Thunder/Earth |
| Status | Stun |
| Weapon | Stone-forged gauntlets reinforced with gate ore |
| Build | Massive fortress — huge, broad, immovable |
| Skin | Bronze-orange |
| Hair | Long dirty-blonde mane, thick and heavy |
| Eyes | Dark and heavy-set |
| Aura | Deep red with gold fractures, pulses like heat under stone |
| Palette | Deep red, gold, ember black |

**Background:** Grew up in Rio de Janeiro. Worked construction from fifteen. Awakened when a gate boss pinned his entire team — picked up rubble the size of a car door and hit it until it stopped. Every S-Rank board said the same thing: *we have no protocol for this.*

**Combat:** Take the hit. Then take everything else. Absorbs damage to charge surge, then releases it all at once.

| Stat | Value |
|---|---|
| HP | 160 (highest) |
| Move Speed | 4/10 (slowest) |
| Attack Speed | 3/10 |
| Damage | 10/10 (highest) |
| Defense | 9/10 |
| Dodge | Shoulder Charge — short forward burst, staggers enemies |

---

### 🟡 SEREISA — Storm Chaser

> *You blinked. That's why you lost.*

| Attribute | Detail |
|---|---|
| Origin | European / British-Nordic |
| Element | Lightning |
| Status | Slow (electric shock) |
| Weapon | Single lightning rapier — slender, precise, permanently crackling |
| Build | Sleek athletic — speed-first, narrow and precise |
| Skin | Pale Nordic |
| Hair | Platinum undercut, sharp and practical |
| Eyes | Light and focused |
| Aura | Bright yellow with white crackling edges |
| Palette | Bright yellow, white, pale steel |

**Background:** Born in London to a British mother and Norwegian father. Competed in fencing at national level. Awakened when a barrier failed at a gate event — crossed thirty metres of active combat zone and pulled two people clear before the response team arrived. Fastest S-Rank progression in European gate authority history. The record still stands.

**Combat:** Control the distance. Control the fight. Fencing footwork, dash-in punishments, shock to slow, then make them pay for being slow.

| Stat | Value |
|---|---|
| HP | 100 |
| Move Speed | 8/10 (second fastest) |
| Attack Speed | 8/10 |
| Damage | 7/10 |
| Defense | 5/10 |
| Dodge | Electric Dash — dashes through enemies, applies slow on contact |

---

### 🔴 VESOL — Ember Mage

> *The gate burns. So does everything in it.*

| Attribute | Detail |
|---|---|
| Origin | Asian / Japanese-Filipino |
| Element | Flame |
| Status | Burn |
| Weapon | Gate crystal focus at the wrist — no physical blade |
| Build | Defined, poised, refined — controlled and deliberate |
| Skin | Warm tan |
| Hair | Dark controlled bun with a few deliberate loose strands |
| Eyes | Dark, thoughtful, observant |
| Aura | Deep blue that bleeds into crimson as power increases |
| Palette | Deep blue, crimson, dark charcoal |

**Background:** Born in Tokyo. PhD in gate energy theory from Tokyo University. Lead researcher on a mana absorption programme. The answer was her. The experiment concluded when she unconsciously incinerated a containment room during calibration. Nobody was hurt. The readings were extraordinary. S-Rank after her third solo gate run, completed in fourteen minutes and documented in a forty-page report.

**Combat:** Precision over power — though precision at sufficient scale becomes power. Maps the battlefield before engaging it. In co-op, she sets the arena up so everyone else can finish it.

| Stat | Value |
|---|---|
| HP | 90 |
| Move Speed | 6/10 |
| Attack Speed | 5/10 |
| Damage | 8/10 |
| Defense | 4/10 |
| Dodge | Flame Scatter — burst of embers, pushes enemies back |

---

### Hunter Stats At A Glance

| Stat | ⚫ Dabik | 🟤 Benzu | 🟡 Sereisa | 🔴 Vesol |
|------|---------|---------|----------|--------|
| HP | 80 | 160 | 100 | 90 |
| Mana | 120 | 70 | 100 | 130 |
| Move Speed | 9/10 | 4/10 | 8/10 | 6/10 |
| Attack Speed | 9/10 | 3/10 | 8/10 | 5/10 |
| Damage | 6/10 | 10/10 | 7/10 | 8/10 |
| Defense | 3/10 | 9/10 | 5/10 | 4/10 |
| Dodge | Blink | Shoulder Charge | Electric Dash | Flame Scatter |

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
| 2 | 🏕 Ruin Den | Underground dungeon | Earth Tank | Wall slams | Wall spawns |
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

## 🛍 Progression & Shop

**Essence Economy:** Drops 5–500 per kill/boss · Max 5 buys per run · Refresh costs 10 Essence

| Category | Examples |
|----------|---------|
| ⚔️ Power | Damage boost, combo extender, special power upgrade |
| 🛡 Survival | Health restore, armour, recovery speed |
| 💨 Mobility | Dodge distance, speed, cooldown reduction |
| 🔧 Utility | Mana regen boost, reroll |
| 🎨 Cosmetic | Aura colours, weapon skins |

### Level-Up (Run-Tied XP)

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

## ⚔️ Weapons

Each hunter has a **signature weapon** locked to their identity. Additional weapons are available in the shop each run and can be used by any hunter, with stat bonuses favouring the recommended hunter.

### Default (Signature) Weapons

| Hunter | Weapon | Type |
|--------|--------|------|
| ⚫ Dabik | Twin Curved Daggers | Melee Fast |
| 🟤 Benzu | Stone-Forged Gauntlets | Heavy Melee |
| 🟡 Sereisa | Lightning Rapier | Melee Precision |
| 🔴 Vesol | Gate Crystal Focus | Cast/Ranged |

### Shop Weapons (Available Each Run)

| Weapon | Type | Cost | Best For | Effect |
|--------|------|------|----------|--------|
| Shadow Kunai | Thrown | 65 | Dabik | Tracking throw, bleed on landing |
| Portal Dagger | Melee | 75 | Dabik | Blink teleport on hit |
| Phase Edge | Precision | 85 | Dabik / Sereisa | Blink on heavy, bleed or slow |
| Shadow Dart | Thrown | 65 | Dabik | Silent ranged, bleed DoT |
| Portal Blaster | Special | 120 | Dabik | Summon decoy portal trap |
| Earth Maul | Heavy | 95 | Benzu | Slam AoE, stun wall |
| Gate Fist | Heavy | 80 | Benzu | Close stun burst, staggers on heavy |
| Gatebreaker Rifle | Ranged | 110 | Benzu | Range stun shot, burst ammo |
| Lightning Bow | Ranged | 85 | Sereisa | Chain slow, ranged shock |
| Storm Lance | Precision | 90 | Sereisa | Thrust range, slow on hit |
| Storm Bangle | Utility | 90 | Sereisa | Wrist shock burst on dodge |
| Glaive of Embers | Heavy | 100 | Vesol | Reach sweep, burn trail |
| Inferno Bolt | Ranged | 80 | Vesol | Burn bolt, mana regen on hit |
| Mana Staff | Cast | 80 | Vesol | Mana regen, amplified burn bolt |
| Gate Crystal Shard | Cast | 70 | All | Minor spell cast, utility |
| Oni Katana | Melee Reach | 85 | All | High damage, bleed slash on heavy |
| Crescent Blade | Melee | 80 | All | Fast arc, status on chain hit |
| Void Bracer | Utility | 95 | All | Dodge applies weapon status effect |

> See [`docs/WEAPONS.md`](docs/WEAPONS.md) for full distribution, design rules, and shop economy.

---

## 👾 Enemy Types

| Type | Behaviour |
|------|-----------|
| Grunt | Standard melee, basic rush pattern |
| Ranged Unit | Keeps distance, fires projectiles |
| Bruiser | Slow, high HP, hard to stagger |
| Mini-boss | Zone gatekeeper — stronger patterns, telegraphed |
| Boss | Zone finale — multiple phases, dramatic telegraphs |

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
| Status | Stackable (Bleed, Burn, Slow, Stun) |
| Co-op | Local-first · 1–4 players · AI companions fill empty slots |
| Performance | 60fps · max 20 enemies instanced · 500 particles |
| Deployment | Single domain/subdomain · no login · no loading screen |
| Vibe Jam Widget | `<script async src="https://vibej.am/2026/widget.js"></script>` |

---

## 🗺 MVP Scope

**Build now:**
- Hunter hub (character select, shop, portal select)
- All 4 hunters — Dabik, Benzu, Sereisa, Vesol
- 1–4 local players + optional AI companion
- 3 enemy types + 1 mini-boss + 1 final boss
- Shop with items + level-up system
- 3 short portal zones (City Breach, Ruin Den, Shadow Core)
- Vibe Jam widget embedded
- Instant browser load, no login

**Post-MVP:**
- Online multiplayer
- Thunder Spire (zone 4)
- Additional hunters
- Save system
- Quest and dialogue
- Procedural generation

---

## 📅 18-Day Build Plan

> **Jam Deadline: 1 May 2026 @ 13:37 UTC**

| Phase | Days | Focus | Milestone |
|-------|------|-------|-----------|
| 1 — Core Engine | 1–3 | Three.js 2.5D setup, player controller, hub, widget | ✅ Solo hunter moves |
| 2 — Combat Basics | 4–6 | Enemy AI, hit detection, status effects, juice | ✅ Fight grunt waves |
| 3 — Hunters + Co-op | 7–9 | All 4 hunters, 1–4P input, AI companions | ✅ 4P hub + combat |
| 4 — Zones + Bosses | 10–12 | 3 zones, portals, boss phases, Essence drops | ✅ Full run clearable |
| 5 — Progression + UI | 13–15 | Shop, weapons, levelling, HUD, combo UI | ✅ Buy + upgrade loop |
| 6 — Polish + Deploy | 16–18 | Audio, onboarding, 60fps, deploy to domain | ✅ Playable jam entry |

---

## ✅ Jam Compliance

| Rule | Status |
|------|--------|
| New game (created April 2026) | ✅ |
| Web-accessible, no login, free-to-play | ✅ |
| Vibe Jam widget included | ✅ |
| ≥90% AI-assisted code | ✅ |
| Three.js (recommended engine) | ✅ |
| Instant load — no loading screen | ✅ |
| 1–4 players (multiplayer capable) | ✅ |
| Single domain tracking for widget | ✅ |

---

## 📁 Docs

| File | Contents |
|------|----------|
| [`docs/HUNTERS.md`](docs/HUNTERS.md) | Full character sheets — stats, spells, appearance, backstory |
| [`docs/WEAPONS.md`](docs/WEAPONS.md) | Full weapon list, distribution, shop economy |
| [`docs/CUSTOMIZATION.md`](docs/CUSTOMIZATION.md) | Visual rules, locked identity elements, outfit system |
| [`docs/VISUAL-DESIGN.md`](docs/VISUAL-DESIGN.md) | Art direction, aura system, palette |
| [`docs/BOSSES.md`](docs/BOSSES.md) | Boss phases, attacks, counters |
| [`docs/ZONES.md`](docs/ZONES.md) | Zone layouts, pacing, parallax |
| [`docs/GDD.md`](docs/GDD.md) | Full game design document |
| [`docs/ANIMATIONS.md`](docs/ANIMATIONS.md) | Animation states per hunter |
| [`docs/HUD.md`](docs/HUD.md) | HUD layout and UI flow |
| [`docs/AUDIO.md`](docs/AUDIO.md) | Audio design and SFX spec |

---

<div align="center">

*Huntix — Vibe Jam 2026 entry · Solo dev + AI · Built in Three.js · 2.5D brawler*

**[▶ Play (coming soon)](#)** · **[📋 Changelog](CHANGELOG.md)**

</div>
