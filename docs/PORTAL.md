# PORTAL.md — Zone Transition Animation Spec

> **Defines the full portal transition sequence: enter animation, between-zone loading, and exit animation. No loading screens. All transitions are in-engine, instant-feel.**

*Last updated April 16, 2026*

---

## Design Principle

Vibe Jam rule: **no loading screens**. All zone transitions must feel instant or be masked by animation. The portal transition is the mask — a dramatic but fast in-engine sequence that hides any scene swap.

Target total transition time: **≤ 1.5 seconds** from portal touch to new zone active.

---

## Portal Types

| Portal | Appears | Leads to | Colour |
|--------|---------|----------|--------|
| Entry portal | Hub, always | Combat zone | Zone-specific (see below) |
| Exit portal | After boss defeated | Hub | White/silver |
| Wipe portal | On full party death | Hub (wipe state) | Red/dark |

### Zone Portal Colours

| Zone | Portal colour |
|------|---------------|
| 🏙 City Breach | Orange-red |
| 🏕 Ruin Den | Earthen brown / amber |
| 🌑 Shadow Core | Deep violet / void |
| ⚡ Thunder Spire | Electric blue / white |

---

## Transition Sequence — Hub → Combat Zone

```
[1] Player walks into portal sprite
    → Portal idle animation accelerates (spin faster, glow pulse)
    → Duration: contact frame only (~0ms game time)

[2] FLASH — full white frame
    → Single frame white overlay, opacity 1.0
    → Duration: 1 frame (16ms)

[3] WARP — screen distortion
    → UV distortion shader ripples outward from centre
    → Hunter sprite scales to 0 (sucked into portal)
    → Duration: 300ms

[4] SCENE SWAP — Three.js scene objects replaced
    → Old zone geometry disposed
    → New zone geometry loaded (pre-built, not streamed)
    → Duration: <100ms (target — all assets pre-instantiated)

[5] EMERGE — hunter appears in new zone
    → Hunter sprite scales from 0 → normal at zone entry point
    → Camera already at correct position (fixed ortho, no pan needed)
    → Duration: 200ms

[6] ZONE TITLE CARD — brief overlay
    → Zone name + zone number fades in, holds 0.8s, fades out
    → e.g. "ZONE 2 — RUIN DEN"
    → Duration: 800ms (runs concurrent with emerge + first enemy spawn)

[7] GAMEPLAY RESUMES
    → Wave 1 enemies begin spawning
    → Player has full control
```

**Total wall-clock time: ~1.4s** (steps 2–6 concurrent where possible)

---

## Transition Sequence — Combat Zone → Hub (Post-Boss)

```
[1] Boss death animation completes
    → Exit portal materialises (white shimmer, 0.5s)

[2] Player walks to exit portal
    → Same flash + warp sequence as entry (reversed colours)
    → Duration: 300ms

[3] SCENE SWAP — Hub geometry active

[4] RESULTS OVERLAY
    → Zone clear summary: Essence earned, XP earned, kills
    → Holds until player dismisses (button press)

[5] HUB ACTIVE
    → Shop, upgrade, zone select available
```

---

## Transition Sequence — Wipe (Full Party Death)

```
[1] Last hunter death animation plays

[2] WIPE FLASH — deep red full-screen overlay
    → Opacity pulses 0 → 0.9 → 0
    → Duration: 600ms

[3] WIPE TITLE CARD
    → "GATE CLOSED" in large text
    → Sub-text: "50% Essence retained"
    → Duration: 1.5s

[4] SCENE SWAP → Hub (wipe state)
    → Run XP reset, buffs cleared
    → Essence = floor(sessionEssence * 0.5)

[5] HUB ACTIVE — wipe state
    → Shop still available (retained Essence)
    → Zone 1 portal re-locked until player confirms restart
```

---

## Portal Sprite Spec

- Portal is a `PlaneGeometry` quad (same as all sprites)
- Atlas: `assets/sprites/portal-atlas.png`
- Frames: 8-frame idle loop + 4-frame activate burst
- Size: 2×3 world units (width × height)
- Z-position: midground layer (Z = -1) — behind hunters (Z = 0), in front of far background (Z = -5)
- Idle animation speed: 12fps
- Activate animation speed: 24fps (triggered on player contact)

---

## Shader Notes

- UV distortion effect: custom `THREE.ShaderMaterial` on a fullscreen quad
- Uniforms: `uTime`, `uStrength` (0 → 1 → 0 over 300ms)
- Fallback if shader unsupported: skip distortion, keep flash + scale
- Do NOT use `postprocessing` library — implement as a simple overlay quad

---

## PortalManager.js — Key Methods

```js
PortalManager.init(scene)
// Creates portal sprite meshes, registers collision zone.

PortalManager.onPlayerEnter(portal, player)
// Triggers transition sequence for given portal type.

PortalManager.playTransition(type)
// 'enter' | 'exit' | 'wipe' — runs full sequence, returns Promise.

PortalManager.swapScene(fromZone, toZone)
// Disposes old geometry, instantiates new zone. Called mid-transition.

PortalManager.showZoneTitleCard(zoneName, zoneNumber)
// Renders overlay title card, auto-dismisses after 0.8s.

PortalManager.showResultsOverlay(essence, xp, kills)
// Post-boss results screen. Awaits player dismiss.
```

---

## Related Docs

- `docs/SCENEMANAGER.md` — scene graph structure
- `docs/RUNSTATE.md` — run state machine (zone active / hub / wipe states)
- `docs/ZONES.md` — zone layouts and geometry
- `docs/SPRITES.md` — sprite atlas format
