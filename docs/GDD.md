# HUNTIX Game Design Document

> Hunt. Enter. Survive.

*Last updated April 16, 2026*
*Team: Solo developer with AI assistance*

---

## 1. Game Overview

Huntix is a browser-based **2.5D** action beat 'em up built in Three.js where 1 to 4 hunters fight through portal-linked combat zones. The game uses a dark action-fantasy tone inspired by Solo Leveling, with fast combat, elite hunter characters, and a sense of escalation as players grow stronger through upgrades and boss fights.

**Inspired by:**
- **Solo Leveling** — dark hunter fantasy, ranked elites, dramatic auras, power escalation
- **Castle Crashers** — 4 distinct characters, elemental identities, chaotic co-op, readable silhouettes
- **Dead Cells** — tight dodge timing, status effect synergies, movement as a weapon, builds that scale

The game is a stand-alone browser experience with no login, no heavy downloads, and instant entry. Designed for short sessions, strong combat feedback, co-op chaos, and polished action-game presentation.

> **Rendering approach:** Three.js with 2D sprites billboarded inside a 3D world, viewed through a fixed orthographic camera — 2.5D style. Movement is constrained to the X/Y plane. This gives the visual clarity of 2D characters with the depth and atmosphere of a full 3D environment.

---

## 2. Tagline & Description

| | |
|---|---|
| **Tagline** | Hunt. Enter. Survive. |
| **Short description** | Gates have opened. Elite hunters are the only answer. Huntix is a 2.5D browser beat 'em up with fast combat, co-op chaos, and escalating boss fights — built for Vibe Jam 2026. |

---

## 3. Gameplay

The objective is to clear zones, defeat bosses, collect rewards, and grow stronger through a simple progression loop.

**Play flow:**
1. Spawn in the hunter hub
2. Choose a portal
3. Fight through a short combat zone
4. Defeat a miniboss or boss
5. Return to the hub
6. Buy items or level up powers
7. Repeat in a new zone or run again

---

## 4. Mechanics & Rules

- Supports 1–4 local players
- Solo play fully functional; AI companions fill empty slots optionally
- Multiplayer is local-first; online is post-MVP
- Players earn rewards by defeating enemies and bosses
- Progression based on short runs, upgrades, and zone unlocks

### Resource System (Three Bars Per Hunter)

| Bar | Function | Recovers By |
|---|---|---|
| Health | Take damage, die at zero | Potions, hub shop |
| Mana | Powers spells and abilities | Passively over time; landing light attacks |
| Surge | Unlocks ultimate when full | Builds from kills, damage taken, or hit streaks |

### Spell Tiers

Spells are **unlocked through levelling**, not available from the start. See [PROGRESSION.md](./PROGRESSION.md) for full detail.

| Tier | Unlocked At | Mana Cost | Effect |
|------|------------|-----------|--------|
| Minor | Level 1 (start) | Low | Quick status apply, short dash, small hit |
| Advanced | Level 3 | Medium | Area effect, combo extender, shield |
| Ultimate | Level 9 | Full Surge bar | Hunter-specific, unstoppable cinematic moment |

### Combat
Close-range, fast, and feedback-heavy. Movement is constrained to the X/Y plane — classic brawler lane system. Each hunter changes attack speed, reach, and status effect — but all share core controls for simple multiplayer. Enemies telegraph attacks clearly. Combat includes hit sparks, stagger, screen shake, and hit stop.

### Status Effect Synergies

| Combo | Hunters | Effect |
|---|---|---|
| Bleed + Slow | Dabik + Sereisa | Slowed enemies take amplified bleed damage |
| Stun + Wall | Benzu + Vesol | Stunned enemies trapped inside flame wall |
| Slow + Blink | Sereisa + Dabik | Free backstab on shocked target |
| Burn + Slam | Vesol + Benzu | Burning enemies take bonus stagger on slam |

### Physics
Simple arcade physics on the X/Y plane — responsive movement, light jumps, enemies pushed by hits, dodge grants brief safety. Z-axis is visual only (depth layering).

### Economy
Two currencies run in parallel. **Essence** 🟠 drops from enemies and is spent at the hub shop. **XP** ⚡ is earned automatically through skilled play and drives levelling. See [PROGRESSION.md](./PROGRESSION.md) for full economy math and item pool.

---

## 5. Characters

See [HUNTERS.md](./HUNTERS.md) for full character profiles.

### Quick Reference

| Hunter | Element | Status | Role | Origin |
|---|---|---|---|---|
| Dabik | Shadow | Bleed | Assassin | Caribbean-African |
| Benzu | Thunder/Earth | Stun | Tank | Brazilian |
| Sereisa | Lightning | Slow | Dasher | British-Nordic |
| Vesol | Flame | Burn | Mage | Japanese-Filipino |

---

## 6. Opponents

See [ENEMIES.md](./ENEMIES.md) for full enemy specs, AI states, and wave compositions.

| Enemy Type | Behaviour |
|---|---|
| Grunt | Standard melee — rushes players, basic attack pattern |
| Ranged Unit | Projectile attacker — keeps distance, fires at players |
| Bruiser | Slow, durable — high health, high pressure, hard to stagger |
| Mini-boss | Zone gatekeeper — stronger patterns, telegraphed attacks |
| Boss | Zone finale — multiple phases, dramatic telegraphs |

---

## 7. Game World & Zones

Zones are flat horizontal stages rendered in 2.5D — scrolling brawler-style arenas with parallax backgrounds and depth layers for visual richness. See [ZONES.md](./ZONES.md) for full zone details.

| Zone | Description | Boss |
|---|---|---|
| Hunter Hub | Safe area, shop, portal access, character select | None |
| City Breach | Ruined streets, introductory enemies | VRAEL — Fire Bruiser |
| Ruin Den | Underground dungeon, aggressive waves | ZARTH — Earth Tank |
| Shadow Core | Arcane corruption zone, most dramatic tone | KIBAD — Rogue Angel |
| Thunder Spire | Storm-struck tower peak, final zone | THYXIS — Thunder Beast |

---

## 8. Progression

See **[PROGRESSION.md](./PROGRESSION.md)** for the full spec.

### Summary

- **10 levels per run** — not 4. Levels 3 and 9 unlock spells. Levels 4 and 6 let you modify them. Level 7 locks your upgrade path. Level 10 delivers a capstone.
- **Spells are earned, not given** — you start with only your Minor spell. Advanced and Ultimate are unlocked mid-run through play.
- **Two currencies** — Essence (shop, drops from enemies) and XP (auto, rewards skill). They serve different purposes and never overlap.
- **Shop shows 5 items**, max 2 buys per visit, reroll for 30 Essence. Spell-specific items appear after L3. Path-weighted items surface after L7.
- **Upgrade paths** (Power / Survival / Mobility / Style) lock at L7 and shape the final 3 levels.

### XP Thresholds (Quick Reference)

| Level | XP needed |
|-------|-----------|
| 2 | 300 |
| 3 | 700 |
| 4 | 1,300 |
| 5 | 2,000 |
| 6 | 3,000 |
| 7 | 4,200 |
| 8 | 5,600 |
| 9 | 7,200 |
| 10 | 9,000 |

### Upgrade Paths
- **⚔️ Power** — damage, combo length, status amp, execute
- **🛡 Survival** — health, shield, lifesteal, second wind
- **💨 Mobility** — dodge distance, speed, extra charge, i-frames
- **✨ Style** — aura escalation, spell synergies, silent casting, crit weave

---

## 9. Controls

See [INPUT.md](./INPUT.md) for full control scheme including controller layout and hunter dodge differences.

| Action | Keyboard | Controller |
|---|---|---|
| Move | WASD | Left stick |
| Light Attack | J / Left mouse | X / Square |
| Heavy Attack | K / Right mouse | Y / Triangle |
| Dodge | Shift | B / Circle |
| Special | E | RB / R1 |
| Interact | F | A / Cross |

**Camera:** Fixed orthographic camera (2.5D). Zooms out smoothly when players spread apart. No rotation needed — readability is the priority.

---

## 10. Art & Audio

See [ANIMATIONS.md](./ANIMATIONS.md) for animation states and frame budgets.  
See [HUD.md](./HUD.md) for HUD layout and element specs.  
See [AUDIO.md](./AUDIO.md) for full SFX list and music direction.

- **Art** — dark, high contrast, stylized. 2D sprites billboarded in a 3D world, lit for 2.5D presentation. Combat effects glow strongly against dark world. Auras intensify with level.
- **Audio** — punchy, arcade-like, responsive to hits, upgrades, and boss moments.
- **Aura system** — aura intensity visually tied to level, darker and more dramatic as hunters grow stronger.
- **Parallax backgrounds** — 3-layer depth system per zone (background / midground / foreground).

---

## 11. Deployment

- Browser-based, single domain or subdomain
- No login, no signup, no loading screens
- Required Vibe Jam widget included in HTML:

```html
<script async src="https://vibej.am/2026/widget.js"></script>
```

---

## 12. MVP Scope

### Build Now
- One hunter hub
- All four hunters (Dabik, Benzu, Sereisa, Vesol)
- 1–4 local players
- Optional AI companion
- 3 enemy types (Grunt, Ranged, Bruiser)
- 1 miniboss (Gate Warden), 1 final boss per zone (4 total)
- Shop with items (see PROGRESSION.md)
- **10-level spell-linked progression system**
- **4 portal zones** (City Breach, Ruin Den, Shadow Core, Thunder Spire)
- Required Vibe Jam widget
- Instant browser loading

### Do Later
- Online multiplayer
- Additional hunters
- More zones
- Save system
- Quest and dialogue system
- Procedural generation
- Complex inventory management

---

## 13. Development

Built in Three.js using a 2.5D architecture. Key systems:
- Fixed orthographic camera with dynamic zoom
- X/Y plane movement and AABB hit detection
- Scene setup and zone management
- Local player handling (1–4)
- Combat, status effects, and synergies
- Enemy AI and boss phases (lane-based pathing)
- Mana, surge, and resource management
- **Shop, spell unlock, and 10-level upgrade flow** (see PROGRESSION.md)
- Portal transitions
- Parallax background layers (3 per zone)
- Vibe Jam widget integration

See [MVP-PLAN.md](./MVP-PLAN.md) for the full 18-day phased development timeline.
