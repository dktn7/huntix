# ASSETPIPELINE — Art Asset Production Workflow

*Last updated April 16, 2026*

---

## Overview

All character and enemy art is 2D sprite art generated via AI image tools, processed through TexturePacker into atlases, and loaded into Three.js as billboard sprites. No 3D models at any stage.

---

## Folder Structure

```
assets/
  sprites/
    hunters/
      dabik-atlas.webp
      dabik-atlas.json
      benzu-atlas.webp
      benzu-atlas.json
      sereisa-atlas.webp
      sereisa-atlas.json
      vesol-atlas.webp
      vesol-atlas.json
    enemies/
      grunt-atlas.webp
      grunt-atlas.json
      ranged-atlas.webp
      ranged-atlas.json
      bruiser-atlas.webp
      bruiser-atlas.json
    bosses/
      vrael-atlas.webp
      vrael-atlas.json
      zarth-atlas.webp
      zarth-atlas.json
      kibad-atlas.webp
      kibad-atlas.json
      thyxis-atlas.webp
      thyxis-atlas.json
    particles/
      fx-atlas.webp
      fx-atlas.json
  backgrounds/
    city-breach-bg.webp
    city-breach-mid.webp
    city-breach-fg.webp
    [zone]-bg.webp  (repeat per zone)
  ui/
    hud-atlas.webp
    hud-atlas.json
```

No `models/` folder. No `.glb`, `.fbx`, or `.obj` files.

---

## Step-by-Step: Adding a New Character Sprite

### 1. Generate frames

Use Grok or equivalent AI image tool with this prompt format:

```
2D character sprite art for a 2.5D side-scrolling brawler game.
Character: [NAME], [DESCRIPTION].
Animation: [STATE] — [FRAME COUNT] frames on a transparent background.
Style: dark action-fantasy, high contrast, clean silhouette, no background.
Output: individual frames on white or green screen background, side profile.
```

Generate each animation state separately. Required states per hunter (see ANIMATIONS.md for full list):
- idle (4 frames)
- run (6 frames)
- light_attack (5 frames)
- heavy_attack (6 frames)
- dodge (4 frames)
- hurt (3 frames)
- death (6 frames)
- spell_cast (5 frames)

### 2. Remove background

- Use remove.bg or Photoshop "Remove Background" on each frame.
- Export as PNG with alpha, 256×256px per frame for hunters, 192×192px for grunts, 320×320px for bosses.

### 3. Pack atlas

Use TexturePacker (free tier is sufficient for MVP):
- Algorithm: MaxRects
- Max atlas size: 2048×2048
- Padding: 2px
- Trim: enabled
- Output format: JSON Array + WebP
- File name: `[character]-atlas`

### 4. Naming convention

Frame names inside the atlas JSON must follow:
```
[character]_[state]_[frame_number_zero_padded]
```
Examples:
```
dabik_idle_00
dabik_idle_01
dabik_light_attack_00
vrael_phase2_slam_03
```

### 5. Load in Three.js

```js
const texture = textureLoader.load('assets/sprites/hunters/dabik-atlas.webp');
const atlas = await fetch('assets/sprites/hunters/dabik-atlas.json').then(r => r.json());
// Use atlas.frames[frameName].frame to set texture.offset and texture.repeat
```

---

## Background Layers

- Dimensions: 2048×512px per layer
- 3 layers per zone: `[zone]-bg.webp`, `[zone]-mid.webp`, `[zone]-fg.webp`
- Generate with AI: wide landscape format, dark fantasy style, no characters
- Export as WebP at quality 85
- Each layer scrolls at a different speed (see RENDERING.md for parallax values)

---

## Particle Sprites

- All particle frames packed into a single `fx-atlas`
- Frame size: 64×64px per particle type
- Types needed: spark, smoke, blood, lightning, fire, shadow, glow-ring
- Use additive blending in Three.js for glow types

---

## Quality Checklist (per asset)

- [ ] Transparent background (no white fringe)
- [ ] Correct frame size for entity type
- [ ] Naming convention followed exactly
- [ ] Atlas packed, JSON exported alongside WebP
- [ ] WebP file size under budget (hunter atlas < 2MB, enemy < 1.5MB)
- [ ] Animation plays correctly in-engine at 12fps
