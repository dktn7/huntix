---
name: multiplayer-coop
description: Shared-screen 1-4P local co-op implementation for Huntix. Covers input routing per player, shared orthographic camera framing, AI companion fill, co-op HP scaling, and player colour readability. Use when building Phase 3 co-op systems.
---

# Multiplayer Co-op for Huntix

Huntix supports 1–4 players on a single screen, keyboard + gamepad, no network required.

## Player Slot Architecture

```js
// Up to 4 player slots — null = AI fill or empty
const players = [
  { id: 0, type: 'human', inputDevice: 'keyboard', hunter: 'dabik' },
  { id: 1, type: 'human', inputDevice: 'gamepad0', hunter: 'benzu' },
  { id: 2, type: 'ai',    inputDevice: null,        hunter: 'sereisa' },
  { id: 3, type: 'ai',    inputDevice: null,        hunter: 'vesol' },
];
```

## Input Routing Per Player

Never read raw keys directly — route all input through InputManager with a player index:

```js
// InputManager.isDown(action, playerIndex)
// Player 0: WASD + ZXCV
// Player 1: Arrow keys + numpad
// Player 2+: Gamepad axes/buttons

const KEYBOARD_MAPS = [
  { move_up:'w', move_down:'s', move_left:'a', move_right:'d',
    attack_light:'z', attack_heavy:'x', dodge:'c', special:'v' },
  { move_up:'ArrowUp', move_down:'ArrowDown', move_left:'ArrowLeft', move_right:'ArrowRight',
    attack_light:'Numpad1', attack_heavy:'Numpad2', dodge:'Numpad3', special:'Numpad4' },
];
```

## Shared Orthographic Camera

Camera must frame all living players at all times:

```js
function updateSharedCamera(camera, players, padding = 4) {
  const living = players.filter(p => p.state !== 'DEAD');
  if (!living.length) return;

  const xs = living.map(p => p.position.x);
  const zs = living.map(p => p.position.z);

  const minX = Math.min(...xs) - padding;
  const maxX = Math.max(...xs) + padding;
  const minZ = Math.min(...zs) - padding;
  const maxZ = Math.max(...zs) + padding;

  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  // Smooth follow
  camera.position.x += (centerX - camera.position.x) * 0.08;
  camera.position.z += (centerZ + 20 - camera.position.z) * 0.08;

  // Zoom out as players spread (orthographic frustum)
  const spread = Math.max(maxX - minX, maxZ - minZ);
  const targetHalfSize = Math.max(10, spread / 2 + padding);
  camera.top += (targetHalfSize - camera.top) * 0.08;
  camera.bottom = -camera.top;
  camera.left = camera.bottom * (window.innerWidth / window.innerHeight);
  camera.right = -camera.left;
  camera.updateProjectionMatrix();
}
```

## AI Companion Fill

When fewer than 4 humans join, fill remaining slots with AI hunters:

```js
class AICompanion {
  constructor(hunter, allPlayers) {
    this.hunter = hunter;
    this.allPlayers = allPlayers;
    this.target = null;
    this.state = 'IDLE';
    this.actionCooldown = 0;
  }

  update(dt, enemies) {
    this.actionCooldown -= dt;
    // Find nearest enemy
    this.target = enemies.reduce((nearest, e) => {
      const d = this.hunter.position.distanceTo(e.position);
      return (!nearest || d < nearest.dist) ? { enemy: e, dist: d } : nearest;
    }, null)?.enemy;

    if (!this.target) { this.state = 'IDLE'; return; }

    const dist = this.hunter.position.distanceTo(this.target.position);
    if (dist > 3) {
      this.state = 'CHASE';
      // Move toward target
      const dir = this.target.position.clone().sub(this.hunter.position).normalize();
      this.hunter.position.addScaledVector(dir, this.hunter.stats.moveSpeed * dt);
    } else if (this.actionCooldown <= 0) {
      this.state = 'ATTACK';
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
    enemyHpMult:      [1.0, 1.5, 2.0, 2.5][playerCount - 1],
    bossHpMult:       [1.0, 1.8, 2.4, 3.0][playerCount - 1],
    essenceRewardMult:[1.0, 1.2, 1.4, 1.6][playerCount - 1],
  };
}
```

## Player Colour Readability

Each player gets a distinct tint so they are always identifiable in chaotic fights:

| Player | Hunter | Colour | Hex |
|---|---|---|---|
| P1 | Dabik | Purple | `#9b59b6` |
| P2 | Benzu | Gold | `#f1c40f` |
| P3 | Sereisa | Cyan | `#00d4ff` |
| P4 | Vesol | Orange | `#ff4500` |

Apply as an emissive tint on the hunter mesh, not a full material replacement.

## Status Effect Synergies (Co-op)

| Combo | Effect |
|---|---|
| Bleed (Dabik) + Slow (Sereisa) | Setup → punish window |
| Stun (Benzu) + wall | Trapped enemy |
| Slow (Sereisa) + Blink (Dabik) | Safe gap-close for Dabik |
| Burn (Vesol) + Earth Slam (Benzu) | AoE damage burst |

## Respawn Rules

- Dead player respawns at next zone transition (not mid-zone)
- In single-player, death = run over
- Surviving players get a small HP bonus when a teammate dies (compensation)
- Never let a dead player block progress — ghost mode allowed to spectate
