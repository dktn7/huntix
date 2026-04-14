---
name: level-clear-celebration
description: Post-wave and post-boss score screen, XP bar fill animation, loot spray, hunter victory pose. The punctuation after every fight. Use Phase 4+.
---

# Level Clear & Celebration for Huntix

## Wave Clear

```js
async function onWaveClear(overlay, audio, hunters) {
  // 1. Brief hitstop
  hitstop.trigger(200);

  // 2. Audio sting
  audio.play('wave_clear_sting');

  // 3. Screen flash white
  overlay.flashWhite(80);

  // 4. All hunters do victory idle (raise weapon)
  hunters.forEach(h => h.setState('VICTORY'));

  // 5. Show wave clear banner
  showWaveBanner();

  // 6. Spray loot after 400ms
  setTimeout(() => sprayLoot(), 400);
}
```

## Boss Clear — Full Fanfare

```js
async function onBossClear(overlay, gameLoop, audio, hunters) {
  // 1. Dramatic slow-mo
  gameLoop.timeScale = 0.05;
  overlay.flashWhite(150);
  cameraShake.add(0.9);
  audio.play('boss_defeated_sting');

  await sleep(1200);
  gameLoop.timeScale = 1.0;

  // 2. Boss death explosion particles
  spawnBossDeathExplosion();

  // 3. Victory fanfare
  await sleep(600);
  audio.play('victory_fanfare');

  // 4. Show results screen
  showResultsScreen();
}
```

## Results Screen

```js
function showResultsScreen(stats) {
  // stats: { kills, damage, bestCombo, timeSec, xpEarned }
  const screen = document.getElementById('results-screen');
  screen.style.display = 'flex';

  // Animate each stat counting up
  animateCount('stat-kills',    0, stats.kills,     800);
  animateCount('stat-damage',   0, stats.damage,    1000);
  animateCount('stat-combo',    0, stats.bestCombo, 600);
  animateCount('stat-xp',       0, stats.xpEarned,  1200);

  // XP bar fill animation after stats
  setTimeout(() => animateXPBar(stats.xpEarned), 1400);
}

function animateCount(elId, from, to, durationMs) {
  const el = document.getElementById(elId);
  const start = performance.now();
  function tick() {
    const t = Math.min((performance.now() - start) / durationMs, 1);
    const ease = 1 - Math.pow(1 - t, 3); // ease out cubic
    el.textContent = Math.round(from + (to - from) * ease);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
```

## XP Bar Fill Animation

```js
function animateXPBar(xpEarned) {
  const bar = document.getElementById('xp-bar-fill');
  const currentXP = playerData.xp;
  const targetXP  = currentXP + xpEarned;
  const maxXP     = getXPForNextLevel(playerData.level);

  let xp = currentXP;
  const step = (xpEarned / 60) * 2; // fill over ~0.5s at 60fps

  const interval = setInterval(() => {
    xp = Math.min(xp + step, targetXP);
    bar.style.width = `${(xp / maxXP) * 100}%`;

    if (xp >= maxXP) {
      clearInterval(interval);
      onLevelUp(); // trigger level-up flash
    } else if (xp >= targetXP) {
      clearInterval(interval);
    }
  }, 1000 / 60);
}

function onLevelUp() {
  // Flash bar gold, play sting, show level number
  document.getElementById('xp-bar-fill').style.background = '#ffdd00';
  audio.play('level_up_sting');
  document.getElementById('level-up-splash').style.display = 'block';
  setTimeout(() => {
    document.getElementById('level-up-splash').style.display = 'none';
  }, 2000);
}
```

## Loot Spray

```js
function sprayLoot(origin, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const geo = new THREE.SphereGeometry(0.15);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
    const coin = new THREE.Mesh(geo, mat);
    coin.position.copy(origin);
    scene.add(coin);

    const vx = Math.cos(angle) * 4;
    const vy = 6 + Math.random() * 3;
    let vy_ = vy, t = 0;

    const ticker = setInterval(() => {
      t += 1/60;
      coin.position.x += vx * (1/60);
      vy_ -= 12 * (1/60);
      coin.position.y += vy_ * (1/60);
      coin.rotation.y += 0.2;
      if (t > 1.5) { scene.remove(coin); clearInterval(ticker); }
    }, 1000/60);
  }
}
```

## Integration Points
- `onWaveClear()`: call from `EnemySpawner.js` when wave count hits 0
- `onBossClear()`: call from `BossController.js` on boss HP = 0 confirmed
- `showResultsScreen()`: pass stats accumulated during the zone run
- `animateXPBar()`: integrates with `LevelingSystem.js` (Phase 5)
