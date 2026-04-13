# Huntix HUD Design

Compact, modern, readable at all times. The HUD must never obscure gameplay — it lives at the edges of the screen and scales for 1–4 players.

---

## Layout Overview

```
┌─────────────────────────────────────────────────────┐
│ [P1 bars]   [P2 bars]      COMBO x8    [P3] [P4]    │
│                                                     │
│                  GAME AREA                          │
│                                                     │
│  [Essence 💎 240]              [BOSS HEALTH ■■■░░]  │
└─────────────────────────────────────────────────────┘
```

---

## Player Status Bars

Each player has a compact stacked bar group displayed in a corner slot:

| Bar | Colour | Width | Position |
|---|---|---|---|
| Health | Red `#e74c3c` | 120px | Top |
| Mana | Blue `#3498db` | 100px | Middle |
| Surge | Yellow `#f39c12` | 100px | Bottom |

**Player slot positions:**
- P1: top-left
- P2: top-left (below P1)
- P3: top-right
- P4: top-right (below P3)

**Player colour indicator:** Small coloured dot (10px) left of bars. Colours:
- P1: `#9b59b6` (purple)
- P2: `#e74c3c` (red)
- P3: `#2ecc71` (green)
- P4: `#3498db` (blue)

**Hunter name tag:** Small label above bars, monospace font, 10px. Shows hunter name.

---

## Combo Counter

- Position: top-centre
- Format: `×12` — large, bold, monospace
- Font size: scales from 24px (×1) to 48px (×20+)
- Colour: green `#2ecc71` → yellow `#f39c12` → red `#e74c3c` as combo climbs
- Resets after 2s of no hits
- Brief pulse animation on each increment (scale 1 → 1.2 → 1, 80ms)

---

## Essence Counter

- Position: bottom-left
- Format: 💎 `240` — icon + number
- Font: monospace, 14px, white
- Brief +N pop-up animation when essence collected (floats up 20px, fades out over 600ms)

---

## Boss Health Bar

- Position: bottom-centre to bottom-right
- Only visible during boss fight (fades in over 300ms on boss spawn)
- Format: boss name label above, segmented bar below
- Bar colour: dark red `#c0392b` with dark grey `#2c2c2c` background
- Segments mark phase thresholds (e.g. 60%, 40%) with a faint divider line
- On phase transition: bar flashes white for 150ms

---

## Zone Title Flash

- On zone entry: zone name fades in (200ms), holds 800ms, fades out (200ms)
- Position: centre screen
- Font: large, bold, uppercase, white with hunter-colour shadow
- e.g. `CITY BREACH`

---

## Kill Slow-Mo Indicator

- No explicit UI element — handled by speed effect on final wave enemy
- Screen edges briefly darken (vignette pulse, 200ms) to signal slow-mo moment

---

## Damage Numbers

- Float upward from hit position, fade out over 600ms
- Light attack: white, 14px
- Heavy attack: yellow, 18px
- Critical / status: orange, 18px, bold
- Max 8 damage numbers visible simultaneously (pool and reuse)

---

## Status Effect Icons

- Small icons below each player's surge bar showing active status on nearby enemies
- Not displayed in MVP — Phase 5 addition

---

## Tech Notes

- All HUD rendered as HTML/CSS overlay (`#ui-overlay` div, `pointer-events: none`)
- Use `position: fixed` for all HUD elements
- Bars implemented as `<div>` with `width` animated via JS each frame
- Damage numbers: pooled `<div>` elements recycled from a DOM pool of 8
- HUD updates run after Three.js render call in GameLoop tick
- Font: system monospace stack — `'Courier New', Courier, monospace`
