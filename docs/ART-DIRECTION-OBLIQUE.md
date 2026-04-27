# HUNTIX — Oblique 2.5D Art Direction

*Last updated April 28, 2026*

---

## Camera & World View

- Fixed oblique orthographic framing.
- Not pure top-down, not side-scrolling.
- Floor recedes upward on screen.
- Moving up on screen means moving deeper into arena depth.

Target camera tilt range: **10–12°** (default `11°`).

---

## Character Sprites

- Players and enemies are upright billboard sprites (2D images facing camera).
- Sprites support 4-direction brawler movement on X/Y.
- Sprites should be authored for oblique presentation (roughly 15–20° viewing intent), while runtime keeps them camera-facing via billboard counter-tilt.

---

## Environment Scale Intent

World assets are full 3D geometry/GLB and should read larger than sprites.

| Asset | Approx visual world-space height |
|---|---|
| Player/enemy sprite | ~1.1 |
| Crate/debris prop | ~1.2 |
| Barrier/vehicle | ~1.5–2.0 |
| Building facade/wall | ~4–6 |
| Background tower/spire | ~8–12 |

Characters should feel like small actors inside large environments.

---

## Sprite/Prop Shape Targets

- Character sprites: portrait-oriented (~2:3), upright, slightly downward-facing presentation.
- Props: readable top face + front face in oblique view, not flat side-on and not pure top-down.

---

## Zone Palette Targets

- City Breach: charcoal, ember orange, neon pink accents
- Ruin Den: sandy sandstone, amber fissure glow, earthy brown
- Shadow Core: deep void black, violet purple, arcane rune glow
- Thunder Spire: dark slate blue, electric cyan lightning, rain-slicked stone

---

## Do / Don’t

✅ Assets should read as correct in-world scale  
✅ Props should include depth cues (darker underside/bottom edge)  
✅ Sprites should be authored for billboard-in-3D composition  
❌ No pure side-on platformer framing  
❌ No pure top-down RTS/RPG framing  
❌ No perspective distortion on character billboards
