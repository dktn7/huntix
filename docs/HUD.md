# Huntix HUD Design

Compact, modern, readable at all times. The HUD must never obscure gameplay — it lives at the edges of the screen and scales for 1–4 players.

*Last updated April 15, 2026*

---

## Layout Overview

```
┌─────────────────────────────────────────────────────┐
│ [P1 bars + spells]  [P2 bars]  COMBO x8  [P3] [P4]  │
│ [XP bar ──────── LVL 4]                           │
│                                                     │
│                  GAME AREA                          │
│                                                     │
│  [Essence 🟠 240]   [Slot 1 | Slot 2]  [BOSS HEALTH]  │
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

## XP Bar & Level Indicator

- Position: directly below the player's status bars (top-left for P1/P2, top-right for P3/P4)
- Width: matches Health bar width (120px)
- Colour: hunter's aura colour (Dabik: purple, Benzu: red-gold, Sereisa: yellow, Vesol: blue→crimson)
- Background: dark grey `#2c2c2c`
- Format: thin bar (6px height) with level number to the right — e.g. `████░░░░ LVL 4`
- On level-up: bar flashes white (150ms), resets to 0, level number increments with brief scale pulse (1 → 1.4 → 1 over 200ms)
- XP gain: brief `+XP` float-up (same style as Essence pop-up, grey colour, smaller font)

**Level milestone indicators:**
- At L3 (Advanced spell unlock): level number gets a small 🔓 icon that appears and fades (signals spell unlock)
- At L9 (Ultimate unlock): same 🔓 icon in the hunter's aura colour

---

## Spell Slot Display

Shown below the XP bar for each player. Displays currently unlocked spells and their cooldown state.

```
[ Minor ⚡ ]  [ Adv 🔒 ]  [ Ult 🔒 ]
```

| Slot | Unlocked at | Locked state | Active state |
|------|------------|--------------|---------------|
| Minor | L1 (always) | N/A | Icon + cooldown ring |
| Advanced | L3 | Dark icon + lock overlay | Icon + cooldown ring |
| Ultimate | L9 | Dark icon + lock overlay | Surge bar fill indicator |

**Cooldown ring:** Circular progress ring around spell icon. Fills clockwise as cooldown expires. Colour matches hunter aura. On ready: brief flash + scale pulse.

**Ultimate slot:** Does not show a cooldown ring. Instead shows the Surge bar fill as a radial fill around the icon — fills as Surge builds. When full: icon blazes, pulses, and shows `READY` text briefly.

**Active slot indicator:** Small bright dot (4px) below the spell icon that is currently modified (post-L4 or L6). Signals to the player that their spell has been upgraded.

**Spell icon size:** 24px × 24px each. Spacing: 4px between slots. Total width: ~80px.

---

## Weapon Slot Display

- Position: bottom-centre (above Essence counter)
- Shows Slot 1 (Signature) and Slot 2 (Equipped) side by side
- Format: `[ Slot 1 icon ] | [ Slot 2 icon ]`

| State | Visual |
|-------|--------|
| Slot 2 empty | Slot 2 shown as dim outline with `+` icon — signals it can be filled |
| Slot 2 filled | Weapon icon visible, same brightness as Slot 1 |
| Active slot | Currently active slot has a bright white border. Inactive slot is dimmed (60% opacity). |
| Swap animation | On Q / LB press: active slot border transfers to other slot over 4 frames |

**Weapon icon size:** 28px × 28px. Divider: 2px vertical line between slots.

> The active slot indicator is critical for readability — players must always know which weapon is active without looking away from combat.

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
- Format: 🟠 `240` — icon + number
- Font: monospace, 14px, white
- Brief +N pop-up animation when Essence collected (floats up 20px, fades out over 600ms)

---

## Boss Health Bar

- Position: bottom-right
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

## Downed State Indicator (Co-op)

- When a player enters downed state (`isDown = true`):
  - Their status bars dim to 30% opacity
  - A red pulsing border appears around their HUD slot
  - A countdown timer replaces their HP bar: `8.0 → 0.0` in red, large font
  - Nearby players see a `[HOLD F TO REVIVE]` prompt above the downed player in-world
- On revive: bars return to full opacity, countdown disappears, brief green flash on their slot
- On elimination: their HUD slot fades out completely (200ms), `[ELIMINATED]` text briefly shown

---

## Level-Up Notification (co-op awareness)

- When another player is on the card screen, a small non-intrusive banner shows on all other players' HUDs:
- Format: `[⚡ P1 LEVELLING UP...]` — bottom of their HUD slot, dim, monospace, 10px
- Fades out automatically when the card screen is dismissed

---

## Damage Numbers

- Float upward from hit position, fade out over 600ms
- Light attack: white, 14px
- Heavy attack: yellow, 18px
- Critical / status: orange, 18px, bold
- Status tick damage: small, muted red, 11px (less visual noise)
- Max 8 damage numbers visible simultaneously (pool and reuse)

---

## Status Effect Icons

- Small icons shown on enemies with active status effects (above their head)
- Bleed: red droplet 🔴, Stun: yellow star ⭐, Slow: blue snowflake ❄️, Burn: orange flame 🔥
- Stack count shown as a number beside the icon (1–3)
- Not displayed in MVP Phase 1 — Phase 3 addition

---

## Kill Slow-Mo Indicator

- No explicit UI element — handled by speed effect on final wave enemy
- Screen edges briefly darken (vignette pulse, 200ms) to signal slow-mo moment

---

## Tech Notes

- All HUD rendered as HTML/CSS overlay (`#ui-overlay` div, `pointer-events: none`)
- Use `position: fixed` for all HUD elements
- Bars implemented as `<div>` with `width` animated via JS each frame
- XP bar: same implementation as health bar, driven by `RunState.players[i].xp`
- Spell slots: `<div>` icons with SVG cooldown rings updated each frame
- Weapon slots: `<div>` icons, active slot tracked from `RunState.players[i].activeSlot`
- Damage numbers: pooled `<div>` elements recycled from a DOM pool of 8
- HUD updates run after Three.js render call in GameLoop tick
- Font: system monospace stack — `'Courier New', Courier, monospace`
