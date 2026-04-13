---
name: systematic-debugging
description: Methodical debugging for Three.js rendering issues, 2.5D collision bugs, depth sorting errors, and game loop problems. Use when something is broken and the cause is unclear.
source: https://github.com/obra/superpowers/blob/main/skills/systematic-debugging/SKILL.md
---

# Systematic Debugging

Never guess. Always investigate before fixing.

## Process

1. **Reproduce** — confirm the bug is consistent and describe exact conditions
2. **Isolate** — narrow down to the smallest failing case (comment out code, binary search)
3. **Hypothesise** — form ONE specific hypothesis about the cause
4. **Test** — write a minimal test or add a single log to confirm/deny the hypothesis
5. **Fix** — only fix after the root cause is confirmed
6. **Verify** — confirm the fix resolves the issue without regressions

## Three.js Specific Debug Checklist

- Use `renderer.info` to check draw calls, triangles, textures in frame
- Add `THREE.AxesHelper` and `THREE.GridHelper` to visualise coordinate system
- Use `THREE.ArrowHelper` to visualise vectors (velocity, normals)
- Check `console.warn` for Three.js deprecation warnings
- Verify object is added to scene: `scene.children.includes(obj)`
- Verify geometry has vertices: `geometry.attributes.position.count > 0`

## Game Loop Debugging

```js
// Add frame counter to isolate timing bugs
let frame = 0;
function animate() {
  requestAnimationFrame(animate);
  frame++;
  if (frame % 60 === 0) console.log('60 frames passed, state:', gameState);
  update();
  renderer.render(scene, camera);
}
```

## Collision Debugging

- Visualise hitboxes with `THREE.BoxHelper` or `THREE.Box3Helper`
- Log collision pairs each frame when debugging
- Check coordinate space mismatches (local vs world space)
