---
name: boss-intro
description: Boss entrance, name card, health bar dramatic reveal, phase transition roar. Most memorable moments in a beat em up. Phase 4.
---

# Boss Intro (Quick Ref)

## Sequence
1. Lock arena walls
2. `gameLoop.timeScale = 0` freeze
3. `overlay.flashWhite(120)`
4. Spawn boss + `cameraShake.add(0.8)` + `audio.play('boss_spawn_impact')`
5. Show name card (CSS `bossSlam` animation)
6. `gameLoop.timeScale = 1.0`
7. `animateBossHPBar()` — width 0→100% over 0.8s

## Phase Transition
```js
gameLoop.timeScale = 0.08;
overlay.flashWhite(100);
cameraShake.add(1.0);
await sleep(800);
gameLoop.timeScale = 1.0;
boss.mesh.material.emissiveIntensity = 3.0; // flash new phase colour
```

## Boss HP Bar
```js
// updateBossHP(current, max):
const pct = (current/max)*100;
document.getElementById('boss-hp-fill').style.width = `${pct}%`;
document.getElementById('boss-hp-fill').style.background = `hsl(${Math.round(pct*1.2)},90%,50%)`;
```

## CSS Keys
```css
@keyframes bossSlam { from{opacity:0;transform:translate(-50%,-50%) scale(2.5)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
```

## Integration
- `BossController.js` on spawn → `playBossIntro()`
- `BossController.update()` → `updateBossHP()` every frame
- Phase threshold (50% HP) → `playBossPhaseTransition()`
- Requires `screen-transitions.md` overlay + `GameLoop.timeScale`
