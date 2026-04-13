# Huntix Hunter Character Art Prompts

Ready-to-run prompt templates for generating game-ready 2.5D character sprites
for all four Huntix S-Rank hunters via fal.ai + GPT Image 1.5 + Nano Banana 2.

Before running any prompt: read the pipeline in `../README.md`.
Phase gate: **Phase 3 (Days 7–9) only.**

---

## Shared Art Direction Preamble

Include this context at the start of every session before running any of the hunter prompts below.
It keeps model outputs anchored to the Huntix visual identity.

```text
Huntix is a modern arcane action brawler. The visual world is dark urban fantasy —
concrete, neon, rune circuits, and gate energy. Characters are elite professional hunters
who live in a city layered with breach zones. They do not look like fantasy heroes.
They look like people who designed their gear for a specific lethal purpose.

Visual references (do not copy, use as tone anchors):
- Hunter x Hunter: aura presence, silhouette clarity, elite hunter body language
- Hades (Supergiant): expressive faces, stylised dark palette, modern character design language
- Streets of Rage 4: clean 2.5D side-scroll readability, strong weapon profiles
- Solo Leveling: moody urban arcane atmosphere, glowing power, dark battle environments

The Huntix aesthetic lives at the intersection of all four:
modern arcane professional + aura glow + 2.5D brawler readability.

Base world palette: deep navy, black, charcoal, steel, muted grey.
Armour and clothing: modern tailoring mixed with arcane battle gear — designed, not found.
Silhouette priority: head, shoulder, torso, weapon profile must all read clearly at small scale.
Camera: 2.5D orthographic side-scroll, slight top-down Y elevation, left/right primary facing.
```

---

## DABIK — Shadow Striker

> Aura: Black with deep purple edges · Weapon: Twin curved daggers · Element: Shadow · Status: Bleed

### Step 1 — GPT Image 1.5: Full-Body Reference

```text
Create a full-body 2D game character sprite-style standing render of Dabik,
an elite S-Rank shadow hunter from a modern arcane urban world.

Physical identity: Caribbean-African heritage. Lean, controlled build — moves with
economy of motion that makes everyone else look wasteful. Dark skin, close-cut hair,
eyes that miss nothing. Late twenties.

Costume: Minimal tactical armour — dark fitted layers, deep charcoal and black,
nothing that catches light. A high collar or low hood option that reads clearly in profile.
Thin dark grey straps and minimal pouches — not a soldier's loadout, a tracker's.
Light, functional. No shine, no decoration, no emblems. Gear that was chosen to disappear.
Twin curved daggers worn low on each hip or crossed at the back — lightweight,
unmarked, no grip tape. Blades catch no light.

Aura: Barely visible in idle. A faint black-purple shadow spread at his feet and hands,
like a shadow cast from a light source that does not exist.

Pose: Neutral standing idle, full body head to boots visible, arms at sides or loosely
near his daggers. The posture is absolutely still — this is a person who only moves
when they mean to. Slight weight on one foot, completely relaxed.

2.5D camera angle: near-front facing, slight top-down Y elevation, readable left-right profile.
Format: full body, centered, clean readable silhouette, arms and legs fully visible,
feet not cropped. Transparent background.
No environment, no text, no frame, no shadow on ground, no extra characters.
```

**Invocation:**
```bash
set -a && source .env && set +a
python3 .agents/skills/fal-ai-image/scripts/fal_queue_image_run.py \
  --endpoint fal-ai/gpt-image-1.5/edit \
  --prompt "<prompt above>" \
  --out-dir experiments/fal-image/$(date +%Y-%m-%d)-dabik-full-body-v1 \
  --size 1024x1536 --quality high --output-format png --background transparent
```

---

### Step 2 — Nano Banana 2: Game-Master with Downscale Optimisation

```text
Image 1 = identity and costume anchor (full-body reference from Step 1).

Create a sprite-ready game-master version of this same character for a 2.5D
side-scrolling action brawler. Preserve full identity — same dark skin, close-cut hair,
high collar, dark tactical layers, twin curved daggers at hips or back.

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

**References:** Step 1 output (identity anchor)

---

### Step 3 — Nano Banana 2: Direction Sheet (L/R + F/B)

```text
Image 1 = game-master sprite reference for identity, proportions, and rendering style.

Create a 2×2 character spritesheet showing Dabik in four facing directions with
maximum consistency between panels. Each cell contains one full-body standing idle pose.

Reading order:
- Top-left: facing LEFT (west side view, profile)
- Top-right: facing RIGHT (east side view, profile)
- Bottom-left: facing TOWARD camera (south, front view, slight 3/4)
- Bottom-right: facing AWAY from camera (north, back view)

Keep the same dark skin, close-cut hair, high collar, dark tactical layers,
twin curved daggers, and proportions across all four panels.
Adapt costume details correctly to each direction — back view should show hood/collar
from behind, side views show the dagger handles clearly.

Background: exact flat chroma green #00FF00 across the entire sheet —
no gradient, no shadow, no floor, no labels, no text, no borders.
All four panels at identical scale, figures anchored to the same bottom baseline.
```

**References:** Step 2 output (game-master, identity anchor) + Step 1 output (secondary identity)

**Post-processing:** Height-normalise all four frames to shared-height + shared-bottom-anchor before extracting.

---

## BENZU — Iron Breaker

> Aura: Deep red with gold fractures · Weapon: Stone-forged gauntlets with gate ore · Element: Thunder/Earth · Status: Stun

### Step 1 — GPT Image 1.5: Full-Body Reference

```text
Create a full-body 2D game character sprite-style standing render of Benzu,
an elite S-Rank frontline hunter from a modern arcane urban world.

Physical identity: Brazilian heritage. Enormous. Built like architecture — not a trained
athlete, a person who was already this way and then an awakening made it official.
Dark brown skin, shaved head, a jaw that looks carved. Late twenties to early thirties.

Costume: Heavy custom armour plates — no manufacturer makes his size off the shelf.
Large shoulder plates, thick custom gauntlets reinforced with gate ore (the gauntlets
are the weapon — they must read immediately as the focal point). Reinforced boots,
broad chest plate, layered torso protection. Deep charcoal base with deep red accents
and muted gold trim — nothing polished, everything functional and heavy.
The armour looks like it was made by someone who knew what it needed to stop.

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

### Step 2 — Nano Banana 2: Game-Master with Downscale Optimisation

```text
Image 1 = identity and costume anchor.

Create a sprite-ready game-master version of Benzu for a 2.5D side-scrolling action brawler.
Preserve full identity — dark brown skin, shaved head, enormous build, heavy armour plates,
custom stone-forged gauntlets as the clear focal point.

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

### Step 3 — Nano Banana 2: Direction Sheet (L/R + F/B)

```text
Image 1 = game-master sprite reference.

Create a 2×2 character spritesheet showing Benzu in four facing directions.
Reading order: top-left = LEFT, top-right = RIGHT,
bottom-left = TOWARD camera (front), bottom-right = AWAY (back).

All panels: same enormous build, shaved head, heavy armour, custom gauntlets.
Side views must show the gauntlet depth and shoulder plate width clearly.
Back view shows the full back plate and nape of the neck.

Background: exact flat chroma green #00FF00 across entire sheet.
All four panels at identical scale, figures anchored to same bottom baseline.
No labels, no text, no borders, no shadows.
```

---

## SEREISA — Storm Chaser

> Aura: Bright yellow with white crackling edges · Weapon: Twin electro-blades · Element: Lightning · Status: Slow

### Step 1 — GPT Image 1.5: Full-Body Reference

```text
Create a full-body 2D game character sprite-style standing render of Sereisa,
an elite S-Rank speed hunter and arcane duelist from a modern urban world.

Physical identity: British-Nordic heritage. Tall, lean, sharp-featured.
Pale skin, light eyes, platinum hair kept short and practical. Fencing posture —
upright, deliberate, always balanced. Mid-to-late twenties.

Costume: Sleek, fitted, aerodynamic. Fencing-inspired lines but adapted for arcane combat —
light plating at shoulders and forearms, polished modern combat tailoring in dark navy
and black, white or pale silver trim. Nothing heavy, nothing that would slow her.
The suit is designed — clean seam lines, structured but allowing full range of motion.
Twin electro-blades at her sides — short, curved, permanently humming with a faint
electric charge. The blades are the focal point: they should feel fast and precise,
not heavy.

Aura: bright yellow crackling at her hands and feet, white-edged, like static electricity
that has become intentional. The aura sparks slightly at rest, as if it cannot
quite hold still — because she cannot quite hold still either.

Pose: Combat ready idle — weight slightly forward on the front foot, one hand near
a blade handle, shoulders square, chin level. The posture of someone who has been
trained to be ready before they consciously decide to be.

2.5D camera angle: near-front facing, slight top-down Y elevation, readable left-right profile.
Format: full body, centered, feet not cropped. Transparent background.
No environment, no text, no frame, no ground shadow, no extra characters.
```

---

### Step 2 — Nano Banana 2: Game-Master with Downscale Optimisation

```text
Image 1 = identity and costume anchor.

Create a sprite-ready game-master version of Sereisa for a 2.5D side-scrolling brawler.
Preserve full identity — pale skin, platinum short hair, sleek navy combat suit,
twin electro-blades at sides.

Optimise for small-frame readability at 128×192 and 64×96:
cleaner suit seam lines (fewer but stronger), more visible bright yellow aura crackle
at hands and feet, blade shapes must remain clearly readable as twin short curved
weapons even at smallest scale. Slightly larger head-to-body proportion.
The silhouette of the blades extending past her hands is the key readability signal.

Background: exact flat chroma green #00FF00 — no gradient, no shadow, no floor,
no texture, no green spill onto the character. Full body visible head to boots.
```

---

### Step 3 — Nano Banana 2: Direction Sheet (L/R + F/B)

```text
Image 1 = game-master sprite reference.

Create a 2×2 character spritesheet showing Sereisa in four facing directions.
Reading order: top-left = LEFT, top-right = RIGHT,
bottom-left = TOWARD camera (front), bottom-right = AWAY (back).

All panels: platinum short hair, sleek navy suit, twin electro-blades visible on both sides.
Side views must show the blade silhouette clearly extending past the hand.
Back view shows the suit from behind, blades at hips, short hair nape.

Background: exact flat chroma green #00FF00 across entire sheet.
All four panels identical scale, same bottom baseline.
No labels, no text, no borders.
```

---

## VESOL — Ember Mage

> Aura: Deep blue bleeding into crimson · Weapon: Gate crystal channelling focus at wrist · Element: Flame · Status: Burn

### Step 1 — GPT Image 1.5: Full-Body Reference

```text
Create a full-body 2D game character sprite-style standing render of Vesol,
an elite S-Rank arcane mage-hunter from a modern urban world.

Physical identity: Japanese-Filipino heritage. Composed, still in a way that reads as
dangerous rather than calm. Dark eyes, dark hair worn up and precise. Structured bearing.
Late twenties.

Costume: Structured long coat in deep dark blue with deep red lining — the coat is tailored,
not robed, with clean modern lines and movement. Layered mage-armour panels underneath
at chest and shoulders — dark charcoal with faint rune circuit engravings. Crystal fittings
at collar and cuffs. Rune bands at wrists. The channelling focus is the weapon:
a slender rod of gate crystal worn at her wrist or held loosely in one hand — it is the
central visual element and must be clearly identifiable. No physical blade of any kind.
She does not need one.

Aura: Deep blue at rest, gathered around the focus crystal and her wrist. As power
increases it bleeds toward deep crimson — in the standing idle the blue is dominant
with only the faintest crimson edge at the crystal tip, suggesting what it could become.

Pose: Precise idle — straight posture, focus crystal raised slightly in one hand or
resting at wrist, the other arm at her side. Still the way a loaded weapon is still.
No dramatic casting pose. This is a person who has mastered the gesture.

2.5D camera angle: near-front facing, slight top-down Y elevation, readable left-right profile.
Format: full body, centered, coat visible in full length, feet not cropped. Transparent background.
No environment, no text, no frame, no ground shadow, no extra characters.
```

---

### Step 2 — Nano Banana 2: Game-Master with Downscale Optimisation

```text
Image 1 = identity and costume anchor.

Create a sprite-ready game-master version of Vesol for a 2.5D side-scrolling brawler.
Preserve full identity — dark hair up, structured dark blue coat with red lining,
rune bands at wrists, gate crystal focus as the clear weapon focal point.

Optimise for small-frame readability at 128×192 and 64×96:
coat silhouette must remain clearly longer than a jacket (distinguishing shape);
crystal focus must be visible and glowing even at 64×96 — the blue-to-crimson
gradient on the crystal is the key readability signal. Fewer rune details but
bolder where they appear. Slightly larger head-to-body ratio.

Background: exact flat chroma green #00FF00 — no gradient, no shadow, no floor,
no texture, no green spill onto the character. Full body visible head to boots.
```

---

### Step 3 — Nano Banana 2: Direction Sheet (L/R + F/B)

```text
Image 1 = game-master sprite reference.

Create a 2×2 character spritesheet showing Vesol in four facing directions.
Reading order: top-left = LEFT, top-right = RIGHT,
bottom-left = TOWARD camera (front), bottom-right = AWAY (back).

All panels: dark hair up, structured blue coat with red lining,
rune bands at wrists, crystal focus visible in correct hand for each direction.
Back view shows the full coat from behind, hair up, focus at wrist.
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
- [ ] Log experiment run in `experiments/fal-image/<timestamp>-<hunter>-direction-sheet/`
