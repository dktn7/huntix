# HUNTIX Game Design Document

> Hunt. Enter. Survive.

*Last updated April 13, 2026*
*Team: Solo developer with AI assistance*

---

## 1. Game Overview

Huntix is a browser-based **2.5D** action beat 'em up built in Three.js where 1 to 4 hunters fight through portal-linked combat zones. The game uses a dark action-fantasy tone inspired by Solo Leveling, with fast combat, elite hunter characters, and a sense of escalation as players grow stronger through upgrades and boss fights.

**Inspired by:**
- **Solo Leveling** — dark hunter fantasy, ranked elites, dramatic auras, power escalation
- **Castle Crashers** — 4 distinct characters, elemental identities, chaotic co-op, readable silhouettes
- **Dead Cells** — tight dodge timing, status effect synergies, movement as a weapon, builds that scale

The game is a stand-alone browser experience with no login, no heavy downloads, and instant entry. Designed for short sessions, strong combat feedback, co-op chaos, and polished action-game presentation.

> **Rendering approach:** Three.js with 3D models rendered on a fixed orthographic camera — 2.5D style. Movement is constrained to the X/Y plane. This gives the visual quality of 3D assets with the readability and simplicity of a 2D brawler.

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

| Tier | Mana Cost | Speed | Effect |
|---|---|---|---|
| Minor | Low | Instant | Quick status apply, short dash, small hit |
| Advanced | Medium | Short wind-up | Area effect, combo extender, shield |
| Ultimate | Full Surge bar | Cinematic wind-up | Hunter-specific, unstoppable moment |

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
Enemies and bosses drop gold or essence spent at the hub shop between zones. Light economy focused on combat progression, not inventory simulation.

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

| Enemy Type | Behaviour |
|---|---|
| Grunt | Standard melee — rushes players, basic attack pattern |
| Ranged Unit | Projectile attacker — keeps distance, fires at players |
| Bruiser | Slow, durable — high health, high pressure, hard to stagger |
| Mini-boss | Zone gatekeeper — stronger patterns, telegraphed attacks |
| Boss | Zone finale — multiple phases, dramatic telegraphs |

---

## 7. Game World & Zones

Zones are flat horizontal stages rendered in 2.5D — scrolling brawler-style arenas with parallax backgrounds and depth layers for visual richness.

| Zone | Description | Focus |
|---|---|---|
| Hunter Hub | Safe area, shop, portal access, character select | Setup, atmosphere |
| City Breach | Ruined streets, introductory enemies and miniboss | Movement, basic combat |
| Ruin Den | Underground dungeon, aggressive waves | Spacing, timing, item use |
| Shadow Core | Final boss zone, most dramatic tone | Full kit, teamwork, ultimates |

---

## 8. Progression

### Shop Items

| Category | Examples |
|---|---|
| Power | Damage boost, combo extender, special power upgrade |
| Survival | Health restore, armor, recovery speed |
| Utility | Mana regen boost, cooldown reduction, reroll |
| Cosmetic | Aura colours, weapon skins, visual effects |

### Level-Up System

| Level | Unlock |
|---|---|
| 1 | Base hunter kit |
| 2 | Unlock a modifier |
| 3 | Choose an upgrade path |
| 4 | Strengthen chosen path |

### Upgrade Paths
- **Power** — damage, combo length, special impact
- **Survival** — health, shield, recovery
- **Mobility** — dodge distance, speed, cooldown
- **Style** — aura intensity, cosmetic flair, silent casting

---

## 9. Controls

| Action | Keyboard | Controller |
|---|---|---|
| Move | WASD | Left stick |
| Light Attack | Left mouse | X / Square |
| Heavy Attack | Right mouse | Y / Triangle |
| Dodge | Shift | B / Circle |
| Special | E | RB / R1 |
| Interact | F | A / Cross |

**Camera:** Fixed orthographic camera (2.5D). Zooms out smoothly when players spread apart. No rotation needed — readability is the priority.

---

## 10. Art & Audio

- **Art** — dark, high contrast, stylized. 3D models lit for 2.5D presentation. Combat effects glow strongly against dark world. Auras intensify with level.
- **Audio** — punchy, arcade-like, responsive to hits, upgrades, and boss moments.
- **Aura system** — aura intensity visually tied to level, darker and more dramatic as hunters grow stronger.
- **Parallax backgrounds** — multi-layer depth scrolling behind the flat combat plane for visual depth.

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
- 3 enemy types
- 1 miniboss, 1 final boss
- Shop with items
- Level-up power system
- 3 short portal zones
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
- Shop and upgrade flow
- Portal transitions
- Parallax background layers
- Vibe Jam widget integration
