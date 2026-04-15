# HUNTIX — Scene Manager

> Scenes load, run, and die cleanly. Nothing leaks.

*Last updated April 15, 2026*

---

## Overview

Huntix has 5 scene types. The Scene Manager handles loading, transition, and disposal. It is the only system allowed to swap the active Three.js scene. Everything else reads the current scene state — nothing else calls `renderer.render` with a different scene.

| Scene | ID | Trigger |
|-------|----|---------|
| Title / Character Select | `title` | Game start |
| Hunter Hub | `hub` | Run start, zone clear |
| Zone | `zone-[id]` | Hub portal entered |
| Game Over | `gameover` | Wipe |
| End Screen | `endscreen` | Zone 4 boss defeated |

---

## Scene Lifecycle

Every scene transition follows this exact sequence:

```
TRANSITION REQUEST
  │
  ├─ 1. FADE OUT
  │     Overlay div opacity: 0 → 1 over [duration]ms
  │     gameSpeed = 0 (freeze game loop during transition)
  │
  ├─ 2. TEARDOWN current scene
  │     Stop all active SFX
  │     Dispose all geometries, materials, textures
  │     Clear particle systems
  │     Remove all event listeners added by current scene
  │     Clear Three.js scene graph
  │     Call scene.onExit()
  │
  ├─ 3. PERSIST RunState
  │     RunState is NOT in the scene — it lives in a module-level singleton
  │     No action needed — RunState survives scene swap automatically
  │
  ├─ 4. LOAD next scene
  │     Instantiate scene class
  │     Load GLTF assets (await Promise.all)
  │     Build Three.js scene graph
  │     Initialise all scene systems (wave manager, enemy spawner, etc.)
  │     Call scene.onEnter(RunState)
  │
  ├─ 5. APPLY RunState mutations for this transition
  │     (See per-transition table below)
  │
  ├─ 6. FADE IN
  │     Overlay opacity: 1 → 0 over [duration]ms
  │     gameSpeed = 1
  │
  └─ 7. SCENE ACTIVE
         Game loop runs normally
```

---

## Transition Durations

| Transition | Fade out | Fade in | Total |
|------------|----------|---------|-------|
| Hub → Zone | 0.5s | 0.5s | 1.0s |
| Zone → Hub (clear) | 0.8s | 0.5s | 1.3s |
| Any → Game Over | 1.0s | 0.5s | 1.5s |
| Zone 4 → End Screen | 1.0s | 0.8s | 1.8s |
| Title → Hub | 0.5s | 0.5s | 1.0s |

---

## Per-Transition RunState Mutations

Applied in step 5 — after the new scene is loaded, before fade-in.

### Hub → Zone

```js
RunState.currentZone = zoneId
RunState.players.forEach(p => {
  p.mana = p.manaMax          // mana reset
  p.surge = 0                 // surge reset
  p.isDown = false            // clear downed
  p.downTimer = 0
  p.shopBuysThisVisit = 0     // reset (for return to hub)
})
```

### Zone → Hub (clear)

```js
RunState.zonesCleared++
RunState.currentZone = 'hub'
RunState.players.forEach(p => {
  p.hp = Math.min(p.hp + 30, p.hpMax)   // +30 HP on clear
  p.shopBuysThisVisit = 0
})
```

### Any → Game Over (wipe)

```js
RunState.runWiped = true
RunState.runTimer  // preserved for display
RunState.players.forEach(p => {
  p.essenceKept = Math.floor(p.essence * 0.5)
})
// Game Over screen reads RunState, then full reset on 'Play Again'
```

### Zone 4 → End Screen

```js
RunState.runComplete = true
// runTimer stops (no longer ticked in game loop)
// End screen reads all stats from RunState
```

---

## Memory Disposal

The single biggest source of Three.js memory leaks is not disposing geometries and materials on scene exit. This is mandatory on every scene teardown.

```js
function disposeScene(scene) {
  scene.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => disposeMaterial(m))
      } else {
        disposeMaterial(obj.material)
      }
    }
  })
}

function disposeMaterial(material) {
  material.dispose()
  // Dispose all textures on the material
  Object.values(material).forEach(value => {
    if (value && typeof value.dispose === 'function') {
      value.dispose()
    }
  })
}
```

> This must run on **every** scene exit — hub, zone, title. Missing one disposal is a leak that compounds with each run.

---

## Asset Caching

GLTF models are loaded once and cached. Subsequent scene loads use the cache, not a new network request.

```js
const assetCache = new Map()

async function loadGLTF(path) {
  if (assetCache.has(path)) return assetCache.get(path)
  const gltf = await gltfLoader.loadAsync(path)
  assetCache.set(path, gltf)
  return gltf
}
```

| Asset type | Cached? | Notes |
|------------|---------|-------|
| Hunter GLTFs | Yes — loaded on title screen | Shared across all scenes |
| Zone environment GLTFs | Yes — cached after first load | Zone revisit is instant |
| Enemy GLTFs | Yes | Shared across zones |
| Boss GLTFs | Yes | Loaded on first zone entry |
| Audio files | Yes — via AudioContext buffer cache | |

---

## Scene Class Interface

Every scene implements this interface:

```js
class BaseScene {
  onEnter(RunState) {}    // Called after load, before fade-in
  onExit()  {}           // Called before teardown
  update(dt) {}          // Called each frame by game loop
  render()  {}           // Not used — SceneManager calls renderer.render
}
```

---

## Fade Overlay

The fade is a full-screen `<div>` with `pointer-events: none`, positioned above the canvas via CSS z-index. Opacity is tweened with `requestAnimationFrame` or a simple CSS transition.

```html
<div id="fade-overlay" style="
  position: fixed; inset: 0;
  background: black;
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
  z-index: 100;
"></div>
```

```js
function fadeOut(duration) {
  return new Promise(resolve => {
    overlay.style.transition = `opacity ${duration}ms ease`
    overlay.style.opacity = '1'
    setTimeout(resolve, duration)
  })
}
function fadeIn(duration) {
  return new Promise(resolve => {
    overlay.style.transition = `opacity ${duration}ms ease`
    overlay.style.opacity = '0'
    setTimeout(resolve, duration)
  })
}
```

---

## Error Handling

| Failure | Behaviour |
|---------|----------|
| GLTF load fails | Log error, substitute placeholder geometry, continue |
| Scene crash (uncaught exception) | Catch at game loop level → force transition to Game Over screen |
| RunState undefined | Hard error — should never happen. Initialise guard on game start. |

---

## Related Docs

| System | Doc |
|--------|-----|
| RunState schema and mutations | [RUNSTATE.md](./RUNSTATE.md) |
| Game loop (drives scene.update) | [GAMELOOP.md](./GAMELOOP.md) |
| Hub scene systems | [HUB.md](./HUB.md) |
| Zone wave systems | [WAVEMANAGER.md](./WAVEMANAGER.md) |
| Death and wipe trigger | [DEATH.md](./DEATH.md) |
