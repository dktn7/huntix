# Huntix Hunter Character Art Prompts

Ready-to-run prompt templates for generating game-ready 2.5D character sprites
for all four Huntix S-Rank hunters.

## Tool Pipeline

| Step | Tool | Purpose |
|---|---|---|
| Step 1 | **Mixboard** (GPT Image 1.5) | Full-body reference sheet from text prompt |
| Step 2 | **Google Flow** (Nano Banana 2) | Game-master version — upload Step 1 output as reference image |
| Step 3 | **Google Flow** (Nano Banana 2) | 4-direction sprite sheet — upload Step 2 output as reference image |

> **Google Flow:** [labs.google/flow](https://labs.google/flow)
> Select Nano Banana 2 from the model dropdown. Use the reference image upload for Steps 2 and 3.
> Google Flow with Nano Banana 2 is free and supports reference-guided image generation.

Before running any prompt: read the pipeline in `../README.md`.
Phase gate: **Phase 3 (Days 7–9) only.**

> ⚠️ **All character details in this file are sourced from `docs/HUNTERS.md`.**
> If there is any conflict between this file and `docs/HUNTERS.md`, `docs/HUNTERS.md` wins.
> Do not update appearance details here without first updating `docs/HUNTERS.md`.

---

## Shared Art Direction Preamble

Include this context at the start of every session before running any of the hunter prompts below.
It keeps model outputs anchored to the Huntix visual identity.

```text
Huntix is a modern arcane action brawler. The visual world is dark urban fantasy —
concrete, neon, rune circuits, and gate energy. Characters are elite professional hunters
who live in a city layered with breach zones. They do not look like fantasy heroes.
They look like people who designed their gear for a specific lethal purpose.

Visual references (do not copy — use as tone anchors only):
- Hunter x Hunter: aura presence, silhouette clarity, elite hunter body language
- Hades (Supergiant): expressive faces, stylised dark palette, modern character design language
- Streets of Rage 4: clean 2.5D side-scroll readability, strong weapon profiles, urban grit
- Solo Leveling: moody urban arcane atmosphere, glowing power, dark battle environments
- Castle Crashers: co-op character distinction, bold readable shapes at small size,
  expressive idle personality, strong per-character colour identity

The Huntix aesthetic lives at the intersection of all five:
modern arcane professional + aura glow + 2.5D brawler readability.

Base world palette: deep navy, black, charcoal, steel, muted grey.
Clothing and armour: modern tailoring mixed with arcane battle gear — designed for a
specific purpose, not found. Characters look like professionals, not fantasy heroes.
Silhouette priority: head, shoulder, torso, weapon profile must all read clearly at small scale.
Camera: 2.5D orthographic side-scroll, slight top-down Y elevation, left/right primary facing.

Huntix logo: an angular H symbol — engraved or embossed on armour as agency insignia.
It reads as part of the world, not as branding or a sports jersey patch.
```

---

## DABIK — Shadow Striker

> Source: `docs/HUNTERS.md` — Dabik section
> Aura: Black with deep purple edges · Weapon: Twin curved daggers · Element: Shadow · Status: Bleed

### Step 1 — Mixboard / GPT Image 1.5: Full-Body Reference

```text
Create a full-body 2D game character sprite-style standing render of Dabik,
an elite S-Rank shadow hunter from a modern arcane urban world.

Physical identity: Caribbean-African heritage. Muscular and agile — compact power
built for burst movement and lethal close-range pressure. Fast shoulders and forearms,
not bulk for its own sake. Dark brown skin. Short wild spiky WHITE hair — natural
supernatural colouring, not dyed, tight coil at roots, spikes upward at crown.
Purple eyes — calm, unnatural, faint glow when shadow powers activate. Late twenties.

Costume: Minimal dark fitted layers — dark charcoal and black, nothing that catches
light. A high collar or slim hood that reads clearly in profile. Nothing restrictive.
No shine, no decoration, no emblems visible except the Huntix angular H symbol
engraved at one shoulder — agency insignia, not branding. No tribal markings.
Twin curved daggers worn low at each hip or crossed at the back — lightweight,
unmarked, no grip tape. Blades catch no light.

Aura: Barely visible in idle. A faint black-purple shadow spread at his feet and hands,
like a shadow cast from a light source that does not exist.

Pose: Neutral standing idle, full body head to boots visible, arms at sides or loosely
near his daggers. Absolutely still — this is a person who only moves when they mean to.
Slight weight on one foot, completely relaxed.

2.5D camera angle: near-front facing, slight top-down Y elevation, readable left-right profile.
Format: full body, centered, clean readable silhouette, feet not cropped. Transparent background.
No environment, no text, no frame, no shadow on ground, no extra characters.
```

---

### Step 2 — Google Flow / Nano Banana 2: Game-Master with Downscale Optimisation

> Upload Step 1 output as reference image in Google Flow before running this prompt.

```text
Image 1 = identity and costume anchor (full-body reference from Step 1).

Create a sprite-ready game-master version of this same character for a 2.5D
side-scrolling action brawler. Preserve full identity — dark brown skin,
short wild spiky WHITE hair, purple eyes, high collar or slim hood,
dark fitted layers, twin curved daggers at hips or back.

Optimise for small-frame readability when downscaled to 128×192 and 64×96:
slightly larger head-to-body ratio, chunkier boots and hands, simpler strap details
(fewer but bolder), stronger silhouette edges, cleaner separation between major
costume shapes (collar, chest, hips, legs), minimal texture noise.

Keep the aura suggestion: a faint black-purple darkening at the feet and hands,
as if his shadow is slightly wrong.

Background: exact flat chroma green #00FF00 — no gradient, no shadow, no floor,
no texture, no green spill onto the character. Full body visible head to boots.
No text, no frame, no environment, no extra props.
```

---

### Step 3 — Google Flow / Nano Banana 2: Direction Sheet (L/R + F/B)

> Upload Step 2 output as reference image in Google Flow before running this prompt.

```text
Image 1 = game-master sprite reference for identity, proportions, and rendering style.

Create a 2×2 character spritesheet showing Dabik in four facing directions with
maximum consistency between panels. Each cell contains one full-body standing idle pose.

Reading order:
- Top-left: facing LEFT (west side view, profile)
- Top-right: facing RIGHT (east side view, profile)
- Bottom-left: facing TOWARD camera (south, front view, slight 3/4)
- Bottom-right: facing AWAY from camera (north, back view)

Keep the same dark brown skin, short wild spiky WHITE hair, purple eyes,
high collar, dark fitted layers, twin curved daggers, and proportions across all four panels.
Adapt costume details correctly to each direction — back view should show hood/collar
from behind, side views show the dagger handles clearly.

Background: exact flat chroma green #00FF00 across the entire sheet —
no gradient, no shadow, no floor, no labels, no text, no borders.
All four panels at identical scale, figures anchored to the same bottom baseline.
```

**Post-processing:** Height-normalise all four frames to shared-height + shared-bottom-anchor before extracting.

---

## BENZU — Iron Breaker

> Source: `docs/HUNTERS.md` — Benzu section
> Aura: Deep red with gold fractures · Weapon: Stone-forged gauntlets · Element: Thunder/Earth · Status: Stun

### Step 1 — Mixboard / GPT Image 1.5: Full-Body Reference

```text
Create a full-body 2D game character sprite-style standing render of Benzu,
an elite S-Rank frontline hunter from a modern arcane urban world.

Physical identity: Brazilian heritage. Enormous. Built like architecture — not a trained
athlete, a person who was already this way and then an awakening made it official.
Bronze-orange skin. Long dirty-blonde mane — thick, heavy, worn loose past the
shoulders or roughly tied back. Dark roots. A jaw that looks carved. Late twenties
to early thirties.

Costume: Heavy custom armour plates — no manufacturer makes his size off the shelf.
Large shoulder plates, thick custom stone-forged gauntlets reinforced with gate ore
(the gauntlets are the weapon — they must read immediately as the focal point).
Reinforced boots, broad chest plate, layered torso protection. Deep charcoal base
with deep red accents and gate ore gold trim — nothing polished, everything functional
and heavy. The armour looks like it was made by someone who knew what it needed to stop.
Huntix angular H symbol engraved into the chest plate — agency insignia, not branding.

Aura: Deep red pulse with gold fractures at the knuckles and shoulder plates,
like fault lines about to break. Heavier and more grounded than the other hunters —
this aura pushes down, not out.

Pose: Neutral standing idle but rooted — weight distributed forward, knees very
slightly bent, fists loose at his sides, as if he is always half a second from
being ready. The posture communicates immovability without aggression.

2.5D camera angle: near-front facing, slight top-down Y elevation, readable left-right profile.
Format: full body, centered, strong silhouette (especially shoulder and gauntlet shapes),
feet not cropped. Transparent background.
No environment, no text, no frame, no shadow on ground, no extra characters.
```

---

### Step 2 — Google Flow / Nano Banana 2: Game-Master with Downscale Optimisation

> Upload Step 1 output as reference image in Google Flow before running this prompt.

```text
Image 1 = identity and costume anchor.

Create a sprite-ready game-master version of Benzu for a 2.5D side-scrolling action brawler.
Preserve full identity — bronze-orange skin, long dirty-blonde mane, enormous build,
heavy armour plates, custom stone-forged gauntlets as the clear focal point.

Optimise for small-frame readability at 128×192 and 64×96:
even broader shoulder silhouette, thicker gauntlet shapes, simplified armour panel edges
(fewer seams but bolder), stronger colour contrast between the deep red trim and
charcoal base, chunky readable boots. The gauntlets must remain clearly identifiable
even at the smallest frame size.

Aura: deep red pulse with gold fracture lines at knuckle plates and shoulder edges.

Background: exact flat chroma green #00FF00 — no gradient, no shadow, no floor,
no texture, no green spill onto the character. Full body visible head to boots.
No text, no frame, no environment.
```

---

### Step 3 — Google Flow / Nano Banana 2: Direction Sheet (L/R + F/B)

> Upload Step 2 output as reference image in Google Flow before running this prompt.

```text
Image 1 = game-master sprite reference.

Create a 2×2 character spritesheet showing Benzu in four facing directions.
Reading order: top-left = LEFT, top-right = RIGHT,
bottom-left = TOWARD camera (front), bottom-right = AWAY (back).

All panels: same enormous build, bronze-orange skin, long dirty-blonde mane,
heavy armour, custom stone-forged gauntlets.
Side views must show the gauntlet depth and shoulder plate width clearly.
Back view shows the full back plate, mane from behind, nape of the neck.

Background: exact flat chroma green #00FF00 across entire sheet.
All four panels at identical scale, figures anchored to same bottom baseline.
No labels, no text, no borders, no shadows.
```

---

## SEREISA — Storm Chaser

> Source: `docs/HUNTERS.md` — Sereisa section
> Aura: Bright yellow with white crackling edges · Weapon: Single lightning rapier · Element: Lightning · Status: Slow

### Step 1 — Mixboard / GPT Image 1.5: Full-Body Reference

```text
Create a full-body 2D game character sprite-style standing render of Sereisa,
an elite S-Rank speed hunter and arcane duelist from a modern urban world.

Physical identity: British-Nordic heritage. Tall, lean, sharp-featured.
Pale Nordic skin, light eyes, platinum hair kept short in a disconnected undercut —
skin fade on sides, top swept back. Fencing posture — upright, deliberate, always
balanced. Mid-to-late twenties.

Costume: Sleek, fitted, aerodynamic — fencing-inspired lines adapted for arcane combat.
Light plating at shoulders and forearms, polished modern combat tailoring in dark
charcoal and black, pale steel trim at collar and shoulders. Nothing heavy, nothing
that would slow her. Every seam is designed to not catch an edge.
Huntix angular H symbol engraved at the shoulder — agency insignia, not branding.
A single lightning rapier at her right side — slender, precise, permanently crackling
with electric charge along the full blade length. ONE weapon. Not twin blades.
The rapier silhouette is her visual identity — clean and aerodynamic.

Aura: bright yellow crackling at her hands and feet, white-edged, like static electricity
that has become intentional. Sparks at rest. The aura threads up the rapier blade.

Pose: Combat ready idle — weight slightly forward on the front foot, right hand near
the rapier handle, shoulders square, chin level. Trained to be ready before she
consciously decides to be.

2.5D camera angle: near-front facing, slight top-down Y elevation, readable left-right profile.
Format: full body, centered, feet not cropped. Transparent background.
No environment, no text, no frame, no ground shadow, no extra characters.
```

---

### Step 2 — Google Flow / Nano Banana 2: Game-Master with Downscale Optimisation

> Upload Step 1 output as reference image in Google Flow before running this prompt.

```text
Image 1 = identity and costume anchor.

Create a sprite-ready game-master version of Sereisa for a 2.5D side-scrolling brawler.
Preserve full identity — pale Nordic skin, platinum undercut, sleek charcoal combat
suit with pale steel trim, SINGLE lightning rapier at her right side.

Optimise for small-frame readability at 128×192 and 64×96:
cleaner suit seam lines (fewer but stronger), more visible bright yellow aura crackle
at hand and feet and along the rapier blade, rapier shape must remain clearly readable
as a single slender weapon even at smallest scale. Slightly larger head-to-body proportion.
The silhouette of the rapier extending past the hand is the key readability signal.

Background: exact flat chroma green #00FF00 — no gradient, no shadow, no floor,
no texture, no green spill onto the character. Full body visible head to boots.
```

---

### Step 3 — Google Flow / Nano Banana 2: Direction Sheet (L/R + F/B)

> Upload Step 2 output as reference image in Google Flow before running this prompt.

```text
Image 1 = game-master sprite reference.

Create a 2×2 character spritesheet showing Sereisa in four facing directions.
Reading order: top-left = LEFT, top-right = RIGHT,
bottom-left = TOWARD camera (front), bottom-right = AWAY (back).

All panels: platinum undercut, sleek charcoal suit with pale steel trim,
SINGLE lightning rapier visible at her right side in all four views.
Side views must show the rapier length and blade crackle clearly.
Back view shows the suit from behind, rapier at hip, undercut nape.

Background: exact flat chroma green #00FF00 across entire sheet.
All four panels identical scale, same bottom baseline.
No labels, no text, no borders.
```

---

## VESOL — Ember Mage

> Source: `docs/HUNTERS.md` — Vesol section
> Aura: Deep blue bleeding into crimson · Weapon: Gate crystal channelling focus at wrist · Element: Flame · Status: Burn

### Step 1 — Mixboard / GPT Image 1.5: Full-Body Reference

```text
Create a full-body 2D game character sprite-style standing render of Vesol,
an elite S-Rank arcane mage-hunter from a modern urban world.

Physical identity: Japanese-Filipino heritage. Composed, still in a way that reads
as dangerous rather than calm. Warm tan skin. Dark almond-shaped eyes.
Dark hair worn in a structured high bun — tight cylinder, architectural and deliberate.
Two jade pins crossed through the bun. 2-3 deep crimson streaks through the bun,
visible from front and side. One short strand escapes at the temple.
Late twenties.

Costume: Long structured coat in deep dark navy — tailored, clean seam lines,
not casual. Deep red inner lining visible at collar, cuffs, and coat hem.
Coat sits slightly open at the chest — layered mage-armour panel visible underneath
at chest and shoulders in dark charcoal with faint rune circuit engravings.
Standing coat collar — structured, upright. Crystal fittings at the collar and both cuffs.
Rune band on right wrist. Dark fitted trousers. Clean dark boots.
Huntix angular H symbol engraved or embossed on the left shoulder armour panel —
agency insignia, part of the world, not branding.
The channelling focus is the weapon: a slender rod of gate crystal ~20cm worn
at her left wrist, flush to the forearm. Faint cold blue inner glow at rest.
No physical blade of any kind. No sword, no dagger. The crystal rod only.

Aura: Cold blue flame particles rising from hands and feet — ~30cm radius.
Bleeds from cold blue core to deep crimson at outer edges. Calm at rest.

Pose: Precise idle — straight posture, crystal focus visible at left wrist,
right arm at side. Still the way a loaded weapon is still. No dramatic casting pose.

2.5D camera angle: near-front facing, slight top-down Y elevation, readable left-right profile.
Format: full body, centered, coat visible in full length, feet not cropped.
Transparent background. No environment, no text, no frame, no ground shadow.
```

---

### Step 2 — Google Flow / Nano Banana 2: Game-Master with Downscale Optimisation

> Upload Step 1 output as reference image in Google Flow before running this prompt.

```text
Image 1 = identity and costume anchor.

Create a sprite-ready game-master version of Vesol for a 2.5D side-scrolling brawler.
Preserve full identity — warm tan skin, dark architectural bun with jade pins and
crimson streaks, long structured navy coat with deep red lining, rune bands at wrists,
gate crystal focus at left wrist as the clear weapon focal point.

Optimise for small-frame readability at 128×192 and 64×96:
coat silhouette must remain clearly longer than a jacket (distinguishing shape);
crystal focus must be visible and glowing even at 64×96 — the cold blue glow on
the wrist crystal is the key readability signal. Bolder rune details where they appear.
Jade pins in the bun must remain a recognisable silhouette detail. Slightly larger
head-to-body ratio. Consistent low-level cold blue aura at both hands.

Background: exact flat chroma green #00FF00 — no gradient, no shadow, no floor,
no texture, no green spill onto the character. Full body visible head to boots.
```

---

### Step 3 — Google Flow / Nano Banana 2: Direction Sheet (L/R + F/B)

> Upload Step 2 output as reference image in Google Flow before running this prompt.

```text
Image 1 = game-master sprite reference.

Create a 2×2 character spritesheet showing Vesol in four facing directions.
Reading order: top-left = LEFT, top-right = RIGHT,
bottom-left = TOWARD camera (front), bottom-right = AWAY (back).

All panels: warm tan skin, dark architectural bun with jade pins, structured navy coat
with red lining, crystal focus visible at left wrist in all four views.
Hair remains in bun in ALL panels — never loose or falling.
Back view shows the full coat from behind, bun from above, crystal at wrist.
Side views show the coat length and crystal glow clearly.

Background: exact flat chroma green #00FF00 across entire sheet.
All four panels identical scale, same bottom baseline.
No labels, no text, no borders.
```

---

## Post-Processing Checklist (All Hunters)

After generating direction sheets for any hunter:

- [ ] Extract 4 individual frames from the 2×2 sheet
- [ ] Height-normalise: shared-height + shared-bottom-anchor across all 4 frames
- [ ] Key out chroma green `#00FF00` — check edges carefully for green spill
- [ ] Export as PNG with transparency at the target frame sizes: 256×384, 128×192, 64×96
- [ ] Save under `assets/textures/characters/<hunter-name>/frames/`
- [ ] Save chroma-key intermediate under `assets/textures/characters/<hunter-name>/direction-sheet-chroma.png`
- [ ] Log experiment run in `experiments/<timestamp>-<hunter>-direction-sheet/`
