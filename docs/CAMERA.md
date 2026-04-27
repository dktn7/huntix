# HUNTIX — Camera System

> Fixed orthographic oblique camera for 2.5D brawler readability.

*Last updated April 28, 2026*

---

## Overview

Huntix uses a fixed `THREE.OrthographicCamera` with a slight downward oblique tilt.

- Camera type: `OrthographicCamera`
- Projection: fixed orthographic (no perspective)
- Base vertical view: `ORTHO_HEIGHT = 10`
- Base horizontal view: `ORTHO_WIDTH = ORTHO_HEIGHT * 16/9`
- Base position: `(0, 0, 100)`
- Tilt: fixed oblique target in the **10–12°** range (`11°` default)

The camera follows player spread/centroid for framing, but never becomes free-look, orbit, or perspective.

---

## Runtime Behavior

### Zone camera
- Tracks active players with clamped X/Y follow.
- Adjusts ortho frustum size for co-op spread.
- Keeps oblique tilt fixed via camera profile.

### Hub camera
- Uses the same orthographic oblique model.
- Slightly different follow framing for hub landmarks.
- Same fixed tilt range, applied through camera profile.

### Tilt transitions
- Camera tilt uses smooth interpolation when changing mode/profile.
- Billboard sprites are counter-rotated to remain camera-facing.

---

## Constraints

- Do not switch to perspective.
- Do not use free camera rotation.
- Do not use orbit controls in shipped gameplay.
- Keep tilt in a narrow oblique band (10–12°) for readability.

---

## Related Docs

- [RENDERING.md](./RENDERING.md)
- [TECHSTACK.md](./TECHSTACK.md)
- [ZONES.md](./ZONES.md)
