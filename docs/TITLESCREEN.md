# HUNTIX — Title Screen

> *Four hunters. One purpose. Enter.*

*Last updated April 15, 2026*

---

## Overview

The title screen is the first thing every player sees. It sets the tone for the entire game — gate energy, hunter identity, and the weight of what they're about to enter. It must load instantly (no splash delay, no loading screen) and feel premium without being overbuilt.

---

## Screen Flow

```
Browser loads index.html
  → Immediate render (no loading screen)
  → Title screen active
  → Player selects Play or Co-op
  → Hunter Select screen
  → Hub scene
  → Run begins
```

---

## Menu Structure

```
        [ HUNTIX LOGO ]
        (animated aura pulse)

           ▶  Play
           👥  Co-op
           ⚙️  Settings
           📖  Credits
```

### Menu Items

| Item | Action |
|---|---|
| Play | Opens Hunter Select screen (solo, 1 player) |
| Co-op | Opens lobby screen — select player count (2–4), then Hunter Select |
| Settings | Opens full Settings panel (see PAUSEMENU.md for Settings spec) |
| Credits | Simple scrolling credits screen — team, tools, jam attribution |

**How to Play** is not a top-level menu item — it lives inside Settings as a dedicated tab. Keeps the main menu clean and uncluttered.

---

## Visual Design

### Background

- All 4 hunters silhouetted in their combat stances, arranged across the screen
- Gate energy crackling in the background — vertical rift, deep purple/black with energy light
- Slow parallax drift on background layers — subtle depth, not distracting
- Hunter auras glow faintly in their colours:
  - Dabik — deep purple
  - Benzu — deep red/gold
  - Sereisa — bright yellow/white
  - Vesol — deep blue bleeding to crimson
- Silhouettes are recognisable but not fully detailed — builds anticipation for Hunter Select

### Logo

- HUNTIX wordmark, centre screen, upper third
- Animated aura pulse — logo breathes slowly, aura cycling through all 4 hunter colours in sequence
- Not flashing — a slow, 4s cycle loop

### Atmosphere

- Background is alive but not busy — the hunters and gate carry the visual identity
- No UI chrome, no decorative borders — clean negative space around the menu
- Menu items are clean, well-spaced, readable at a glance

---

## Music

- Atmospheric menu track plays immediately on title screen load
- Builds slowly — starts minimal (gate energy sound design, low rumble) and layers in over 30s
- Not combat-intensity — this is the "you are about to enter something" feeling
- Loops seamlessly
- Fades out when Play or Co-op is selected, replaced by hub ambient track
- Respects master/music volume settings
- Gated behind first user interaction (browser autoplay policy)

---

## Hunter Select Screen

Fires after Play or Co-op is selected. This is a dedicated screen — not inside the hub.

### Layout

```
  SELECT YOUR HUNTER

  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │  DABIK   │  │  BENZU   │  │ SEREISA  │  │  VESOL   │
  │ [art]    │  │ [art]    │  │ [art]    │  │ [art]    │
  │ Shadow   │  │  Iron    │  │  Storm   │  │  Ember   │
  │ Striker  │  │ Breaker  │  │  Chaser  │  │  Mage    │
  │          │  │          │  │          │  │          │
  │ HP   ██░ │  │ HP   ███ │  │ HP   ██░ │  │ HP   ██░ │
  │ SPD  ███ │  │ SPD  █░░ │  │ SPD  ███ │  │ SPD  ██░ │
  │ DMG  ██░ │  │ DMG  ███ │  │ DMG  ██░ │  │ DMG  ███ │
  └──────────┘  └──────────┘  └──────────┘  └──────────┘

             [ CONFIRM — ENTER THE GATE ]
```

### Hunter Card Details

Each hunter card shows:
- Hunter full art (not silhouette — full reveal here)
- Name and title
- Element and status effect
- Stat bars: HP, Speed, Damage, Defense (visual bar, not raw numbers)
- Dodge type name
- Starting spell name
- Brief flavour quote (from HUNTERS.md)

### Hover / Select Behaviour

- Hovering a hunter card expands it slightly, plays a short aura flare animation
- Hunter's voice/sound cue plays on hover (Phase 6 — placeholder until audio exists)
- Selected hunter card glows with their aura colour border
- Background shifts subtly to reflect selected hunter's colour palette

### Co-op Hunter Select

- Each player selects independently using their own input device
- All 4 hunters are available to all players — duplicate hunters allowed
- Each player's selection shown with their player number badge (P1, P2, P3, P4)
- Confirm fires when all connected players have selected
- 30s timer for co-op select — auto-confirms with current selections on expiry

### Returning Player Memory

- Last hunter selected is remembered in `localStorage`
- Pre-highlighted (not pre-selected — player must still confirm) on next visit
- Resets if browser storage is cleared

---

## Returning Player Behaviour

- Always lands on the title screen — no auto-skip to hub
- Each run starts fresh — no continue run option
- The game is a roguelite — every session intentionally begins at the title
- Last hunter pick pre-highlighted on hunter select (see above)

---

## Performance

- Title screen renders on first frame — no loading delay
- Hunter silhouettes in background: low-poly meshes, baked textures, minimal draw calls
- Music loads asynchronously — does not block render
- Hunter Select full art: preloaded during title screen display so Hunter Select is instant

---

## Accessibility

| Setting | Effect |
|---|---|
| Screen reader | Menu items and hunter descriptions read aloud on focus |
| High contrast | Menu item text gets stronger contrast background |
| Colourblind mode | Hunter aura colours shift to colourblind-safe palette on both title and hunter select |
| UI scale | Hunter select cards scale with UI scale slider |
| Keyboard navigation | Full tab/arrow key navigation on all menu items and hunter cards |

---

## Related Docs

| System | Doc |
|---|---|
| Hunter stats and appearance | [HUNTERS.md](./HUNTERS.md) |
| Scene transition into hub | [SCENEMANAGER.md](./SCENEMANAGER.md) |
| Settings panel full spec | [PAUSEMENU.md](./PAUSEMENU.md) |
| Audio tracks | [AUDIO.md](./AUDIO.md) |
| Performance targets | [TECHSTACK.md](./TECHSTACK.md) |
