# Huntix Background Generation (fal.ai)

Use this to generate production background layers for Hub + all 4 zones.

## Output Requirements

- Per zone: `bg`, `mid`, `fg` layers
- Size target: `2048x512`
- Format: `webp`
- No characters, no UI, no text
- Strong silhouette readability behind gameplay sprites
- Dark fantasy, but not crushed blacks

## File Targets

- `assets/backgrounds/hub-bg.webp`
- `assets/backgrounds/hub-mid.webp`
- `assets/backgrounds/hub-fg.webp`
- `assets/backgrounds/city-breach-bg.webp`
- `assets/backgrounds/city-breach-mid.webp`
- `assets/backgrounds/city-breach-fg.webp`
- `assets/backgrounds/ruin-den-bg.webp`
- `assets/backgrounds/ruin-den-mid.webp`
- `assets/backgrounds/ruin-den-fg.webp`
- `assets/backgrounds/shadow-core-bg.webp`
- `assets/backgrounds/shadow-core-mid.webp`
- `assets/backgrounds/shadow-core-fg.webp`
- `assets/backgrounds/thunder-spire-bg.webp`
- `assets/backgrounds/thunder-spire-mid.webp`
- `assets/backgrounds/thunder-spire-fg.webp`

## Shared Style Prefix

`2.5D side-view game environment backdrop, dark urban fantasy, high readability, clean silhouette separation, painterly-stylized low-poly feel, cinematic lighting, no characters, no text, no logo, no UI, no foreground subject centered`

## Prompts

### Hub
- `Hub bg`: `${prefix}, modern arcane hunter agency skyline at dusk, concrete megastructure and distant city lights, blue rune glow accents, soft fog bands, deep navy and steel palette`
- `Hub mid`: `${prefix}, hunter hub architecture mid-layer, arcane signage silhouettes, suspended bridges and towers, cool blue rune strips, readable large shapes`
- `Hub fg`: `${prefix}, near foreground lane props for hub, rune pylons, railings, concrete barriers, subtle emissive trims, keep bottom edge clear for combat lane`

### City Breach
- `City bg`: `${prefix}, ruined city skyline after gate breach, smoke plumes, broken neon signs, orange gate light bleeding from horizon, cracked high-rises`
- `City mid`: `${prefix}, collapsed facades and tilted street structures, broken billboards, emergency lights, ember haze, strong horizontal composition`
- `City fg`: `${prefix}, rubble piles, barricades, shattered road chunks, glowing fissure seams, preserve clear playable lane silhouette`

### Ruin Den
- `Ruin bg`: `${prefix}, underground ruin cavern depth, heavy dust haze, dim green gate seepage, ancient concrete and rock massing`
- `Ruin mid`: `${prefix}, crumbled support columns and pipe runs, fractured tunnel walls, industrial decay, muted green-gray accents`
- `Ruin fg`: `${prefix}, foreground rubble mounds, broken slabs, utility wreckage, subtle particulate glow, keep lane readable`

### Shadow Core
- `Shadow bg`: `${prefix}, corrupted void expanse, black-violet depth field, white energy fractures, floating debris silhouettes, high contrast but readable`
- `Shadow mid`: `${prefix}, shattered dark platforms and arcane fractures, purple bloom veins, dimensional distortion streaks`
- `Shadow fg`: `${prefix}, shadow tendrils and near debris silhouettes, restrained bloom, clear combat lane band`

### Thunder Spire
- `Spire bg`: `${prefix}, storm tower skyline, dark navy cloud masses, distant lightning forks, cold blue atmospheric depth`
- `Spire mid`: `${prefix}, crumbling tower sections and exposed conduits, electric arcs, wind-blown debris flow`
- `Spire fg`: `${prefix}, storm-battered foreground structures, crackling cable silhouettes, white-blue highlights, preserve lane readability`

## fal.ai Command Template

Set `FAL_KEY` first, then run one layer:

```powershell
python .agents/skills/fal-ai-image/scripts/fal_queue_image_run.py `
  --model-alias nano-banana-2-t2i `
  --prompt "<PASTE PROMPT>" `
  --out-dir "flow_output/backgrounds/<zone>/<layer>" `
  --filename-prefix "<zone>-<layer>" `
  --task-slug "huntix-<zone>-<layer>" `
  --image-size "landscape_16_9" `
  --num-images 1 `
  --output-format webp
```

After generation, copy the best output into `assets/backgrounds/` with the exact target filename above.
