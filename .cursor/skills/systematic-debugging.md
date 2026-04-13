---
name: systematic-debugging
description: Methodical debugging for Three.js rendering, 2.5D collision, depth sorting, game loop issues, and gamepad input problems. Always load alongside threejs-skills.
---

# Systematic Debugging for Huntix

Never guess. Always investigate before fixing.

## Process

1. **Reproduce** — confirm bug is consistent and describe exact steps
2. **Isolate** — binary search: comment out code until bug disappears
3. **Hypothesise** — form ONE specific hypothesis about root cause
4. **Test** — add a single log or minimal visual to confirm/deny
5. **Fix** — only fix after root cause is confirmed
6. **Verify** — confirm fix without regressions

## Three.js Debug Checklist

```js
// Check draw calls and GPU load
console.log(renderer.info.render); // { calls, triangles, points, lines }

// Visualise scene axes and grid
scene.add(new THREE.AxesHelper(5));
scene.add(new THREE.GridHelper(20, 20));

// Verify object is in scene
console.log(scene.children.includes(mesh));

// Verify geometry has vertices
console.log(geometry.attributes.position.count);

// Visualise AABB hitbox
const box = new THREE.Box3().setFromObject(mesh);
scene.add(new THREE.Box3Helper(box, 0xff0000));
```

## Y-Sort Debugging

```js
// Log depth values each frame to catch sorting bugs
entities.forEach((e, i) => {
  if (DEBUG) console.log(`entity[${i}] worldY=${e.worldY} z=${e.mesh.position.z}`);
});
// Common bug: Y-sort only running on spawn, not every frame
// Fix: ensure Y-sort is called inside the animation loop, not in init
```

## Game Loop Debugging

```js
let frame = 0;
function animate(timestamp) {
  requestAnimationFrame(animate);
  frame++;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // clamp dt
  lastTime = timestamp;
  if (DEBUG && frame % 60 === 0) {
    console.log(`frame=${frame} dt=${dt.toFixed(4)} fps=${(1/dt).toFixed(1)}`);
  }
  update(dt);
  renderer.render(scene, camera);
}
// Common bug: dt not clamped — causes huge jumps after tab switch
// Fix: always clamp dt to max 0.05 (50ms) to prevent physics explosions
```

## Collision Debugging

```js
// Always check coordinate space — local vs world is the #1 collision bug
const worldPos = new THREE.Vector3();
mesh.getWorldPosition(worldPos); // correct for nested objects
// mesh.position — only correct if mesh is a direct scene child

// Visualise AABB each frame when debugging
function debugAABB(mesh, scene) {
  const box = new THREE.Box3().setFromObject(mesh);
  const helper = new THREE.Box3Helper(box, 0x00ff00);
  scene.add(helper);
  return helper; // store reference to remove later
}
```

## Gamepad Debugging

Gamepads are the hardest input to debug — browser permissions and index variance between controllers:

```js
// List all connected gamepads
window.addEventListener('gamepadconnected', (e) => {
  console.log(`Gamepad connected: index=${e.gamepad.index} id=${e.gamepad.id} buttons=${e.gamepad.buttons.length} axes=${e.gamepad.axes.length}`);
});

// Poll gamepad state (gamepads must be POLLED — not event-driven)
function debugGamepad(index) {
  const gp = navigator.getGamepads()[index];
  if (!gp) return console.warn(`No gamepad at index ${index}`);
  console.log('buttons:', gp.buttons.map((b, i) => b.pressed ? i : null).filter(Boolean));
  console.log('axes:', gp.axes.map((a, i) => `${i}:${a.toFixed(2)}`).join(' '));
}

// Common gamepad bugs:
// 1. Axis deadzone too small — stick drift causes phantom movement
//    Fix: if (Math.abs(axis) < 0.15) axis = 0;
// 2. Button index varies between PS/Xbox/generic controllers
//    Fix: log all button indices on connect and map dynamically
// 3. Gamepad object is stale — must call navigator.getGamepads() every frame
//    Fix: never cache the gamepad object, always re-poll
// 4. Second player gamepad at index 1 — not index 0
//    Fix: map player slots to gamepad indices explicitly

const DEADZONE = 0.15;
function applyDeadzone(value) {
  return Math.abs(value) < DEADZONE ? 0 : value;
}
```

## FSM State Debugging

```js
// Track state transitions to catch illegal transitions
function setState(entity, newState) {
  if (DEBUG) console.log(`[${entity.id}] ${entity.state} → ${newState}`);
  entity.prevState = entity.state;
  entity.state = newState;
}
// Common bug: state set multiple times per frame
// Fix: guard with `if (entity.state === newState) return;`
```

## Performance Debugging

```js
// Check for allocation inside game loop (causes GC stutters)
// Run Chrome DevTools Performance tab, look for frequent GC events
// Common offenders:
// - new THREE.Vector3() inside update()
// - array.filter() / array.map() inside update()
// - Object.keys() inside update()
// Fix: pre-allocate all vectors/matrices at class level, reuse via .set() / .copy()

// Monitor FPS drop
let frameCount = 0, fpsTimer = 0, fps = 60;
function trackFPS(dt) {
  frameCount++;
  fpsTimer += dt;
  if (fpsTimer >= 1) {
    fps = frameCount;
    frameCount = 0;
    fpsTimer = 0;
    if (fps < 50) console.warn(`FPS drop: ${fps}`);
  }
}
```
