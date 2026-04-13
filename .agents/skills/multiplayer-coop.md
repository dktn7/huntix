---
name: multiplayer-coop
description: 1-4P shared-screen local co-op for Huntix. Phase 3 feature. Read current limitations section first before building anything.
---

# Multiplayer Co-op for Huntix

## ⚠️ Current Implementation Status

| Feature | Status |
|---|---|
| P1 keyboard (WASD/J/K/Shift/E) | ✅ Built — InputManager.js |
| P1 gamepad (index 0) | ✅ Built — InputManager.js |
| P2 keyboard | ❌ Phase 3 only |
| P2–P4 gamepad | ❌ Phase 3 only |
| Shared camera zoom | ❌ Phase 3 only |
| AI companion fill | ❌ Phase 3 only |

## Real P1 Bindings (from InputManager.js)

```js
// Keyboard P1
// Move: WASD + Arrow keys
// Light: J | Heavy: K | Dodge: Shift | Special: E | Interact: F | Pause: Escape

// Gamepad P1 (index 0) — deadzone 0.3
// axes[0]=LX, axes[1]=LY
// btn 0=Interact, 1=Dodge, 2=Light, 3=Heavy, 5=Special, 9=Pause
```

## Phase 3: Extend InputManager.js for P2–P4

```js
// Add per-player keyboard map for P2
const KEY_MAP_P2 = {
  'KeyH':'LIGHT', 'KeyL':'HEAVY', 'KeyN':'DODGE', 'KeyM':'SPECIAL',
  // Movement: confirm from docs/INPUT.md
};

// P2–P4 gamepads: poll by playerIndex each frame
const gp = navigator.getGamepads()[playerIndex]; // NEVER cache this
```

## Player Slots

```js
const players = [
  { id:0, type:'human', inputDevice:'keyboard', hunter:'dabik' },   // ✅ P1 ready
  { id:1, type:'human', inputDevice:'gamepad1', hunter:'benzu' },   // Phase 3
  { id:2, type:'ai',    inputDevice:null,        hunter:'sereisa'}, // Phase 3
  { id:3, type:'ai',    inputDevice:null,        hunter:'vesol' },  // Phase 3
];
```

## Shared Camera (Phase 3)

```js
function updateSharedCamera(camera, players, padding = 4) {
  const living = players.filter(p => p.state !== 'DEAD');
  if (!living.length) return;
  const xs = living.map(p => p.position.x);
  const zs = living.map(p => p.position.z);
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const spread  = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
  camera.position.x += (centerX - camera.position.x) * 0.08;
  const targetHalf = Math.max(10, spread / 2 + padding);
  camera.top += (targetHalf - camera.top) * 0.08;
  camera.bottom = -camera.top;
  camera.left = camera.bottom * (window.innerWidth / window.innerHeight);
  camera.right = -camera.left;
  camera.updateProjectionMatrix();
}
```

## AI Companion Fill (Phase 3)

```js
// Target nearest enemy, attack when in range, human-ish cooldown
if (dist > 3) { /* chase */ }
else if (cooldown <= 0) { hunter.triggerAttack('light'); cooldown = 0.6 + Math.random()*0.4; }
```

## Co-op Scaling

```js
function getCoopScaling(n) {
  return {
    enemyHpMult:       [1.0,1.5,2.0,2.5][n-1],
    bossHpMult:        [1.0,1.8,2.4,3.0][n-1],
    essenceRewardMult: [1.0,1.2,1.4,1.6][n-1],
  };
}
```

## Player Colours

| P | Hunter | Hex |
|---|---|---|
| P1 | Dabik | `#9b59b6` |
| P2 | Benzu | `#f1c40f` |
| P3 | Sereisa | `#00d4ff` |
| P4 | Vesol | `#ff4500` |
