---
name: find-bugs
description: Proactively find bugs in code before they reach the player. Use during code review, before merging features, or when a system feels flaky.
source: https://officialskills.sh/getsentry/skills/find-bugs
---

# Find Bugs

Actively hunt for bugs — do not wait for them to surface at runtime.

## Strategy

1. Read the code as if you are an adversarial player trying to break the game
2. Identify all assumptions the code makes and check if they can be violated
3. Look for: off-by-one errors, null/undefined access, race conditions, unreachable code, incorrect coordinate spaces

## Common Huntix Bug Patterns

### Three.js Pitfalls
- Forgetting to call `geometry.dispose()` and `material.dispose()` on enemy death → memory leak
- Using `mesh.position` instead of `mesh.getWorldPosition()` for collision → wrong coordinates
- Mutating `THREE.Vector3` objects shared between entities → unexpected state
- Not removing event listeners on scene teardown → listener accumulation

### Game Logic Pitfalls
- Player can attack during death animation if state machine not checked
- Enemy spawner continues after all players dead if game-over flag not set
- Co-op score not synced if only updated on one player's local state
- Essence not awarded if player disconnects between boss death and reward screen

### Performance Pitfalls
- Creating `new THREE.Vector3()` inside the animation loop → GC pressure
- Calling `scene.traverse()` every frame → O(n) every tick
- Loading textures inside the game loop instead of preloading

## Output Format

For each bug found:
- **Location**: file + line
- **Type**: crash / logic / performance / memory
- **Severity**: critical / high / medium / low
- **Fix**: specific corrective action
