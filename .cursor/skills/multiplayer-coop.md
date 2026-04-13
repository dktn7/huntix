---
name: multiplayer-coop
description: 1-4P shared-screen local co-op for Huntix. Covers input routing, shared orthographic camera, AI companion fill, co-op scaling, player colour readability. Use for Phase 3. Read current limitations before building.
---

# Multiplayer Co-op for Huntix

## ⚠️ Current Implementation Status

| Feature | Status |
|---|---|
| P1 keyboard (WASD/J/K/Shift/E) | ✅ Built — `src/engine/InputManager.js` |
| P1 gamepad (index 0) | ✅ Built — `src/engine/InputManager.js` |
| P2 keyboard | ❌ Not yet — build in Phase 3 |
| P2–P4 gamepad (index 1–3) | ❌ Not yet — build in Phase 3 |
| Shared camera zoom | ❌ Not yet — build in Phase 3 |
| AI companion fill | ❌ Not yet — build in Phase 3 |

**Do not build P2–P4 input before Phase 3 (Days 7–9).**

## Real P1 Bindings (from InputManager.js — match exactly)

```js
// P1 Keyboard — already implemented
const KEY_MAP = {
  'KeyA': 'MOVE_LEFT',  'ArrowLeft':  'MOVE_LEFT',
  'KeyD': 'MOVE_RIGHT', 'ArrowRight': 'MOVE_RIGHT',
  'KeyW': 'MOVE_UP',    'ArrowUp':    'MOVE_UP',
  'KeyS': 'MOVE_DOWN',  'ArrowDown':  'MOVE_DOWN',
  'KeyJ': 'LIGHT',
  'KeyK': 'HEAVY',
  'ShiftLeft':  'DODGE',
  'ShiftRight': 'DODGE',
  'KeyE': 'SPECIAL',
  'KeyF': 'INTERACT',
  'Escape': 'PAUSE',
};

// P1 Gamepad — already implemented (index 0)
// axes[0] LX, axes[1] LY — deadzone 0.3 (NOT 0.15 — matches InputManager)
// btn 0=Interact, 1=Dodge, 2=Light, 3=Heavy, 5=Special, 9=Pause
```

## Phase 3: Extending to P2–P4

When building multi-player input in Phase 3, extend `InputManager.js` — do NOT create a separate input class.

P2 keyboard layout to add:

```js
// Add to InputManager for player index 1
const KEY_MAP_P2 = {
  'KeyH': 'LIGHT',
  'KeyL': 'HEAVY',
  'KeyN': 'DODGE',
  'KeyM': 'SPECIAL',
  // Movement: numpad or IJKL — confirm with docs/INPUT.md before implementing
};

// P2–P4 gamepads: poll navigator.getGamepads()[playerIndex]
// Each player maps to their slot index (P2 = index 1, P3 = index 2, P4 = index 3)
// Always re-poll every frame — never cache the gamepad object
const gp = navigator.getGamepads()[playerIndex]; // inside animate() only
```

## Player Slot Architecture

```js
// Up to 4 player slots — null type = AI fill
const players = [
  { id: 0, type: 'human', inputDevice: 'keyboard',  hunter: 'dabik' },   // P1 ✅ ready
  { id: 1, type: 'human', inputDevice: 'gamepad1',  hunter: 'benzu' },   // Phase 3
  { id: 2, type: 'ai',    inputDevice: null,         hunter: 'sereisa' }, // Phase 3
  { id: 3, type: 'ai',    inputDevice: null,         hunter: 'vesol' },   // Phase 3
];
```

## Shared Orthographic Camera (Phase 3)

Camera must frame all living players at all times:

```js
function updateSharedCamera(camera, players, padding = 4) {
  const living = players.filter(p => p.state !== 'DEAD');
  if (!living.length) return;

  const xs = living.map(p => p.position.x);
  const zs = living.map(p => p.position.z);
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const spread  = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));

  // Smooth follow
  camera.position.x += (centerX - camera.position.x) * 0.08;

  // Zoom out as players spread — orthographic frustum adjust
  const targetHalf = Math.max(10, spread / 2 + padding);
  camera.top    += (targetHalf - camera.top) * 0.08;
  camera.bottom  = -camera.top;
  camera.left    = camera.bottom * (window.innerWidth / window.innerHeight);
  camera.right   = -camera.left;
  camera.updateProjectionMatrix();
}
```

## AI Companion Fill (Phase 3)

```js
class AICompanion {
  constructor(hunter, allPlayers) {
    this.hunter = hunter;
    this.target = null;
    this.actionCooldown = 0;
  }

  update(dt, enemies) {
    this.actionCooldown -= dt;
    this.target = enemies.reduce((nearest, e) => {
      const d = this.hunter.position.distanceTo(e.position);
      return (!nearest || d < nearest.dist) ? { enemy: e, dist: d } : nearest;
    }, null)?.enemy;

    if (!this.target) return;
    const dist = this.hunter.position.distanceTo(this.target.position);
    if (dist > 3) {
      const dir = this.target.position.clone().sub(this.hunter.position).normalize();
      this.hunter.position.addScaledVector(dir, this.hunter.stats.moveSpeed * dt);
    } else if (this.actionCooldown <= 0) {
      this.hunter.triggerAttack('light');
      this.actionCooldown = 0.6 + Math.random() * 0.4; // human-ish timing
    }
  }
}
```

## Co-op HP & Essence Scaling

```js
function getCoopScaling(playerCount) {
  return {
    enemyHpMult:        [1.0, 1.5, 2.0, 2.5][playerCount - 1],
    bossHpMult:         [1.0, 1.8, 2.4, 3.0][playerCount - 1],
    essenceRewardMult:  [1.0, 1.2, 1.4, 1.6][playerCount - 1],
  };
}
```

## Player Colour Assignments

| Player | Hunter | Colour | Hex |
|---|---|---|---|
| P1 | Dabik | Purple | `#9b59b6` |
| P2 | Benzu | Gold | `#f1c40f` |
| P3 | Sereisa | Cyan | `#00d4ff` |
| P4 | Vesol | Orange | `#ff4500` |

## Status Effect Synergies

| Combo | Effect |
|---|---|
| Bleed (Dabik) + Slow (Sereisa) | Setup → punish window |
| Stun (Benzu) + wall | Trapped enemy |
| Burn (Vesol) + Slam (Benzu) | AoE damage burst |
| Slow (Sereisa) + Blink (Dabik) | Safe gap-close |
