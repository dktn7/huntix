# PERFORMANCEBUDGET — Performance Targets & Constraints

*Last updated April 16, 2026*

---

## Target Hardware

- **CPU:** Intel Core i5 (4-core, 2.4GHz)
- **GPU:** Intel Iris Xe / integrated graphics
- **RAM:** 8GB
- **Browser:** Chrome 120+, Firefox 124+
- **Target FPS:** 60fps sustained, never below 45fps

---

## Draw Call Budget

| System | Max Draw Calls | Notes |
|---|---|---|
| Hunters (sprites) | 4 | Instanced per hunter |
| Enemies (sprites) | 20 | Instanced per enemy type |
| Projectiles | 8 | Pooled billboard quads |
| Particles | 6 | Batched per emitter type |
| Background layers | 3 | One mesh per parallax layer |
| HUD | 0 | DOM overlay — no Three.js draw calls |
| **Total** | **≤ 41** | Hard ceiling |

Do not exceed 50 draw calls per frame under any circumstance.

---

## Entity Caps

| Entity | Max Active | Strategy |
|---|---|---|
| Hunters | 4 | Fixed |
| Enemies | 20 | Wave manager enforces cap |
| Projectiles | 60 | Object pool (see PROJECTILES.md) |
| Particles | 500 | Pool, never allocate mid-frame |
| HUD elements | 12 | Static DOM, no mid-frame inserts |

---

## Particle LOD

When active enemy count > 15 or FPS drops below 50:

1. Reduce max particles from 500 → 250
2. Disable ambient idle particles (aura shimmer)
3. Halve projectile trail length
4. Skip every-other frame on background particle emitters

FPS is sampled every 30 frames via `performance.now()` delta average.

---

## Y-Sort Cost

- Y-sort runs every frame on all visible sprites.
- Excluded from sort: HUD, background layers, projectiles (always in front).
- Max sortable objects: 24 (4 hunters + 20 enemies).
- Use a simple insertion sort — array is nearly sorted each frame, O(n) best case.

---

## Background Layers

- 3 parallax layers per zone: background / midground / foreground.
- Each layer is a single `PlaneGeometry` with a texture — 1 draw call each.
- Scroll offset updated via `material.map.offset.x` — no geometry rebuild.
- Layer textures: max 2048×512px, compressed to WebP.

---

## Texture Budget

| Asset | Max Size | Format |
|---|---|---|
| Hunter sprite atlas | 2048×2048px | WebP |
| Enemy sprite atlas | 2048×2048px | WebP |
| Boss sprite atlas | 2048×2048px | WebP |
| Particle sprites | 512×512px | WebP |
| Background layers | 2048×512px each | WebP |
| UI elements | 1024×1024px | WebP |

Total VRAM target: under 128MB.

---

## What to Cut First (Priority Order)

When FPS drops below 50fps sustained:

1. Halve ambient particle count
2. Disable aura idle shimmer
3. Reduce projectile trail opacity to 0
4. Drop background layer 3 (foreground detail)
5. Reduce enemy cap from 20 → 14
6. Disable hit-stop effect (frame pause)
7. Reduce screen shake magnitude by 50%

Never cut: hit sparks, stagger flash, death animation.

---

## Profiling Checkpoints

| Phase | Check |
|---|---|
| Phase 2 complete | 1 hunter + 5 enemies = 60fps on target hardware |
| Phase 3 complete | 4 hunters + 10 enemies = 60fps |
| Phase 4 complete | 4 hunters + 20 enemies + boss + particles = 55fps+ |
| Phase 5 complete | Full game loop with HUD + shop = 55fps+ |
| Pre-submission | Lighthouse performance score ≥ 85 |
