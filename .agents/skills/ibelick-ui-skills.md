---
name: ui-skills
description: Game UI for Huntix — HUD, health bars, combo counter, essence display, hunter select. Use when building any in-game interface element.
---

# UI Skills for Huntix

## Architecture

- Separate `<div id="hud">` overlay on top of the Three.js `<canvas>`
- Use CSS transforms and opacity for HUD animations — GPU composited
- Never render UI inside Three.js
- Update `textContent` or CSS variables in the game loop — never `innerHTML`

## Health Bar

```html
<div class="health-bar"><div class="health-fill"></div></div>
```
```css
.health-bar { width: 200px; height: 12px; background: #333; border-radius: 6px; }
.health-fill { height: 100%; background: #e74c3c; border-radius: 6px; transition: width 0.1s; }
```

## Combo Counter

- Show only when combo > 1
- Scale pulse on increment: `transform: scale(1.3)` → `scale(1)`
- Large bold font, visible during fast combat

## Player Colours

| Player | Hunter | Colour |
|---|---|---|
| P1 | Dabik | `#9b59b6` |
| P2 | Benzu | `#f1c40f` |
| P3 | Sereisa | `#00d4ff` |
| P4 | Vesol | `#ff4500` |

## Performance

- Batch DOM reads before writes
- `will-change: transform` only on actively animating elements
- Never use `!important`
