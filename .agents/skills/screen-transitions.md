---
name: screen-transitions
description: Zone entry, boss intro freeze-frame, death flash, level clear iris wipe, slow-mo zoom. The pacing between moments is as important as the moments. Use Phase 4+.
---

# Screen Transitions for Huntix

## Overlay Manager (single DOM element)

```js
class TransitionOverlay {
  constructor() {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', inset: '0',
      background: '#000', opacity: '0',
      pointerEvents: 'none', zIndex: '1000',
      transition: 'opacity 0.15s ease'
    });
    document.body.appendChild(this.el);
  }

  flashBlack(durationMs = 80) {
    this.el.style.opacity = '1';
    setTimeout(() => { this.el.style.opacity = '0'; }, durationMs);
  }

  fadeOut(ms = 400) {
    return new Promise(resolve => {
      this.el.style.transition = `opacity ${ms}ms ease`;
      this.el.style.opacity = '1';
      setTimeout(resolve, ms);
    });
  }

  fadeIn(ms = 400) {
    return new Promise(resolve => {
      this.el.style.transition = `opacity ${ms}ms ease`;
      this.el.style.opacity = '0';
      setTimeout(resolve, ms);
    });
  }
}
export const overlay = new TransitionOverlay();
```

## Kill Freeze-Frame

```js
// In CombatController — on enemy death
function onKillFreeze(hitstop) {
  hitstop.trigger(300); // freeze game loop 300ms
  overlay.flashBlack(60); // quick black flash
  // Optional: zoom camera slightly toward kill point
}
```

## Boss Intro Sequence

```js
async function playBossIntro(bossName, overlay, hitstop) {
  // 1. Arena locks — spawn barriers
  // 2. Freeze everything
  hitstop.trigger(800);
  // 3. Flash + name card
  overlay.flashBlack(120);
  showBossNameCard(bossName); // see below
  await sleep(1800);
  hideBossNameCard();
  // 4. Boss health bar slams in
  animateBossHealthBarEntry();
}

function showBossNameCard(name) {
  const card = document.getElementById('boss-name-card');
  card.textContent = name;
  card.style.display = 'block';
  card.style.animation = 'bossCardIn 0.3s ease-out';
}
```

## Boss Name Card CSS

```css
#boss-name-card {
  display: none;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 4rem;
  font-weight: 900;
  color: #ff2200;
  text-shadow: 0 0 40px #ff0000, 3px 3px 0 #000;
  letter-spacing: 6px;
  text-transform: uppercase;
  pointer-events: none;
  z-index: 900;
}
@keyframes bossCardIn {
  from { opacity: 0; transform: translate(-50%, -50%) scale(1.6); }
  to   { opacity: 1; transform: translate(-50%, -50%) scale(1.0); }
}
```

## Zone Transition (Fade)

```js
async function changeZone(newZoneLoader, overlay) {
  await overlay.fadeOut(300);   // black out
  await newZoneLoader();        // swap scene
  await overlay.fadeIn(300);    // fade in new zone
}
```

## Slow-Mo on Boss Phase Transition

```js
// In GameLoop — expose a timeScale multiplier
class GameLoop {
  constructor() { this.timeScale = 1.0; }
  // In RAF: rawDt *= this.timeScale
}
// On boss phase break:
gameLoop.timeScale = 0.15;
overlay.flashBlack(80);
setTimeout(() => { gameLoop.timeScale = 1.0; }, 600);
```

## Player Death

```js
function onPlayerDeath(overlay) {
  overlay.flashBlack(200);
  // Then after 400ms fade to black and show death screen
  setTimeout(() => overlay.fadeOut(500), 400);
}
```

## Integration Points
- `TransitionOverlay` instantiate once in `main.js`, pass via dependency injection
- Kill freeze: call from `EnemyAI.js` on HP <= 0
- Boss intro: call from `BossController.js` on spawn
- Zone change: call from `ZoneManager.js` on portal touch
- `timeScale` on `GameLoop`: expose setter, default 1.0
