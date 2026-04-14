# HUNTIX Visual Design Spec

> **Source of truth for visual style, art direction, and character prompts.**
> For canonical character stats, lore, and appearance — defer to `docs/HUNTERS.md`.
> For canonical weapon details — defer to `docs/WEAPONS.md`.

---

## 1. High Concept

Huntix is a 2.5D Three.js browser brawler set in a modern arcane world where elite hunters defend city districts from gate breaches. The game blends urban dark fantasy, dramatic aura powers, readable co-op combat, and short run-based progression.

---

## 2. Design Pillars

- Instant play in the browser — no login, no loading screens
- Dark urban fantasy with arcane glow and material contrast
- Readable 2.5D combat — strong silhouettes, clear weapon identity
- 1–4 local co-op hunters — fast, chaotic, satisfying
- Run-based progression that feels powerful without becoming complex

---

## 3. Inspirations

Three references — use as tone anchors, not visual copies:

| Reference | What it gives Huntix |
|---|---|
| **Solo Leveling** | Dark urban arcane atmosphere, gate/breach world feel, aura as identity, dramatic power escalation |
| **Castle Crashers** | Co-op character distinction, bold readable shapes, expressive idle personality, distinct per-character colour identity |
| **Dead Cells** | Tight dodge timing, snappy animation feel, status effect synergies, weight on every hit |

---

## 4. World Tone

A contemporary city layered with breach zones, hunter guild infrastructure, arcane research, and elemental danger. Streetlights, concrete, glass, neon, rune circuits, and gate energy coexist. Stylish and dangerous — not cute, not comedic.

---

## 5. Visual Style

Dark urban palettes, arcane glow, and modern combat gear designed for a specific purpose. Characters look like professionals who live in a world of breaches — not fantasy heroes.

- Base palette: deep navy, black, charcoal, steel, muted grey
- Each hunter defined by their aura colour — that is their brand
- Strong silhouettes above all else — profile clarity wins over surface detail
- Clothing and gear: designed, not found. Modern and functional.
- NOT: chibi, western cartoon, generic fantasy, tribal markings

---

## 6. The Huntix Logo on Clothing

Every hunter wears the Huntix H emblem on their gear. It is **agency insignia** — it communicates team, rank, and world.

| Hunter | Logo placement | Material |
|---|---|---|
| **Dabik** | Left shoulder | Dark embossed — nearly invisible except at close range |
| **Benzu** | Chest | Gate ore inlay — gold-orange, visible |
| **Sereisa** | Left shoulder | Pale steel inlay — clean and minimal |
| **Vesol** | Left shoulder | Crystal inlay — cold blue |

The logo is **part of the world**, not branding. It should feel like a hunter guild patch, not a sports jersey. Each material matches the hunter's palette and element.

---

## 7. Character Clothing

All clothing is modern functional gear designed for arcane combat — not fantasy armour, not casual streetwear.

### Dabik
Dark fitted tactical layers — matte black and dark charcoal. High collar or slim hood. Nothing catches light. No buckles, no decorative detail. Gear chosen to disappear.

### Benzu
Heavy custom combat gear — deep red and black. No manufacturer makes his size off the shelf. Thick reinforced pauldrons, broad chest layer, heavy dark boots. Visibly worn — dented, repaired, still standing.

### Sereisa
Sleek fitted combat gear — dark charcoal and black with pale steel trim at collar and shoulders. Fencing-inspired seam lines — nothing restrictive, nothing that would slow her. Designed to move in.

### Vesol
Long structured coat — deep dark navy, tailored clean seam lines. Deep red inner lining visible at collar, cuffs, and coat hem. Layered combat gear underneath at chest and shoulders — dark charcoal with faint rune circuit detail. Standing collar. Crystal fittings at collar and both cuffs. Rune band on right wrist.

---

## 8. Character Art Philosophy

Design around story first, then role, then class readability. Armour and clothing should reflect where each hunter came from and how they fight. In 2.5D, profile clarity matters more than surface detail — each hunter needs a strong body shape, weapon shape, and stance.

---

## 9. Weapon Styling

Weapons belong to the hunter — not generic loot. Every weapon needs a clear silhouette and a readable side-camera profile.

| Hunter | Weapon | Feel |
|---|---|---|
| Dabik | Twin curved daggers | Sharp and light — blades catch no light |
| Benzu | Stone-forged gauntlets | Heavy and solid — gate ore veins glow |
| Sereisa | Single lightning rapier | Fast and precise — permanently crackling |
| Vesol | Gate crystal focus at wrist | Refined and dangerous — no blade |

---

## 10. 2.5D Model Rules

Side-view camera — most important shapes are head, shoulders, torso, hips, legs, weapon outline. Avoid tiny detail clutter. Prioritise large readable forms. Collars, shoulder shapes, belt lines, and weapon length matter more than micro-detail.

---

## 11. Colour System

| Hunter | Primary | Secondary | Aura |
|---|---|---|---|
| Dabik | Black `#1a1a2e` | Purple `#9b59b6` | Black-purple fade |
| Benzu | Deep red `#c0392b` | Gold `#f39c12` | Red-gold pulse |
| Sereisa | Bright yellow `#f1c40f` | White `#ecf0f1` | Yellow-white crackle |
| Vesol | Deep blue `#2980b9` | Crimson `#e74c3c` | Blue-to-crimson shift |

---

## 12. Animation Language

Broad and readable. Dodges need a strong lean, attacks need clear wind-ups, casts need visible preparation. Each hunter should have a distinct idle, combat stance, and movement rhythm that matches their personality. Dead Cells feel throughout — snappy, no floaty motion, every hit has weight.

See [ANIMATIONS.md](./ANIMATIONS.md) for full frame budgets and state machine spec.

---

## 13. HUD

See [HUD.md](./HUD.md) for full HUD layout. Compact and modern — health red, mana blue, surge yellow.

---

## 14. Zone Visual Themes

| Zone | Visual Theme |
|---|---|
| Hunter Hub | Modern arcane safe zone — concrete, rune lighting, agency branding |
| City Breach | Broken city — cracked asphalt, orange fire glow, neon fragments |
| Ruin Den | Underground ruin — dark grey, green gate glow, dust haze |
| Shadow Core | Pure void — black, deep purple, white energy cracks |
| Thunder Spire | Storm tower — dark navy, electric blue, white lightning |

---

## 15. Mixboard Prompts

> Use these prompts in Mixboard (GPT Image 1) to generate character design reference sheets.
> Output from Mixboard feeds into the fal.ai pipeline in `bonus/huntix-character-art/`.
> Do NOT run these prompts until you have confirmed the design lock in `docs/VISUAL-REFERENCE.md`.

### Shared preamble — include at the start of every session

```
Huntix is a dark stylised action brawler. Characters are elite S-Rank hunters
who defend a modern city from arcane gate breaches.

Tone references (do not copy — use as anchors):
- Solo Leveling: dark urban arcane world, aura as identity, gate/breach atmosphere,
  dramatic power escalation, S-rank professional presence
- Castle Crashers: bold readable character shapes at small scale, strong per-character
  colour identity, expressive idle personality, co-op team distinction
- Dead Cells: tight snappy animation language, weight on every hit, status synergies

Visual rules:
- Dark base palette: deep navy, black, charcoal, steel, muted grey
- Each hunter's aura colour is their brand — make it visible
- Silhouette clarity wins over surface detail
- Clothing is modern functional gear — designed, not found
- The Huntix H emblem appears on every hunter's gear as agency insignia —
  part of the world, not decoration
- NOT: chibi, generic fantasy armour, tribal markings, casual streetwear,
  ornate decoration, bright base colours
```

---

### DABIK — Shadow Striker

```
Create a professional character design sheet for a 2D dark action brawler.
Divide into three vertical sections:
- Left: front, side, back views (full body)
- Centre: face portrait + twin curved dagger detail
- Right: hero pose — 2.5D angled 3/4 brawler camera

SOLID GREEN background (#00FF00). 9:16. High resolution.
NOT chibi. NOT generic fantasy. Dark stylised action game. No text. No UI.

CHARACTER:
Caribbean-African man. Muscular and agile — compact power built for burst movement.
Dark brown skin. Short wild spiky WHITE hair — natural, not dyed,
tight coil roots, spikes upward at crown.
Purple eyes — calm, unnatural stillness, faint glow in power states.

CLOTHING:
Dark fitted tactical layers — matte black and dark charcoal.
High collar or slim hood. Nothing catches light.
No buckles, no tribal markings, no decorative detail.
Dark trousers. Flat dark boots.
Huntix H emblem on left shoulder — dark embossed, nearly invisible,
reads as a guild mark not a logo.

WEAPON:
Twin curved daggers — one at side, one reverse-grip at back hip.
No markings, no grip tape. Worn from use. Short curved blades.

AURA:
Black with deep purple edges. Does not flare.
Spreads close to the body like a shadow at dusk.
Purple sheen at crown of hair under shadow light.

COLOUR PALETTE: Matte black, deep purple edge-glow, dark charcoal,
muted silver blade edges, white hair as high contrast.
```

---

### BENZU — Iron Breaker

```
Create a professional character design sheet for a 2D dark action brawler.
Divide into three vertical sections:
- Left: front, side, back views (full body)
- Centre: face portrait + stone-forged gauntlet detail
- Right: hero pose — 2.5D angled 3/4 brawler camera

SOLID GREEN background (#00FF00). 9:16. High resolution.
NOT chibi. NOT generic fantasy. Dark stylised action game. No text. No UI.

CHARACTER:
Brazilian man. Enormous broad build — built like architecture, immovable.
Bronze-orange skin. Long dirty-blonde mane — thick, heavy, loose or roughly tied.
Dark roots. Heavy carved jaw. Takes up more space than anyone else.

CLOTHING:
Heavy custom combat gear — deep red and black.
No manufacturer makes his size. Thick reinforced pauldrons, broad chest layer.
Heavy dark boots. Gear is visibly worn — dented, repaired, still standing.
Huntix H emblem on chest — gate ore inlay, gold-orange, clearly visible.
The emblem looks like it has been through as many gates as he has.

WEAPON:
Stone-forged gauntlets — both fists and forearms to the elbow.
Dark stone with glowing gate ore veins — deep gold-orange.
Knuckles show impact damage.

AURA:
Deep red with gold fractures. Does not shimmer.
Pulses rhythmically — heat building under stone.
Concentrated at fists and boots. Intensifies before impact.

COLOUR PALETTE: Deep red, ember black, gold fracture glow, bronze-orange skin,
dirty-blonde hair as contrast element.
```

---

### SEREISA — Storm Chaser

```
Create a professional character design sheet for a 2D dark action brawler.
Divide into three vertical sections:
- Left: front, side, back views (full body)
- Centre: face portrait + single lightning rapier detail
- Right: hero pose — 2.5D angled 3/4 brawler camera

SOLID GREEN background (#00FF00). 9:16. High resolution.
NOT chibi. NOT generic fantasy. Dark stylised action game. No text. No UI.

CHARACTER:
British-Norwegian woman. Tall, lean, sharp-featured.
Pale Nordic skin. Light focused eyes.
Fencer's posture — upright, deliberate, always balanced.

HAIR:
Platinum white — natural Nordic near-white, not dyed.
Disconnected undercut — skin fade sides, top swept back to one side.
Moves with her. Lightning threads through at full power.

CLOTHING:
Sleek fitted combat gear — dark charcoal and black.
Pale steel trim at collar and shoulders.
Fencing-inspired seam lines — nothing restrictive, designed to move in.
Huntix H emblem at left shoulder — pale steel inlay, minimal.
Reads as precision — the same quality as the rapier.

WEAPON:
SINGLE lightning rapier — right hand, slender, one weapon.
Permanently crackling yellow-white along the full blade length.
NOT twin blades. The rapier silhouette is her visual identity.

AURA:
Bright yellow with white crackling edges.
Sparks at hands and feet. Threads up the rapier blade.

COLOUR PALETTE: Charcoal black, pale steel trim, bright yellow aura,
white lightning crackle, platinum hair as contrast.
```

---

### VESOL — Ember Mage

```
Create a professional character design sheet for a 2D dark action brawler.
Divide into three vertical sections:
- Left: front, side, back views (full body)
- Centre: face portrait + left wrist crystal focus detail
- Right: hero pose — 2.5D angled 3/4 brawler camera

SOLID GREEN background (#00FF00). 9:16. High resolution.
NOT chibi. NOT generic fantasy. Dark stylised action game. No text. No UI.

CHARACTER:
Japanese-Filipino woman. Defined, poised, refined. Warm tan skin.
Dark almond-shaped eyes — composed, dangerous calm, not cold.

HAIR:
Dark near-black — structured high bun, architectural and deliberate.
Two jade pins crossed through the bun — visible silhouette detail.
2-3 deep crimson streaks visible from front and side.
One short strand loose at the temple — the only imprecision she allows.

CLOTHING:
Long structured coat — deep dark navy, tailored clean seam lines.
Deep red inner lining visible at collar, cuffs, and coat hem.
Layered combat gear underneath at chest and shoulders —
dark charcoal with faint rune circuit detail.
Standing collar — structured, upright.
Crystal fittings at collar and both cuffs.
Rune band on right wrist. Dark fitted trousers. Clean dark boots.
Huntix H emblem on left shoulder — crystal inlay, cold blue.
Reads as a researcher's field kit built for someone who became dangerous.

WEAPON:
Left wrist: slender gate crystal rod ~20cm, flush to the forearm.
Faint cold blue inner glow at rest. No blade. No handle.

AURA:
Cold blue particles rising from hands and feet.
Bleeds from cold blue core to deep crimson at outer edges.
Calm at rest. Does not flare outside the hero pose.

COLOUR PALETTE: Deep navy, dark charcoal, deep red lining,
cold blue crystal glow, jade pin accent.
```

---

## 16. Grok Animation Prompts

> Use these after the Mixboard design sheet is locked.
> Feed the Mixboard output as the reference image into Grok.

### DABIK

```
IDLE:
2D sidescroller. Dead Cells animation feel — minimal, deliberate, no floaty motion.
Character: muscular dark-brown-skinned man, matte black tactical layers,
short wild spiky WHITE hair, purple eyes, twin curved daggers.
Almost no idle movement — weight shifts once, one dagger taps the thigh.
Purple-black shadow aura drifts low at feet and hands.
3-second seamless loop. Green (#00FF00) background. Fixed 2.5D brawler angle.

LIGHT ATTACK (3-hit combo):
Same character. Explosive from stillness, instant return to idle.
Step in, slash, slash, reverse-grip finish. Under 0.8 seconds total.
Motion blur on blades. No flourish. Pure efficiency.
Green background. Fixed 2.5D angle.

DODGE — BLINK:
Vanishes in shadow burst — reappears behind enemy space, dagger raised.
Shadow lingers 0.4 seconds at origin point. 0.3 second total duration.
Green background. Fixed 2.5D angle.

ULTIMATE — MONARCH'S DOMAIN:
Raises one hand slowly. Shadow expands from feet outward across screen.
Purple-black covers arena edges. Steps into invisibility.
Afterimage remains 1 second. 2-second build before release.
Green background. Fixed 2.5D angle.
```

### BENZU

```
IDLE:
2D sidescroller. Dead Cells feel — weight is everything, no floaty motion.
Character: enormous bronze-orange-skinned man, long dirty-blonde hair,
heavy deep red and black combat gear, stone gauntlets with gold gate-ore glow.
Idle: arms at sides or crossed, breathing slow and heavy.
Gold aura pulses in gauntlets once every 2 seconds.
3-second seamless loop. Green background. Fixed 2.5D brawler angle.

LIGHT ATTACK (3-hit combo):
Same character. Slow wind-up, devastating release.
Wide hook, overhead slam, ground punch. Shockwave ripple on each hit.
Hitstop 1–2 frames on each impact. Gold aura flares on contact.
Green background. Fixed 2.5D angle.

DODGE — SHOULDER CHARGE:
Lowers head, drives forward shoulder-first. Short burst forward.
Gold-red aura flares on contact. 0.4 second duration. Not elegant. Effective.
Green background. Fixed 2.5D angle.

ULTIMATE — TITAN'S WRATH:
Raises both fists overhead slowly — aura blazes full gold-red.
Slams both gauntlets into ground. Shockwave cracks radiate full screen.
2-second cinematic build before impact.
Green background. Fixed 2.5D angle.
```

### SEREISA

```
IDLE:
2D sidescroller. Dead Cells — coiled energy, precise micro-movements, no floaty motion.
Character: tall pale Nordic woman, dark charcoal fitted combat gear,
platinum undercut hair, SINGLE lightning rapier crackling yellow-white in right hand.
Weight slightly forward, rapier held low but live. Lightning arcs along blade.
3-second seamless loop. Green background. Fixed 2.5D brawler angle.

LIGHT ATTACK (3-hit combo):
Same character. Fastest combo on the roster.
Fencing-style: thrust, parry-slash, full dash-through.
Third hit: complete pass-through, lightning trail left behind.
Yellow spark burst on each hit. Total combo under 0.6 seconds.
Green background. Fixed 2.5D angle.

DODGE — ELECTRIC DASH:
Full forward dash through enemy space. Zero hesitation.
Yellow-white electric trail persists 0.5 seconds after.
0.2 second total duration.
Green background. Fixed 2.5D angle.

ULTIMATE — STORM SURGE:
Aura explodes full yellow-white. Body becomes a blur.
Every dash shown as streaking lightning lines across screen.
6-second duration. 2-second build before burst releases.
Green background. Fixed 2.5D angle.
```

### VESOL

```
IDLE:
2D sidescroller. Dead Cells feel — composed stillness, no floaty motion.
Character: slender Japanese-Filipino woman, long structured navy coat,
dark architectural bun with crimson streaks, wrist crystal glowing cold blue.
Gentle idle breathing — shoulders rise and fall. Crystal pulses softly.
Cold blue particles drift upward slowly from hands.
3-second seamless loop. Green background. Fixed 2.5D brawler angle.

LIGHT ATTACK (3-hit combo):
Same character. Precise, controlled, crisp.
Right hand raises, wrist crystal brightens blue-to-crimson, bolt fires, returns to stance.
3 hits. Controlled. No wasted movement. Aura flares on each cast.
Green background. Fixed 2.5D angle.

DODGE — FLAME SCATTER:
Steps back, releases ember burst outward from both hands.
Aura flares crimson for the duration, snaps back to blue.
Instant commitment. 0.5 seconds.
Green background. Fixed 2.5D angle.

ULTIMATE — INFERNO:
Raises both arms — aura shifts fully crimson, screen edge glow builds.
Stands in centre of growing inferno. Visibly immune. Composed. Still.
2-second build. She is the furnace.
Green background. Fixed 2.5D angle.
```

---

## 17. Final Look

Huntix should feel like a dark stylised action brawler with premium visual readability. Characters look like elite hunters from a living city. Combat should feel sharp enough to sell every aura flare and weapon swing.
