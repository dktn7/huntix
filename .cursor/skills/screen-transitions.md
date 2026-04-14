---
name: screen-transitions
description: Zone entry, boss intro freeze-frame, death flash, level clear iris wipe, slow-mo zoom. Use Phase 4+.
---

# Screen Transitions for Huntix

## Overlay Manager

```js
class TransitionOverlay {
  constructor() {
    this.el = document.createElement('div');
    Object.assign(this.el.style, { position:'fixed', inset:'0', background:'#000', opacity:'0', pointerEvents:'none', zIndex:'1000', transition:'opacity 0.15s ease' });
    document.body.appendChild(this.el);
  }
  flashBlack(ms = 80) { this.el.style.opacity='1'; setTimeout(()=>{ this.el.style.opacity='0'; }, ms); }
  flashWhite(ms = 80) { this.el.style.background='#fff'; this.flashBlack(ms); setTimeout(()=>{ this.el.style.background='#000'; }, ms+50); }
  fadeOut(ms=400) { return new Promise(r=>{ this.el.style.transition=`opacity ${ms}ms ease`; this.el.style.opacity='1'; setTimeout(r,ms); }); }
  fadeIn(ms=400)  { return new Promise(r=>{ this.el.style.transition=`opacity ${ms}ms ease`; this.el.style.opacity='0'; setTimeout(r,ms); }); }
}
export const overlay = new TransitionOverlay();
```

## Slow-Mo (add to GameLoop)

```js
// GameLoop: this.timeScale = 1.0; rawDt *= this.timeScale in RAF
// Boss phase break: gameLoop.timeScale = 0.15; setTimeout(()=>{ gameLoop.timeScale=1.0; }, 600);
```

## Integration
- Instantiate once in `main.js`
- Kill freeze: `hitstop.trigger(300)` + `overlay.flashBlack(60)` on enemy death
- Zone change: `await overlay.fadeOut(300)` → swap scene → `await overlay.fadeIn(300)`
- Boss intro: `overlay.flashWhite(120)` + name card
- Player death: `overlay.flashBlack(200)` → `overlay.fadeOut(500)` after 400ms
