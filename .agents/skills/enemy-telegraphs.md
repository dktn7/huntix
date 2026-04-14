---
name: enemy-telegraphs
description: Visual enemy readability — attack wind-up flash, threat colour coding, aggro indicator, stagger flash, death dissolve. Separates readable combat from chaos.
---

# Enemy Telegraphs & Visual Readability

## Attack Wind-Up Flash

```js
// In EnemyAI.js — before every attack
const TELEGRAPH_DURATION = 0.4; // seconds

function startAttackTelegraph(enemy) {
  enemy.telegraphTimer = TELEGRAPH_DURATION;
  enemy.state = 'TELEGRAPH';
  // Flash the mesh red/orange
  enemy.mesh.material.emissive.setHex(0xff4400);
  enemy.mesh.material.emissiveIntensity = 1.2;
}

// In enemy update:
if (enemy.state === 'TELEGRAPH') {
  enemy.telegraphTimer -= dt;
  // Pulse: oscillate intensity
  const pulse = 0.5 + 0.5 * Math.sin(enemy.telegraphTimer * Math.PI * 8);
  enemy.mesh.material.emissiveIntensity = pulse * 1.5;
  if (enemy.telegraphTimer <= 0) {
    enemy.mesh.material.emissiveIntensity = 0;
    enemy.state = 'ATTACK';
  }
}
```

## Threat Colour Coding

```js
const ENEMY_COLOURS = {
  grunt:   { base: 0x884422, emissive: 0x000000 }, // standard
  shield:  { base: 0x334488, emissive: 0x0022ff }, // armoured blue
  berserker: { base: 0x882200, emissive: 0xff2200 }, // aggressive red
  miniboss: { base: 0x220044, emissive: 0x9900ff }, // purple menace
};
```

## Aggro Indicator

```js
// Small exclamation sprite above enemy head on aggro trigger
function showAggroIndicator(enemy, scene) {
  if (enemy.aggroIndicator) return;
  const geo = new THREE.PlaneGeometry(0.4, 0.6);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 1.8, 0.01);
  enemy.mesh.add(mesh);
  enemy.aggroIndicator = mesh;
  // Auto-remove after 0.6s
  enemy.aggroIndicatorTimer = 0.6;
}

// In update:
if (enemy.aggroIndicatorTimer > 0) {
  enemy.aggroIndicatorTimer -= dt;
  if (enemy.aggroIndicatorTimer <= 0 && enemy.aggroIndicator) {
    enemy.mesh.remove(enemy.aggroIndicator);
    enemy.aggroIndicator = null;
  }
}
```

## Stagger Flash (White Hit Confirm)

```js
function onEnemyHurt(enemy) {
  enemy.mesh.material.emissive.setHex(0xffffff);
  enemy.mesh.material.emissiveIntensity = 2.0;
  enemy.hurtFlashTimer = 0.08; // 80ms white flash
}

// In update:
if (enemy.hurtFlashTimer > 0) {
  enemy.hurtFlashTimer -= dt;
  if (enemy.hurtFlashTimer <= 0) {
    enemy.mesh.material.emissive.setHex(0x000000);
    enemy.mesh.material.emissiveIntensity = 0;
  }
}
```

## Death Dissolve

```js
function startDeathDissolve(enemy) {
  enemy.dying = true;
  enemy.dyingTimer = 0.5;
  // Switch to transparent material
  enemy.mesh.material.transparent = true;
}

// In update:
if (enemy.dying) {
  enemy.dyingTimer -= dt;
  enemy.mesh.material.opacity = Math.max(0, enemy.dyingTimer / 0.5);
  enemy.mesh.scale.y = Math.max(0, enemy.dyingTimer / 0.5); // shrink down
  if (enemy.dyingTimer <= 0) scene.remove(enemy.mesh); // return to pool
}
```

## Health Bar Above Enemy (Phase 2+)

```js
// Simple DOM bar, positioned via world-to-screen
function updateEnemyHealthBar(el, enemy, camera, canvas) {
  const v = enemy.mesh.position.clone().project(camera);
  const x = ( v.x * 0.5 + 0.5) * canvas.width;
  const y = (-v.y * 0.5 + 0.5) * canvas.height - 40;
  el.style.left = `${x - 25}px`;
  el.style.top  = `${y}px`;
  el.style.width = `${(enemy.hp / enemy.maxHp) * 50}px`;
}
```

## Integration Points
- `startAttackTelegraph()`: call in `EnemyAI.js` before ATTACK state
- `showAggroIndicator()`: call when enemy transitions from PATROL → AGGRO
- `onEnemyHurt()`: call in hit resolution in `CombatController.js`
- `startDeathDissolve()`: call on HP <= 0 before returning enemy to pool
