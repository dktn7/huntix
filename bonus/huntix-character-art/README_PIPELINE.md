# Huntix Character Art — Sprite Pipeline

This folder contains the Node.js automation script for processing Google Flow sprite outputs
into game-ready transparent PNG frames and TexturePacker atlases.

---

## Requirements

```bash
cd bonus/huntix-character-art
npm install
```

Optional (for atlas packing):
- [TexturePacker](https://www.codeandweb.com/texturepacker) — install and ensure `TexturePacker` is on your PATH

---

## Step 1 — Set up your input folder

Create a `flow_output/` folder at the **root of the repo** and drop your Google Flow outputs in:

```
flow_output/
  dabik/
    idle/           ← PNG or JPG frames from Google Flow
    run/
    attack_light/
    attack_heavy/
    dodge/
    spell_minor/
    spell_advanced/
    weapon_swap/
    hurt/
    dead/
    downed/
    revive/
    ultimate/
  benzu/
  sereisa/
  vesol/
```

You do not need every hunter or every state present — the script skips missing folders silently.

---

## Step 2 — Run

```bash
cd bonus/huntix-character-art
npm run process
```

Or directly:

```bash
node process_sprites.js
```

The script will:
1. Find all images in each state folder
2. Key out the `#00FF00` green background pixel by pixel
3. Save transparent PNGs to `assets/hunters/{hunter}/{state}/`

---

## Step 3 — Pack atlases (optional)

If TexturePacker CLI is installed, open `process_sprites.js` and set:

```js
const PACK_ATLAS = true;
```

Re-run and it automatically packs all state folders per hunter into:

```
assets/hunters/dabik/atlas.png
assets/hunters/dabik/atlas.json
```

These files are what `SpriteAnimator.js` loads in Phase 3.

---

## Tuning the green key

If you see green fringing on character edges, increase the threshold in `process_sprites.js`:

```js
const THRESHOLD = 40;  // default — increase to 60 if edges look green
```

If the key is eating into the character (removing parts of dark clothing), decrease it:

```js
const THRESHOLD = 20;  // stricter — only removes near-exact #00FF00
```

---

## Output structure

After running, `assets/hunters/` will contain:

```
assets/
  hunters/
    dabik/
      idle/           ← transparent PNG frames, ready for TexturePacker
      run/
      attack_light/
      ...
      atlas.png       ← packed atlas (if PACK_ATLAS = true)
      atlas.json      ← frame data for SpriteAnimator.js
    benzu/
    sereisa/
    vesol/
```

---

## Full pipeline reference

```
Mixboard / GPT Image 1.5  (Step 1 — full-body reference sheet)
  → Google Flow / Nano Banana 2  (Steps 2–3 — animation frames, green screen)
      → flow_output/{hunter}/{state}/  (drop frames here)
          → node process_sprites.js  (keys green, saves transparent PNGs)
              → assets/hunters/{hunter}/{state}/  (keyed frames)
                  → TexturePacker CLI  (packs atlas — auto if PACK_ATLAS=true)
                      → assets/hunters/{hunter}/atlas.png + atlas.json
                          → SpriteAnimator.js  (Phase 3 — loads atlas in Three.js)
```
