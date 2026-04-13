---
name: game-feel-juice
description: Implement game feel systems for Huntix — hitstop, screenshake, camera nudge, hit sparks, damage numbers, screen flash, and enemy stagger. Use during Phase 2 (days 4-6) when wiring combat feedback. These systems are what make the brawler feel satisfying.
---

# Game Feel & Juice for Huntix

Every hit must feel physical. These systems turn functional combat into satisfying combat.

## Hitstop (Time Freeze on Hit)

Freeze `dt` for a few frames — the most impactful single feel improvement:

```js
class HitstopManager {
  constructor() {
    this.remaining = 0;
  }

  trigger(durationMs) {
    this.remaining = durationMs / 1000;
  }

  // Call in game loop — returns effective dt
  apply(dt) {
    if (this.remaining > 0) {
      this.remaining -= dt;
      return 0; // freeze everything
    }
    return dt;
  }
}

// AGENTS.md spec:
// Light attack hit:  trigger(80)
// Heavy attack hit:  trigger(150)
// Boss phase change: trigger(300)
export const hitstop = new HitstopManager();
```

## Screenshake

```js
class ScreenShake {
  constructor(camera) {
    this.camera = camera;
    this.trauma = 0; // 0-1 intensity
    this.origin = camera.position.clone();
  }

  add(amount) {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  update(dt) {
    if (this.trauma <= 0) return;
    const shake = this.trauma * this.trauma; // square for falloff
    const maxOffset = 0.3;
    this.camera.position.x = this.origin.x + (Math.random() * 2 - 1) * maxOffset * shake;
    this.camera.position.y = this.origin.y + (Math.random() * 2 - 1) * maxOffset * shake;
    this.trauma = Math.max(0, this.trauma - dt * 2);
  }
}

// Usage:
// Light hit:   shake.add(0.15)
// Heavy hit:   shake.add(0.3)
// Boss slam:   shake.add(0.6)
// Player hurt: shake.add(0.4)
export const shake = new ScreenShake(camera);
```

## Hit Sparks (Particle Pool)

Pool particles — never create new objects in the game loop:

```js
const POOL_SIZE = 500; // AGENTS.md: max 500 particles

class SparkPool {
  constructor(scene) {
    this.particles = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.04),
        new THREE.MeshBasicMaterial({ color: 0xffdd00 })
      );
      mesh.visible = false;
      scene.add(mesh);
      this.particles.push({ mesh, velocity: new THREE.Vector3(), life: 0 });
    }
  }

  emit(position, count = 8, color = 0xffdd00) {
    let spawned = 0;
    for (const p of this.particles) {
      if (p.life > 0 || spawned >= count) continue;
      p.mesh.position.copy(position);
      p.mesh.material.color.setHex(color);
      p.velocity.set(
        (Math.random() - 0.5) * 8,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 4
      );
      p.life = 0.3 + Math.random() * 0.2;
      p.mesh.visible = true;
      spawned++;
    }
  }

  update(dt) {
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= 15 * dt; // gravity
      p.mesh.visible = p.life > 0;
    }
  }
}

// Elemental spark colours:
// Dabik shadow: 0x9b59b6
// Benzu thunder: 0xf1c40f
// Sereisa lightning: 0x00d4ff
// Vesol flame: 0xff4500
```

## Floating Damage Numbers

```js
class DamageNumber {
  constructor(scene) {
    // Use CSS overlay div pool — not Three.js objects
    this.pool = Array.from({ length: 20 }, () => {
      const el = document.createElement('div');
      el.className = 'dmg-number';
      el.style.cssText = 'position:absolute;pointer-events:none;font-weight:bold;font-size:1.2rem;display:none;';
      document.getElementById('hud').appendChild(el);
      return { el, life: 0, y: 0 };
    });
  }

  spawn(worldPos, value, type = 'normal') {
    const item = this.pool.find(p => p.life <= 0);
    if (!item) return;
    item.el.textContent = value;
    item.el.style.color = type === 'crit' ? '#ff4500' : type === 'heal' ? '#2ecc71' : '#ffffff';
    item.el.style.display = 'block';
    item.worldPos = worldPos.clone();
    item.life = 0.8;
    item.floatY = 0;
  }

  update(dt, camera, renderer) {
    for (const item of this.pool) {
      if (item.life <= 0) continue;
      item.life -= dt;
      item.floatY += dt * 2;
      if (item.life <= 0) { item.el.style.display = 'none'; continue; }
      // Project world pos to screen
      const pos = item.worldPos.clone();
      pos.y += item.floatY;
      pos.project(camera);
      const x = (pos.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
      const y = (-pos.y * 0.5 + 0.5) * renderer.domElement.clientHeight;
      item.el.style.transform = `translate(${x}px, ${y}px)`;
      item.el.style.opacity = item.life * 2;
    }
  }
}
```

## Enemy Stagger & Knockback

```js
function applyKnockback(enemy, attackerPosition, force) {
  const dir = enemy.position.clone().sub(attackerPosition).normalize();
  dir.y = 0; // keep on ground plane
  enemy.knockbackVelocity = dir.multiplyScalar(force);
  enemy.state = 'STAGGER';
  enemy.staggerTime = 0.3; // seconds
}

// In enemy update:
if (enemy.state === 'STAGGER') {
  enemy.position.addScaledVector(enemy.knockbackVelocity, dt);
  enemy.knockbackVelocity.multiplyScalar(1 - dt * 8); // friction
  enemy.staggerTime -= dt;
  if (enemy.staggerTime <= 0) enemy.state = 'IDLE';
}

// Knockback forces (AGENTS.md spec):
// Light hit: 3
// Heavy hit: 7
// Dodge through: 0 (no knockback, just i-frames)
// Boss slam: 12
```

## Screen Flash on Player Hurt

```js
// Single full-screen div in HUD
const flashEl = document.getElementById('screen-flash');
// CSS: position:fixed; inset:0; pointer-events:none; background:red; opacity:0;

function triggerHurtFlash() {
  flashEl.style.transition = 'none';
  flashEl.style.opacity = '0.35';
  requestAnimationFrame(() => {
    flashEl.style.transition = 'opacity 0.3s ease';
    flashEl.style.opacity = '0';
  });
}
```

## Feel Checklist — Every Hit Must Have

- [ ] Hitstop (freeze dt for 80–150ms)
- [ ] Spark particles emitted at contact point
- [ ] Screenshake (trauma added)
- [ ] Floating damage number
- [ ] Enemy stagger + knockback vector
- [ ] Hit SFX with positional pan (see spatial-audio.md)
