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

  reset() {
    this.count = 0;
    this.multiplier = 1.0;
    this.windowTimer = 0;
  }

  onPlayerHurt() { this.reset(); } // combo breaks on taking damage
}
```

## Signature Combo Sequences

Detect input sequence within a 0.6s window per step:

| Hunter | Sequence | Name | Effect |
|--------|----------|------|--------|
| Dabik | L→L→H | Shadow Ender | teleport behind + bleed |
| Benzu | H→H→L | Earthshatter | AoE stun slam |
| Sereisa | L→H→L | Arc Flash | chain lightning |
| Vesol | L→L→L→H | Flame Burst | pushback + burn AoE |

```js
class SignatureComboDetector {
  constructor(sequence, timeLimit = 0.6) {
    this.sequence = sequence; // e.g. ['L','L','H']
    this.timeLimit = timeLimit;
    this.progress = 0;
    this.timer = 0;
  }

  input(action) { // action = 'L' or 'H'
    if (action === this.sequence[this.progress]) {
      this.progress++;
      this.timer = this.timeLimit;
      if (this.progress === this.sequence.length) {
        this.progress = 0;
        return true; // COMBO TRIGGERED
      }
    } else {
      this.progress = 0;
      this.timer = 0;
    }
    return false;
  }

  update(dt) {
    if (this.timer > 0) {
      this.timer -= dt;
      if (this.timer <= 0) { this.progress = 0; }
    }
  }
}
```

## Combo Counter UI

```js
// DOM overlay — no Three.js object needed, pure CSS/JS
function updateComboUI(count, multiplier) {
  const el = document.getElementById('combo-counter');
  if (count < 3) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.textContent = `${count} HIT`;
  // Escalating colour: white → yellow → orange → red
  const colours = ['#ffffff','#ffdd00','#ff8800','#ff2200'];
  el.style.color = colours[Math.min(Math.floor(count/10), 3)];
  // Scale punch on new hit
  el.style.transform = 'scale(1.4)';
  requestAnimationFrame(() => { el.style.transform = 'scale(1)'; });
  // Show multiplier if > 1
  document.getElementById('combo-multiplier').textContent =
    multiplier > 1 ? `x${multiplier.toFixed(2)}` : '';
}
```

## CSS for Combo Counter

```css
#combo-counter {
  position: fixed;
  right: 2rem;
  top: 40%;
  font-size: 3rem;
  font-weight: 900;
  font-family: 'Impact', sans-serif;
  text-shadow: 0 0 20px currentColor, 2px 2px 0 #000;
  transition: transform 0.08s ease-out;
  pointer-events: none;
  letter-spacing: 2px;
}
#combo-multiplier {
  font-size: 1.4rem;
  color: #ffdd00;
  display: block;
  text-align: right;
}
```

## Integration Points
- Call `tracker.hit(damage)` in `CombatController.js` on every confirmed hit
- Call `tracker.onPlayerHurt()` in `PlayerState.js` on HURT state entry
- Call `tracker.update(dt)` in main update loop
- Feed `count` and `multiplier` to `updateComboUI()` after each hit
- Check `SignatureComboDetector.input()` in `CombatController` on light/heavy press
