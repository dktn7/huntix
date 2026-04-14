---
name: boss-intro
description: Boss entrance sequence — arena lockdown, name card slate, health bar dramatic reveal, phase transition roar. Most memorable moments in a beat em up. Use Phase 4.
---

# Boss Intro & Phase Transitions for Huntix

## Boss Intro Sequence (Full)

```js
async function playBossIntro(boss, overlay, gameLoop, audio) {
  // 1. Lock arena — spawn invisible walls at edges
  boss.lockArena();

  // 2. Enemies freeze
  gameLoop.timeScale = 0;

  // 3. Ominous pause 400ms
  await sleep(400);

  // 4. Flash white
  overlay.flashWhite(120);

  // 5. Boss spawns with impact
  boss.spawn();
  audio.play('boss_spawn_impact');

  // 6. Screenshake
  cameraShake.add(0.8);

  // 7. Name card slams in
  await showBossNameCard(boss.name, boss.subtitle);

  // 8. Resume
  gameLoop.timeScale = 1.0;

  // 9. Boss health bar animates in
  animateBossHPBar();

  // 10. Boss roar
  audio.play('boss_roar');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
```

## Name Card HTML/CSS

```html
<div id="boss-intro-card" style="display:none">
  <div id="boss-intro-name"></div>
  <div id="boss-intro-subtitle"></div>
  <div id="boss-intro-bar"></div>
</div>
```

```css
#boss-intro-card {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 800;
}
#boss-intro-name {
  font-size: 5rem;
  font-weight: 900;
  color: #ff2200;
  text-shadow: 0 0 60px #ff0000, 4px 4px 0 #000;
  letter-spacing: 8px;
  text-transform: uppercase;
  animation: bossSlam 0.25s cubic-bezier(0.2, 2, 0.4, 1) forwards;
}
#boss-intro-subtitle {
  font-size: 1.6rem;
  color: #aaaaaa;
  letter-spacing: 4px;
  margin-top: 0.5rem;
  animation: bossFade 0.4s ease 0.2s both;
}
#boss-intro-bar {
  width: 40vw;
  height: 4px;
  background: #ff2200;
  margin-top: 1.5rem;
  animation: bossBarGrow 0.5s ease 0.3s both;
  transform-origin: center;
}
@keyframes bossSlam {
  from { opacity:0; transform: scale(2.5); }
  to   { opacity:1; transform: scale(1.0); }
}
@keyframes bossFade {
  from { opacity:0; transform: translateY(10px); }
  to   { opacity:1; transform: translateY(0); }
}
@keyframes bossBarGrow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
```

## Boss Health Bar (Persistent)

```js
function animateBossHPBar() {
  const bar = document.getElementById('boss-hp-fill');
  bar.style.transition = 'none';
  bar.style.width = '0%';
  // Force reflow then animate to full
  bar.getBoundingClientRect();
  bar.style.transition = 'width 0.8s cubic-bezier(0.2, 1, 0.3, 1)';
  bar.style.width = '100%';
}

function updateBossHP(current, max) {
  const pct = (current / max) * 100;
  document.getElementById('boss-hp-fill').style.width = `${pct}%`;
  // Colour shifts: green → yellow → red
  const hue = Math.round(pct * 1.2); // 120 = green, 0 = red
  document.getElementById('boss-hp-fill').style.background =
    `hsl(${hue}, 90%, 50%)`;
}
```

## Phase Transition (e.g. 50% HP)

```js
async function playBossPhaseTransition(overlay, gameLoop, audio) {
  // Dramatic pause
  gameLoop.timeScale = 0.08;
  overlay.flashWhite(100);
  cameraShake.add(1.0);
  audio.play('boss_phase_roar');
  await sleep(800);
  gameLoop.timeScale = 1.0;

  // New phase aura colour flash on boss
  boss.mesh.material.emissive.setHex(0xff6600);
  boss.mesh.material.emissiveIntensity = 3.0;
  setTimeout(() => { boss.mesh.material.emissiveIntensity = 0.4; }, 400);

  // Phase label
  showPhaseLabel('PHASE 2');
}
```

## Integration Points
- Call `playBossIntro()` from `BossController.js` on boss spawn
- Call `playBossPhaseTransition()` from `BossController.js` on phase HP threshold
- `updateBossHP()` called every frame from `BossController.update()`
- `animateBossHPBar()` only called once during intro
- Requires `screen-transitions.md` overlay and `GameLoop.timeScale` from that skill
