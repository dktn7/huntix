---
name: level-clear-celebration
description: Post-wave and post-boss score screen, XP bar fill, loot spray, victory pose. The punctuation after every fight. Phase 4+.
---

# Level Clear (Quick Ref)

## Wave Clear
```js
hitstop.trigger(200);
audio.play('wave_clear_sting');
overlay.flashWhite(80);
hunters.forEach(h=>h.setState('VICTORY'));
setTimeout(()=>sprayLoot(), 400);
```

## Boss Clear
```js
gameLoop.timeScale = 0.05; overlay.flashWhite(150); cameraShake.add(0.9);
await sleep(1200); gameLoop.timeScale = 1.0;
await sleep(600); audio.play('victory_fanfare');
showResultsScreen();
```

## Stat Count-Up
```js
function animateCount(elId, from, to, ms) {
  const start = performance.now();
  const tick = () => {
    const t = Math.min((performance.now()-start)/ms, 1);
    const ease = 1-Math.pow(1-t,3);
    document.getElementById(elId).textContent = Math.round(from+(to-from)*ease);
    if (t<1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
```

## XP Bar Fill
```js
// Animate bar width from currentXP to currentXP+earned over ~0.5s
// On overflow (level up): flash bar gold, play sting, show level splash
```

## Integration
- `EnemySpawner.js` on wave=0 → `onWaveClear()`
- `BossController.js` on boss HP=0 → `onBossClear()`
- `LevelingSystem.js` (Phase 5) drives XP bar data
