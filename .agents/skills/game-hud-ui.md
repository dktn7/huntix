# Game HUD & UI Skill

Use this skill when building any DOM overlay UI: health bars, mana bars, surge bar, combo counter, damage numbers, boss health bar, hub shop, pause menu, player colour indicators.

> Source of extracted rules: nextlevelbuilder/ui-ux-pro-max-skill — adapted for Three.js DOM overlay context (not React Native).

---

## Huntix UI Stack

- All HUD lives in `#ui-overlay` — a `position:fixed` div that sits above the Three.js canvas
- No React, no framework — plain DOM manipulation from `src/gameplay/HUD.js`
- Icons: inline SVG only — no emoji, no raster PNG
- Spacing system: 4/8px base unit — all padding, gaps, margins must be multiples of 4
- Font: monospace for numbers (damage, combo), system-ui for labels
- Phase 5 only — do not build HUD or shop UI before Phase 5

---

## Icon Rules

| Rule | Do | Never |
|---|---|---|
| Format | Inline SVG with consistent stroke-width (1.5px or 2px — pick one and stick to it) | Emoji (🗡️ ❤️ ⚡) as structural UI elements |
| Sizing | Token-based: sm=16px, md=24px, lg=32px | Arbitrary mixed sizes (18px, 22px, 27px) |
| Filled vs outline | One style per hierarchy level | Mixed filled + outline at the same level |
| Contrast | WCAG 4.5:1 on all backgrounds | Low-contrast icons that blend into HUD background |
| Touch/click targets | Min 44×44px hit area (use padding, not icon growth) | Icon-only buttons under 44px without padding |

---

## Spacing & Layout

- **4/8px rhythm** — all spacing values must be: 4, 8, 12, 16, 24, 32, 48px. No 5px, 7px, 11px, etc.
- **Safe zone** — all HUD elements must clear the canvas edge by at least 16px
- **Bar positions** (from `docs/HUD.md`):
  - P1 health/mana/surge: top-left
  - Combo counter: top-centre
  - Boss health bar: bottom-centre
  - Damage numbers: world-space projected to screen, offset above enemy
- **Z-index discipline**: HUD = 10, modals/pause = 20, tooltips = 30 — never use arbitrary z-index values
- **No layout shift on press** — button press states use opacity/color change only, never transform that affects surrounding layout

---

## Colour & Contrast

| Element | Min Contrast | Notes |
|---|---|---|
| Primary text (HP numbers, combo) | 4.5:1 | Against HUD panel background |
| Secondary text (labels) | 3:1 | Against HUD panel background |
| Dividers / bar borders | Visible in both normal + hitstop flash | Test with white flash active |
| Player colour indicators | Distinct at 4P: P1 blue, P2 yellow, P3 green, P4 red | Never rely on colour alone — add position label |

Colour tokens — use CSS custom properties, never hardcode hex values inline in JS:
```css
:root {
  --hp-fill:     #e05555;
  --mana-fill:   #5599e0;
  --surge-fill:  #e0c855;
  --combo-text:  #ffffff;
  --hud-bg:      rgba(0,0,0,0.55);
  --p1-colour:   #4488ff;
  --p2-colour:   #ffdd44;
  --p3-colour:   #44cc66;
  --p4-colour:   #ff4444;
}
```

---

## Animation & Timing

| Event | Timing | Method |
|---|---|---|
| HP bar drain | 200ms ease-out | CSS transition on width |
| Damage number rise + fade | 600ms total: rise 400ms, fade 200ms | CSS animation, remove element after |
| Combo counter pop | 150ms scale 1→1.2→1 | CSS keyframe |
| Hitstop flash | 80ms (light) / 150ms (heavy) — matches GameLoop freeze | Sync exactly with dt freeze |
| Surge bar fill pulse | 300ms ease-in-out loop while full | CSS animation |
| Boss bar reveal | 400ms slide up from bottom | CSS transform + transition |
| Pause menu open | 150ms fade in | CSS opacity transition |

- All micro-interactions: 150–300ms with ease-out or ease-in-out — never linear, never >500ms
- Respect `prefers-reduced-motion` — wrap all non-critical animations in a media query check

---

## Damage Numbers

```js
// Project world position to screen — call in HUD.js update()
function worldToScreen(worldPos, camera, renderer) {
  const v = worldPos.clone().project(camera);
  const w = renderer.domElement.clientWidth;
  const h = renderer.domElement.clientHeight;
  return {
    x: (v.x * 0.5 + 0.5) * w,
    y: (-v.y * 0.5 + 0.5) * h,
  };
}
```

- Pool damage number DOM elements — pre-allocate 20, reuse from pool, never `createElement` per-hit
- Offset Y by -40px above enemy world position
- Crit hits: scale 1.4×, colour `#ffee55`
- Status procs (bleed/burn/slow/stun): smaller font (0.8em), colour matches status type

---

## Pre-Delivery Checklist (Phase 5)

- [ ] No emoji used as icons anywhere in HUD
- [ ] All spacing values are multiples of 4px
- [ ] All colours come from CSS custom properties — no hardcoded hex in JS
- [ ] All text contrast ≥3:1 (secondary) or ≥4.5:1 (primary)
- [ ] Player colour indicators have text labels, not colour alone
- [ ] Damage number elements come from a pre-allocated pool
- [ ] All animations between 150–300ms, reduced-motion respected
- [ ] Z-index values only from the three defined tiers (10/20/30)
- [ ] HUD layout tested at 1280×720 and at narrower viewport
- [ ] Boss health bar hidden until boss encounter begins
