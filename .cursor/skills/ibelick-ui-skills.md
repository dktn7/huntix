---
name: ui-skills
description: Opinionated constraints for building game UI — HUD, combo counter, health bars, hunter select, essence shop. Use when building any in-game interface element.
source: https://github.com/ibelick/ui-skills
---

# UI Skills for Huntix

Build clean, performant game UI using HTML/CSS overlaid on the Three.js canvas.

## Architecture

- Use a separate `<div id="hud">` overlay on top of the `<canvas>` — do NOT render UI in Three.js
- Use CSS transforms and opacity for all HUD animations — GPU composited, no layout thrash
- Keep the HUD DOM minimal — avoid deep nesting

## HUD Components

### Health Bar
```html
<div class="health-bar">
  <div class="health-fill" style="width: var(--hp-pct)"></div>
</div>
```
```css
.health-bar { width: 200px; height: 12px; background: #333; border-radius: 6px; }
.health-fill { height: 100%; background: #e74c3c; border-radius: 6px; transition: width 0.1s ease; }
```

### Combo Counter
- Show only when combo > 1
- Animate scale on increment: `transform: scale(1.3)` → `scale(1)` via CSS keyframe
- Use large, bold font — visible during fast combat

### Essence (Currency) Display
- Top-right corner
- Pulse animation on earn
- Never block the action area (center screen)

## Design Rules

- Use the Huntix elemental colour palette per hunter (Dabik = purple/shadow, Benzu = earth/gold, Sereisa = cyan/lightning, Vesol = orange/flame)
- Font: bold, legible at small sizes — avoid thin weights during action
- All interactive elements have `cursor: pointer` and hover feedback
- Never use `!important` — specificity should be managed through class hierarchy

## Performance

- Batch DOM reads (`.getBoundingClientRect()`) before writes
- Use `will-change: transform` only on actively animating elements, remove after
- Avoid `innerHTML` in the game loop — update `textContent` or CSS variables instead
