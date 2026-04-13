---
name: find-bugs
description: Proactively find bugs before they reach the player. Use during code review, before merging, or when a system feels flaky.
---

# Find Bugs

Actively hunt for bugs — do not wait for them to surface at runtime.

## Strategy

1. Read code as an adversarial player trying to break the game
2. Identify all assumptions and check if they can be violated
3. Look for: off-by-one errors, null/undefined access, race conditions, wrong coordinate spaces

## Common Huntix Bug Patterns

### Three.js
- Forgetting `geometry.dispose()` + `material.dispose()` on enemy death → memory leak
- Using `mesh.position` instead of `mesh.getWorldPosition()` for collision → wrong coords
- Mutating shared `THREE.Vector3` objects → unexpected state corruption
- Not removing event listeners on scene teardown → accumulation

### Game Logic
- Player can attack during death animation if FSM not checked
- Enemy spawner continues after all players dead if game-over flag not set
- Essence not awarded if player disconnects between boss death and reward
- Hitstop dt freeze not applied to all subsystems uniformly

### Performance
- `new THREE.Vector3()` inside animation loop → GC pressure
- `scene.traverse()` every frame → O(n) per tick
- Loading textures inside game loop instead of preloading

## Output Format

For each bug: **Location** | **Type** (crash/logic/perf/memory) | **Severity** | **Fix**
