---
name: systematic-debugging
description: Methodical debugging for Three.js rendering issues, 2.5D collision bugs, depth sorting errors, and game loop problems. Always load alongside threejs-skills.
---

# Systematic Debugging

Never guess. Always investigate before fixing.

## Process

1. **Reproduce** — confirm the bug is consistent
2. **Isolate** — binary search: comment out code until bug disappears
3. **Hypothesise** — form ONE specific hypothesis
4. **Test** — add a single log or minimal test to confirm/deny
5. **Fix** — only fix after root cause confirmed
6. **Verify** — confirm fix without regressions

## Three.js Debug Checklist

- `renderer.info` — check draw calls, triangles, textures per frame
- Add `THREE.AxesHelper` and `THREE.GridHelper` to visualise coordinate system
- Verify object in scene: `scene.children.includes(obj)`
- Verify geometry has vertices: `geometry.attributes.position.count > 0`
- Check Y-sort running every frame, not just on spawn

## Game Loop Debugging

```js
let frame = 0;
function animate() {
  requestAnimationFrame(animate);
  frame++;
  if (frame % 60 === 0) console.log('state:', gameState);
  update(dt);
  renderer.render(scene, camera);
}
```

## Collision Debugging

- Visualise hitboxes with `THREE.Box3Helper`
- Log collision pairs each frame when debugging
- Always check coordinate space: local vs world (`getWorldPosition()`)
