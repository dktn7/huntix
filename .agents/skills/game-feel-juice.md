---
name: game-feel-juice
description: Hitstop, screenshake, hit sparks, floating damage numbers, enemy stagger, screen flash. Use during Phase 2 when wiring combat feedback. These make the brawler feel satisfying.
---

# Game Feel & Juice for Huntix

## Hitstop (AGENTS.md spec)

```js
class HitstopManager {
  constructor() { this.remaining = 0; }
  trigger(ms) { this.remaining = ms / 1000; }
  apply(dt) {
    if (this.remaining > 0) { this.remaining -= dt; return 0; }
    return dt;
  }
}
// Light hit: trigger(80) | Heavy hit: trigger(150) | Boss phase: trigger(300)
export const hitstop = new HitstopManager();
```

## Screenshake (Trauma-Based)

```js
class ScreenShake {
  constructor(camera) { this.camera = camera; this.trauma = 0; this.origin = camera.position.clone(); }
  add(amount) { this.trauma = Math.min(1, this.trauma + amount); }
  update(dt) {
    if (this.trauma <= 0) return;
    const s = this.trauma * this.trauma * 0.3;
    this.camera.position.x = this.origin.x + (Math.random()*2-1) * s;
    this.camera.position.y = this.origin.y + (Math.random()*2-1) * s;
    this.trauma = Math.max(0, this.trauma - dt * 2);
  }
}
// Light hit: add(0.15) | Heavy hit: add(0.3) | Player hurt: add(0.4) | Boss slam: add(0.6)
```

## Hit Sparks (500-Particle Pool)

```js
// Allocate all particles at init, never inside game loop
class SparkPool {
  constructor(scene) {
    this.particles = Array.from({ length: 500 }, () => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.04), new THREE.MeshBasicMaterial({ color: 0xffdd00 }));
      mesh.visible = false;
      scene.add(mesh);
      return { mesh, velocity: new THREE.Vector3(), life: 0 };
    });
  }
  emit(pos, count = 8, color = 0xffdd00) {
    let n = 0;
    for (const p of this.particles) {
      if (p.life > 0 || n >= count) continue;
      p.mesh.position.copy(pos);
      p.mesh.material.color.setHex(color);
      p.velocity.set((Math.random()-0.5)*8, Math.random()*5+2, (Math.random()-0.5)*4);
      p.life = 0.3 + Math.random() * 0.2;
      p.mesh.visible = true;
      n++;
    }
  }
  update(dt) {
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= 15 * dt;
      p.mesh.visible = p.life > 0;
    }
  }
}
```

## Enemy Stagger & Knockback

```js
function applyKnockback(enemy, attackerPos, force) {
  const dir = enemy.position.clone().sub(attackerPos).normalize();
  dir.y = 0;
  enemy.knockbackVelocity = dir.multiplyScalar(force);
  enemy.state = 'STAGGER';
  enemy.staggerTime = 0.3;
}
// Forces: light=3, heavy=7, boss slam=12
```

## Per-Hit Feel Checklist

- [ ] Hitstop (80–150ms dt freeze)
- [ ] Sparks at contact point
- [ ] Screenshake trauma added
- [ ] Floating damage number
- [ ] Enemy stagger + knockback
- [ ] Hit SFX with positional pan
