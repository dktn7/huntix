---
name: damage-numbers
description: Floating damage numbers with arc trajectory, crit scaling, colour by type, fade-out. Castle Crashers-style. Tiny skill, massive feel payoff.
---

# Floating Damage Numbers for Huntix

## DOM-Based Pool (no Three.js objects needed)

```js
class DamageNumberPool {
  constructor(size = 30) {
    this.pool = Array.from({ length: size }, () => {
      const el = document.createElement('div');
      el.className = 'dmg-num';
      el.style.display = 'none';
      document.getElementById('game-overlay').appendChild(el);
      return { el, vy: 0, x: 0, y: 0, life: 0 };
    });
  }

  spawn(worldPos, camera, canvas, value, type = 'normal') {
    const free = this.pool.find(p => p.life <= 0);
    if (!free) return;

    // World → screen projection
    const v = worldPos.clone().project(camera);
    const sx = ( v.x * 0.5 + 0.5) * canvas.width;
    const sy = (-v.y * 0.5 + 0.5) * canvas.height;

    free.x = sx + (Math.random() - 0.5) * 30;
    free.y = sy;
    free.vy = -180; // px/s upward
    free.life = 0.9;

    const colours = { normal:'#ffffff', crit:'#ffdd00', burn:'#ff4500', bleed:'#ff0044', stun:'#00d4ff', slow:'#aaffff', heal:'#44ff88' };
    free.el.textContent = type === 'crit' ? `${value}!` : value;
    free.el.style.color = colours[type] ?? '#ffffff';
    free.el.style.fontSize = type === 'crit' ? '2rem' : '1.4rem';
    free.el.style.display = 'block';
    free.el.style.opacity = '1';
    free.el.style.left = `${free.x}px`;
    free.el.style.top  = `${free.y}px`;
  }

  update(dt) {
    for (const p of this.pool) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.y += p.vy * dt;
      p.vy *= 0.92; // decelerate
      const alpha = Math.max(0, p.life / 0.9);
      p.el.style.top = `${p.y}px`;
      p.el.style.opacity = alpha;
      if (p.life <= 0) p.el.style.display = 'none';
    }
  }
}
```

## CSS

```css
.dmg-num {
  position: fixed;
  font-family: 'Impact', sans-serif;
  font-weight: 900;
  text-shadow: 2px 2px 0 #000, 0 0 12px currentColor;
  pointer-events: none;
  z-index: 500;
  transform: translateX(-50%);
  white-space: nowrap;
}
```

## Crit Detection

```js
function calcDamage(base, multiplier) {
  const isCrit = Math.random() < 0.15; // 15% base crit chance
  const value = Math.round(base * multiplier * (isCrit ? 2.0 : 1.0));
  return { value, isCrit };
}
// Usage in CombatController:
const { value, isCrit } = calcDamage(baseDmg, combo.multiplier);
damageNumbers.spawn(hitPos, camera, canvas, value, isCrit ? 'crit' : 'normal');
```

## Status Damage Numbers

```js
// Call from StatusEffects.js on each tick
function onStatusTick(pos, amount, statusType) {
  // statusType: 'burn' | 'bleed' | 'stun' | 'slow'
  damageNumbers.spawn(pos, camera, canvas, amount, statusType);
}
```

## Integration Points
- Instantiate `DamageNumberPool` once in `main.js`
- Add `<div id="game-overlay">` to `index.html` positioned over canvas
- Call `spawn()` from `CombatController.js` and `StatusEffects.js`
- Call `update(dt)` in main game loop
