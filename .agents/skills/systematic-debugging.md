---
name: systematic-debugging
description: Methodical debugging for Three.js rendering, 2.5D collision, depth sorting, game loop issues, and gamepad input problems. Always load alongside threejs-skills.
---

# Systematic Debugging for Huntix

Never guess. Always investigate before fixing.

## Process

1. **Reproduce** — confirm bug is consistent and describe exact steps
2. **Isolate** — binary search: comment out code until bug disappears
3. **Hypothesise** — form ONE specific hypothesis
4. **Test** — single log or minimal visual to confirm/deny
5. **Fix** — only after root cause confirmed
6. **Verify** — confirm fix without regressions

## Three.js Debug Checklist

```js
console.log(renderer.info.render); // draw calls, triangles
scene.add(new THREE.AxesHelper(5));
scene.add(new THREE.GridHelper(20, 20));
// Visualise AABB
const box = new THREE.Box3().setFromObject(mesh);
scene.add(new THREE.Box3Helper(box, 0xff0000));
```

## Y-Sort Debugging

```js
// Common bug: Y-sort running on spawn only, not every frame
// Fix: ensure it's called inside animate(), not in init()
entities.forEach((e, i) => {
  if (DEBUG) console.log(`[${i}] worldY=${e.worldY} z=${e.mesh.position.z}`);
});
```

## Game Loop Debugging

```js
// Common bug: dt not clamped — huge jumps after tab switch
// Fix: always clamp
const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
```

## Collision Debugging

```js
// #1 bug: wrong coordinate space
const worldPos = new THREE.Vector3();
mesh.getWorldPosition(worldPos); // correct for nested objects
// mesh.position — only correct if mesh is a direct scene child
```

## Gamepad Debugging

```js
// Gamepads must be POLLED every frame — not event-driven
window.addEventListener('gamepadconnected', (e) => {
  console.log(`Gamepad: index=${e.gamepad.index} id=${e.gamepad.id} buttons=${e.gamepad.buttons.length}`);
});

// Common gamepad bugs:
// 1. Axis deadzone missing → stick drift
//    Fix: if (Math.abs(axis) < 0.15) axis = 0;
// 2. Button index varies between PS/Xbox/generic controllers
//    Fix: log all button indices on connect and map dynamically
// 3. Gamepad object is stale — must re-poll every frame
//    Fix: const gp = navigator.getGamepads()[index]; // inside animate()
// 4. P2 gamepad at index 1, not 0
//    Fix: map player slots to gamepad indices explicitly

const DEADZONE = 0.15;
const applyDeadzone = v => Math.abs(v) < DEADZONE ? 0 : v;
```

## FSM State Debugging

```js
// Track transitions — catches illegal state changes fast
function setState(entity, newState) {
  if (DEBUG) console.log(`[${entity.id}] ${entity.state} → ${newState}`);
  entity.state = newState;
}
// Common bug: state set multiple times per frame
// Fix: guard with if (entity.state === newState) return;
```

## Performance Debugging

```js
// Look for new THREE.Vector3() inside update() → GC stutters
// Run Chrome DevTools Performance tab, look for frequent GC events
let frameCount = 0, fpsTimer = 0;
function trackFPS(dt) {
  frameCount++; fpsTimer += dt;
  if (fpsTimer >= 1) {
    if (frameCount < 50) console.warn(`FPS drop: ${frameCount}`);
    frameCount = 0; fpsTimer = 0;
  }
}
```
