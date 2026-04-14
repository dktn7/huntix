---
name: combo-system
description: Combo counter, multiplier escalation, hit sequencing, per-hunter signature combos, combo break on hurt. Use during Phase 2+. Core to beat 'em up feel.
---

# Combo System for Huntix

## Combo State Tracker

```js
class ComboTracker {
  constructor() {
    this.count = 0;
    this.multiplier = 1.0;
    this.windowTimer = 0;
    this.WINDOW = 2.0; // seconds to land next hit before reset
  }

  hit(baseDamage) {
    this.count++;
    this.windowTimer = this.WINDOW;
    this.multiplier = 1 + Math.floor(this.count / 5) * 0.25; // +25% every 5 hits
    return baseDamage * this.multiplier;
  }

  update(dt) {
    if (this.windowTimer > 0) {
      this.windowTimer -= dt;
      if (this.windowTimer <= 0) this.reset();
    }
  }

  reset() { this.count = 0; this.multiplier = 1.0; this.windowTimer = 0; }
  onPlayerHurt() { this.reset(); }
}
```

## Signature Combos

| Hunter | Sequence | Effect |
|--------|----------|--------|
| Dabik | L→L→H | Teleport behind + bleed |
| Benzu | H→H→L | AoE stun slam |
| Sereisa | L→H→L | Chain lightning |
| Vesol | L→L→L→H | Pushback + burn AoE |

## Combo UI

```js
function updateComboUI(count, multiplier) {
  const el = document.getElementById('combo-counter');
  if (count < 3) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.textContent = `${count} HIT`;
  const colours = ['#ffffff','#ffdd00','#ff8800','#ff2200'];
  el.style.color = colours[Math.min(Math.floor(count/10), 3)];
  el.style.transform = 'scale(1.4)';
  requestAnimationFrame(() => { el.style.transform = 'scale(1)'; });
}
```

## Integration
- `tracker.hit(dmg)` in `CombatController.js` on confirmed hit
- `tracker.onPlayerHurt()` in `PlayerState.js` on HURT state entry
- `tracker.update(dt)` in main loop
- `updateComboUI()` after each hit
