---
name: damage-numbers
description: Floating damage numbers — arc trajectory, crit scaling, colour by damage type. Tiny skill, massive feel payoff.
---

# Floating Damage Numbers

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
  spawn(worldPos, camera, canvas, value, type='normal') {
    const free = this.pool.find(p=>p.life<=0); if (!free) return;
    const v = worldPos.clone().project(camera);
    free.x = (v.x*0.5+0.5)*canvas.width + (Math.random()-0.5)*30;
    free.y = (-v.y*0.5+0.5)*canvas.height;
    free.vy = -180; free.life = 0.9;
    const colours = {normal:'#fff',crit:'#ffdd00',burn:'#ff4500',bleed:'#ff0044',stun:'#00d4ff',slow:'#aaffff',heal:'#44ff88'};
    free.el.textContent = type==='crit' ? `${value}!` : value;
    free.el.style.cssText += `color:${colours[type]??'#fff'};font-size:${type==='crit'?'2rem':'1.4rem'};display:block;opacity:1;left:${free.x}px;top:${free.y}px`;
  }
  update(dt) {
    for (const p of this.pool) {
      if (p.life<=0) continue;
      p.life-=dt; p.y+=p.vy*dt; p.vy*=0.92;
      p.el.style.top=`${p.y}px`; p.el.style.opacity=Math.max(0,p.life/0.9);
      if (p.life<=0) p.el.style.display='none';
    }
  }
}
```

```css
.dmg-num { position:fixed; font-family:'Impact',sans-serif; font-weight:900; text-shadow:2px 2px 0 #000,0 0 12px currentColor; pointer-events:none; z-index:500; transform:translateX(-50%); }
```

## Integration
- Instantiate once, call `spawn()` from `CombatController.js` + `StatusEffects.js`
- Call `update(dt)` in main loop
- Add `<div id="game-overlay">` over canvas in `index.html`
