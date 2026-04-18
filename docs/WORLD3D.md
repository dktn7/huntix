# HUNTIX — World 3D Environment Spec

> **This doc covers 3D world geometry only — floors, walls, platforms, props, and zone structure.**
> Characters, enemies, and bosses are 2D billboard sprites. See `RENDERING.md` for that pipeline.

*Last updated: April 18, 2026*

---

## Why 3D World Geometry

Huntix uses a hybrid rendering model:
- **Characters / enemies / bosses** — 2D billboard sprites (Castle Crashers clarity)
- **World environment** — 3D GLTF meshes with baked AO (Dead Cells / Hades depth)

This combination is what makes all three inspirations look distinctive. The 2D sprites give readable silhouettes; the 3D world gives the space weight, atmosphere, and the sense that the hunters are *inside* a real zone.

`BoxGeometry` stubs are acceptable in early phases. From Phase 9 onwards, real GLTF environment meshes replace them.

---

## What Uses 3D Geometry

| Element | Format | Notes |
|---------|--------|-------|
| Zone floor | GLTF mesh | Tiled, surface detail, baked AO |
| Walls / back wall | GLTF mesh | Zone-specific material — brick, void stone, storm metal |
| Platforms / ledges | GLTF mesh | Simple extruded forms with edge wear |
| Props (barrels, rubble, debris) | GLTF mesh | Dressing only — no collision |
| Foreground props | GLTF mesh | Placed at positive Z in front of characters |
| Portal geometry | GLTF mesh + emissive | Glowing gate ring, zone-specific colour |
| Boss arena floor | GLTF mesh | Distinct from standard zone floor |

## What Does NOT Use 3D Geometry

| Element | Format |
|---------|--------|
| Hunters | 2D sprite — `PlaneGeometry` quad |
| Enemies | 2D sprite — `PlaneGeometry` quad |
| Bosses | 2D sprite — `PlaneGeometry` quad |
| VFX / particles | 2D sprite quads |
| Aura effects | 2D billboard particles |
| Parallax background layers | `PlaneGeometry` planes at fixed Z |
| HUD | DOM overlay |

---

## Asset Directory Structure

```
assets/
  models/
    world/
      city-breach/
        cb-floor.glb
        cb-walls.glb
        cb-props.glb
        cb-portal.glb
      ruin-den/
        rd-floor.glb
        rd-walls.glb
        rd-props.glb
        rd-portal.glb
      shadow-core/
        sc-floor.glb
        sc-walls.glb
        sc-props.glb
        sc-portal.glb
      thunder-spire/
        ts-floor.glb
        ts-walls.glb
        ts-props.glb
        ts-portal.glb
      hub/
        hub-floor.glb
        hub-walls.glb
        hub-props.glb
```

> `assets/models/world/` is the only valid models directory. There is no `assets/models/characters/` — characters are sprites.

---

## GLTF Mesh Specs

| Property | Value |
|----------|-------|
| Format | GLTF binary (`.glb`) |
| Up axis | Y-up |
| Scale | 1 unit = 1 Three.js world unit |
| Max texture size | 1024×1024px per mesh |
| Texture format | WebP (converted from PNG after bake) |
| Lighting | Baked AO + baked diffuse — no dynamic shadow maps |
| Material | `MeshStandardMaterial` with baked AO map |
| Poly budget per zone | Max 15,000 triangles total for all world meshes combined |
| Max draw calls (world) | 8 per zone |

---

## Loading Pattern

Load each zone's world assets as a single GLTF per category (floor, walls, props). Never load per-prop individually.

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// GLTFLoader is used for WORLD GEOMETRY ONLY
// Never use GLTFLoader for characters, enemies, or bosses
const loader = new GLTFLoader();

loader.load('./assets/models/world/city-breach/cb-floor.glb', (gltf) => {
  const floor = gltf.scene;
  floor.position.set(0, 0, 0);
  scene.add(floor);
});
```

---

## Zone Environment Design

### 🏙 City Breach
- **Floor:** cracked concrete tiles, faded yellow lane markings
- **Walls:** brutalist research facility walls, blown-out windows, exposed rebar
- **Props:** overturned lab equipment, shattered glass, burning debris
- **Tone:** amber emergency lighting, heavy industrial shadow
- **Portal:** deep red gate ring, pulsing ember glow

### 🏕 Ruin Den
- **Floor:** packed earth, exposed root systems, broken stone tiles
- **Walls:** deep underground rock face, dripping moss, old archways
- **Props:** collapsed pillars, ancient crates, amber crystal formations
- **Tone:** dim amber torchlight, damp cave shadow
- **Portal:** ochre/brown gate ring, slow earth pulse

### 🌑 Shadow Core
- **Floor:** void stone — dark, slightly reflective, cracked with purple light seeping through
- **Walls:** floating geometry fragments, negative space, void dimension edge
- **Props:** shattered mirror shards, inverted spires, frozen time debris
- **Tone:** deep purple/black, sharp violet emissive cracks
- **Portal:** void-black gate ring, cold purple shimmer

### ⚡ Thunder Spire
- **Floor:** storm-forged metal grating, electrostatic shimmer
- **Walls:** gate-grown storm structure — vertical lightning rods, crackling conductors
- **Props:** blown transformer coils, shattered storm canisters, arcing cables
- **Tone:** bright white-blue lightning flash ambient, dark storm grey base
- **Portal:** white-gold gate ring, rapid charge pulse

### 🏠 Hub
- **Floor:** neutral dark stone, faint rune inlay
- **Walls:** guild hall architecture — stone arches, gate energy conduits
- **Props:** weapon racks, essence jars, mission boards
- **Tone:** warm neutral, calm before the hunt

---

## Performance Rules

- Max **15,000 triangles** total for all world meshes in a single zone
- Max **8 draw calls** from world geometry per zone
- No dynamic shadow maps — bake all AO and shadow into textures
- No per-frame GLTF loading — all zone assets loaded once on zone transition
- Dispose of previous zone meshes when transitioning to a new zone

```js
// Dispose world meshes on zone exit
function disposeZone(zoneGroup) {
  zoneGroup.traverse((child) => {
    if (child.isMesh) {
      child.geometry.dispose();
      child.material.dispose();
    }
  });
  scene.remove(zoneGroup);
}
```

---

## Y-Sort Rule Applies to World Geometry

3D world meshes participate in the Y-sort depth system:

```js
// Floor — behind everything
floor.renderOrder = 0;

// Characters — Y-sorted per frame (see RENDERING.md)
// Foreground props — in front of characters
foregroundProp.renderOrder = 10;
```

---

## Source of Truth Chain

```
VISUAL-DESIGN.md       — art direction, zone colour palettes
     ↓
WORLD3D.md             — THIS FILE — zone mesh spec, formats, poly budget
     ↓
WORLDASSETPIPELINE.md  — how to create and export zone meshes
     ↓
src/visuals/[ZoneName]Arena.js — implementation per zone
```
