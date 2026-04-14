# HUNTIX Full Design Spec v2

> **Source of truth for visual style and art direction.**
> For character appearance details (skin, hair, eyes, build) always defer to `docs/HUNTERS.md`.
> For weapon identity always defer to `docs/HUNTERS.md` and `docs/WEAPONS.md`.

## 1. High Concept
Huntix is a 2.5D Three.js browser action game set in a modern arcane world where elite hunters defend city districts from gate breaches. The game blends urban fantasy, dramatic aura powers, readable co-op combat, and short run-based progression. The core fantasy is simple: enter a breach, survive the zone, defeat the boss, return stronger.

## 2. Design Pillars
- Instant play in the browser with no login and no loading screens.
- Stylish modern arcane fantasy with urban textures and magical tech.
- Readable 2.5D combat with strong silhouettes and clear weapon identity.
- 1-4 local co-op hunters with fast, chaotic, satisfying combat.
- Run-based progression that feels powerful without becoming complex.

## 3. World Tone
The world is a contemporary city layered with hidden breach zones, hunter guild infrastructure, arcane research, and elemental danger. Streetlights, concrete, glass, neon, rune circuits, and gate energy all coexist. The tone should feel stylish and dangerous rather than cute or comedic.

## 4. Visual Style
Use dark urban palettes, reflective surfaces, arcane glow, and clean modern tailoring mixed with battle armor. Characters should look like professionals who live in a world of breaches and elite combat. The visual emphasis is on sharp silhouettes, aura color, weapon glow, and material contrast.

## 5. Branding
The Huntix symbol stays fixed as the main brand icon. The icon should appear on the title screen, hub signage, menus, portal gates, reward screens, and loading-free splash moments. Colors can shift by zone or hunter, but the symbol itself remains constant.

Logo files: `assets/logo-huntix.png` and `assets/logo-huntix-concept.png`

## 6. Character Art Philosophy
Characters should be designed around story first, then role, then class readability. Armor, clothing, and accessories should reflect where each hunter came from, how they fight, and what kind of power they wield. In 2.5D, profile clarity matters more than surface detail, so each hunter needs a strong body shape, weapon shape, and stance.

## 7. Hunters

> ⚠️ Appearance details below are summaries only. Full canonical descriptions live in `docs/HUNTERS.md`.
> Do not use this section as a prompt source — use `docs/HUNTERS.md` and `docs/VISUAL-REFERENCE.md`.

### Dabik
Dabik should look like a shadow tracker from a modern hunter network. Muscular and agile — compact power. Dark brown skin, short wild spiky white hair, purple eyes. He wears dark fitted tactical layers, minimal armor, a high collar or hood option, and understated gear that suggests stealth and precision. His twin curved daggers should be the visual focal point, with a black-purple aura and thin shadow trails.

### Benzu
Benzu should look like a heavy frontline breaker built from construction strength and gate reinforcement. Bronze-orange skin, long dirty-blonde mane. He wears large custom armor plates, thick stone-forged gauntlets, reinforced boots, and broad shoulder shapes. His red-gold thunder aura should make him feel immovable, loud, and dangerous.

### Sereisa
Sereisa should look like an elite arcane duelist and speed specialist. Pale Nordic skin, platinum undercut. Her style should be sleek, fitted, and aerodynamic, with fencing-inspired lines, light plating, and polished modern combat tailoring. Her single lightning rapier — slender, precise, permanently crackling with electric charge — and yellow-white lightning aura should make her read as the fastest hunter in motion. The single rapier keeps her silhouette clean and aerodynamic.

### Vesol
Vesol should look like a modern arcane researcher turned battlefield mage. Warm tan skin, dark hair in a controlled architectural bun. She wears structured coats, layered mage-armor, crystal fittings, rune bands, and disciplined, elegant shapes. Her gate crystal channelling focus at the wrist should be central, and her blue-to-crimson flame aura should suggest controlled heat and precision.

## 8. Class and Style Relationship
Class should influence posture, animation language, and combat clarity, but not lock the characters into bland archetypes. A character can look like a strategist, a technician, a warrior, or an investigator as long as the weapon, stance, and aura still communicate gameplay role. This allows the cast to feel more personal and memorable.

## 9. Weapon Styling
Weapons should feel like they belong to the hunter, not like generic loot. Every weapon needs a clear silhouette, a readable profile from the side camera, and a distinct elemental effect. Daggers should feel sharp and light, gauntlets heavy and solid, the lightning rapier fast and precise, and flame focuses refined and dangerous.

## 10. 2.5D Model Rules
The side-view camera means the most important shapes are head, shoulders, torso, hips, legs, and weapon outline. Avoid tiny detail clutter and prioritize large readable forms. Capes, collars, shoulder plates, belt shapes, and weapon length are more important than micro-detail. Armor should move enough to feel alive, but not so much that it muddies the silhouette.

## 11. Animation Language
Animations should be broad and readable. Dodges need a strong lean, attacks need clear wind-ups, and casts need visible hand or weapon preparation. Each hunter should have a distinct idle pose, combat stance, and movement rhythm that matches their personality.

See [ANIMATIONS.md](./ANIMATIONS.md) for full frame budgets and state machine spec.

## 12. Color System

Base world colors should be dark navy, black, charcoal, steel, and muted gray. Hunter accent colors should be bold and individual:

| Hunter | Primary | Secondary | Aura |
|---|---|---|---|
| Dabik | Black `#1a1a2e` | Purple `#9b59b6` | Black-purple fade |
| Benzu | Deep red `#c0392b` | Gold `#f39c12` | Red-gold pulse |
| Sereisa | Bright yellow `#f1c40f` | White `#ecf0f1` | Yellow-white crackle |
| Vesol | Deep blue `#2980b9` | Crimson `#e74c3c` | Blue-to-crimson shift |

UI accents can echo each hunter color without overwhelming readability.

## 13. HUD
See [HUD.md](./HUD.md) for full HUD layout. The HUD stays compact and modern with clear color coding — health red, mana blue, surge yellow. Co-op players need easy-to-read indicators at all times.

## 14. Resource System
Each hunter uses health, mana, surge, and stamina. Health defines survival, mana powers special abilities, surge unlocks ultimates, and stamina prevents sprint/dodge spam. Simple enough to learn quickly, deep enough to reward timing.

## 15. Stamina
Stamina is a tactical limiter, not a punishment. Dodges and sprinting drain stamina, while passive regen and successful hits restore momentum. When stamina is low, the UI warns the player visually without making the game feel sluggish.

## 16. Combat Feel
Combat should feel close, crisp, and impactful. Enemies need obvious attack telegraphs, hit sparks, stagger, screen shake, and short hitstop. The game should encourage timing, spacing, and combo execution rather than random button pressing.

See [AGENTS.md](../AGENTS.md) for exact hitstop values and combat feel rules.

## 17. Status Synergies
The elemental pairings are a major identity feature. Bleed and slow work together for setup and punishment, stun and wall trap enemies, slow and blink create opening windows, and burn plus slam creates brutal area control. These synergies make the hunters feel like a coordinated elite squad.

## 18. Zone Structure
See [ZONES.md](./ZONES.md) for full zone details including parallax layers, dimensions, and wave compositions.

| Zone | Visual Theme |
|---|---|
| Hunter Hub | Modern arcane safe zone — concrete, rune lighting, agency branding |
| City Breach | Broken city — cracked asphalt, orange fire glow, neon fragments |
| Ruin Den | Underground ruin — dark grey, green gate glow, dust haze |
| Shadow Core | Pure void — black, deep purple, white energy cracks |
| Thunder Spire | Storm tower — dark navy, electric blue, white lightning |

## 19. Progression
Short runs, upgrades, repeatable zones. Players earn currency from enemies and bosses, spend it in the hub. Progression should always make the player feel more elite, more dangerous, and more visually dramatic.

## 20. Shop and Cosmetics
The shop sells survival, power, mobility, utility, and cosmetic upgrades. Cosmetic options include aura intensity, armor tint, weapon skin, and minor visual variants. Changes keep character identity intact. See [CUSTOMIZATION.md](./CUSTOMIZATION.md) for full customization spec.

## 21. Audio Direction
Audio should feel punchy, modern, and magical. Hunter movement, weapon impacts, aura bursts, and boss attacks need distinct sound layers. Premium action anime game, not generic fantasy hack-and-slash. See [AUDIO.md](./AUDIO.md) for full SFX and music list.

## 22. Technical Direction
Build in Three.js with a lightweight, optimized asset pipeline. Low-poly readable models, instancing where possible, fast startup over visual excess. See [TECHSTACK.md](./TECHSTACK.md) for full tech decisions.

## 23. MVP Scope
- One hub
- Four hunters
- 1-4 local players
- Optional AI companion fill
- 3 enemy types
- 1 miniboss, 1 final boss per zone (4 total)
- Shop and cosmetic system
- Stamina, mana, and surge systems
- Required Vibe Jam widget
- Instant browser loading

## 24. What To Build First
1. Fixed 2.5D camera
2. Hub scene with Huntix symbol
3. One hunter with movement, attack, dodge, stamina
4. One enemy type
5. One weapon style pass
6. Aura and hit effect system
7. Local co-op input support
8. Zone transitions
9. Shop and upgrade menu
10. Boss telegraph prototype

## 25. Final Look
Huntix should feel like a modern arcane action anime brought into a browser game with premium readability. The characters should look like elite hunters from a living city, the world should feel dangerous and stylish, and the combat should feel sharp enough to sell every aura flare and weapon swing.
