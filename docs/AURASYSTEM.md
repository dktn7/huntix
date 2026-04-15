# HUNTIX — Aura System

> The aura is not decoration. It is a living indicator of power, state, and identity.

*Last updated April 15, 2026*

---

## Overview

Every hunter has a personal aura — an elemental energy field that:

- **Identifies** the hunter at a glance (colour = character)
- **Communicates state** (idle vs combat vs Surge vs Ultimate)
- **Responds to level** (grows visibly as the hunter progresses)
- **Reacts to events** (hit taken, kill, spell cast, perfect dodge)
- **Affects particles** (all particle colours are derived from the hunter’s aura)

---

## Per-Hunter Aura Identity

| Hunter | Primary aura | Secondary | Element | Feel |
|--------|-------------|-----------|---------|------|
| Dabik | `#9b59b6` Purple | `#2c3e50` Deep shadow | Shadow | Cold, sharp, edges dissolve into dark |
| Benzu | `#e74c3c` Red | `#f39c12` Gold | Earth/Fire | Hot, pressured, radiates outward like heat shimmer |
| Sereisa | `#f1c40f` Yellow | `#ffffff` White | Lightning | Crackling, fast, thin sparks at edges |
| Vesol | `#3498db` Blue → `#e74c3c` Crimson | `#e67e22` Orange | Ice/Fire | Controlled blue at rest, shifts to crimson at full Surge |

> Vesol’s aura colour shift is unique — the only hunter whose aura changes colour during gameplay. Blue = controlled, clinical. Crimson = Inferno state. The shift is gradual, tracking Surge percentage.

---

## Aura States

### State 1 — Idle (Out of combat)

| Property | Value |
|----------|-------|
| Particle count | 4 |
| Radius | 0.5 world units |
| Motion | Slow drift, clockwise |
| Opacity | 0.3–0.5 |
| Size | 2px |
| Glow | Subtle. No bloom. |

### State 2 — Combat Active

| Property | Value |
|----------|-------|
| Particle count | 8 |
| Radius | 0.8 world units |
| Motion | Faster orbit, slight noise |
| Opacity | 0.5–0.7 |
| Size | 2–3px |
| Glow | Visible. Soft bloom. |
| Transition from Idle | 0.3s ease-in on wave start |

### State 3 — Surge 50%+

| Property | Value |
|----------|-------|
| Particle count | 12 |
| Radius | 1.0 world units |
| Motion | Orbiting with upward drift |
| Opacity | 0.6–0.8 |
| Size | 3px |
| Glow | Strong. Distinct bloom halo. |

### State 4 — Surge 100% (Ready)

| Property | Value |
|----------|-------|
| Particle count | 20 |
| Radius | 1.2 world units |
| Motion | Fast orbit + upward spray |
| Opacity | 0.8–1.0 (pulsing) |
| Size | 3–4px |
| Glow | Full bloom. Aura bleeds onto nearby geometry. |
| Pulse | Aura brightness pulses at 1.5Hz — “ready” signal |
| Audio cue | Low hum increases in pitch at 100% Surge |

### State 5 — Ultimate Active

| Property | Value |
|----------|-------|
| Particle count | 20 (max) |
| Radius | 1.5 world units |
| Motion | Full outward burst, no orbit — blazing |
| Opacity | 1.0 |
| Size | 4–8px |
| Glow | Maximum. Screen-edge vignette in aura colour. |
| Duration | Matches Ultimate animation length |
| On end | Snaps back to State 2 (combat active) over 0.5s |

---

## Aura Level Scaling

| Level range | Radius multiplier | Particle size multiplier | Notes |
|-------------|-------------------|--------------------------|-------|
| L1–L3 | 1.0× | 1.0× | Modest. Hunter is new. |
| L4–L6 | 1.15× | 1.2× | Noticeably larger. |
| L7–L9 | 1.3× | 1.4× | Commanding presence. Aura bleeds onto ground. |
| L10 | 1.5× | 1.6× | Full power. Unmistakably different from L1. |

> A L10 hunter at Surge 100% has a 1.2 × 1.5 = 1.8 world unit radius aura.

---

## Aura Event Reactions

| Event | Aura reaction | Duration |
|-------|--------------|----------|
| Hit landed (light) | +20% brightness, +2 particles | 0.1s |
| Hit landed (heavy) | +40% brightness, +4 particles, outward pulse | 0.2s |
| Kill | 6 extra particles eject outward | 0.3s |
| Hit taken | Opacity drops to 0.1, recovers | 0.3s |
| Perfect dodge | Flares white briefly, returns to base colour | 0.2s |
| Spell cast | Brightens in spell element colour for cast duration | Cast duration |
| Level up | Full burst — 20 particles eject, aura blooms | 0.5s |
| Revive (being revived) | Rekindles from 0 → full | 0.6s |
| Downed | Dims to 50% opacity, slow throb (0.5Hz) | Until revived |

---

## Vesol Colour Shift

```js
// Vesol aura colour interpolation
const surgePercent = RunState.players[vesol].surge  // 0.0 – 1.0
const auraColour = lerpColour('#3498db', '#e74c3c', surgePercent)
// 0%   = pure blue  #3498db
// 50%  = purple (mid-lerp)
// 100% = full crimson #e74c3c
```

- Ultimate active: locked to crimson for full animation, then lerps back to blue post-Ultimate

---

## Aura in Co-op

- Each hunter’s aura is always their own colour — no blending
- Aura glow does NOT bleed onto other hunters — only onto geometry/ground
- Downed hunter’s aura dims — contrast with active teammates makes status instantly readable

---

## Aura vs Debuff Visual Conflict

| Debuff | Visual location | Conflicts with aura? |
|--------|----------------|---------------------|
| Bleed | Drip particles from body | No |
| Slow | Frost shimmer at feet | No |
| Stun | Stars orbit head | No |
| Burn | Flame particles rising from body | Yes — intentional. Burn looks urgent. |
| Weaken | Grey wash + dim aura | Yes — aura dims to 40%. Most impactful visually. |

---

## Technical Notes

- Aura rendered as `THREE.Points` — same pool as PARTICLES.md (20 particles max per hunter)
- Aura state transitions use linear interpolation on particle count and radius
- Aura colour stored in `HUNTER_BASE_STATS[hunterId].auraColour`
- Level scale multiplier read from `RunState.players[i].level` each frame
- Vesol colour lerp computed each frame from `surge` value

---

## Related Docs

| System | Doc |
|--------|-----|
| Aura particle counts and properties | [PARTICLES.md](./PARTICLES.md) |
| Surge state that drives aura | [COMBOSYSTEM.md](./COMBOSYSTEM.md) |
| Level scaling source | [RUNSTATE.md](./RUNSTATE.md) |
| Debuff visuals layered with aura | [DEBUFFS.md](./DEBUFFS.md) |
| Per-hunter aura colours | [HUNTERS.md](./HUNTERS.md) |
