# HUNTIX — Wave Manager

> Waves are the heartbeat of each zone. This is what drives them.

*Last updated April 15, 2026*

---

## Overview

The Wave Manager runs inside each zone scene. It controls:

- Enemy spawn timing and positions
- Wave completion detection
- Transition between waves (and into miniboss / boss portal)
- Co-op enemy count scaling
- Zone flow from wave 1 through to boss portal unlock

It is a state machine that runs in the game loop's wave manager tick (GAMELOOP.md step 8).

---

## Wave Manager State Machine

```
IDLE
  │ (zone entry)
  ▼
WAVE_INTRO          ← brief banner: "Wave 1"
  │ (1.0s delay)
  ▼
WAVE_ACTIVE         ← enemies alive, spawning on schedule
  │ (all enemies dead)
  ▼
WAVE_CLEAR          ← "Wave Complete" banner (1.5s)
  │
  ├── if waves remain → WAVE_INTRO (next wave)
  │
  ├── if all waves done AND miniboss zone → MINIBOSS_ENTRY
  │     │ (miniboss defeated)
  │     ▼
  │   MINIBOSS_DEAD → PORTAL_UNLOCK
  │
  └── if all waves done AND no miniboss → PORTAL_UNLOCK
        │
        ▼
      PORTAL_UNLOCK  ← boss portal activates, players return to hub
```

---

## Wave Completion Condition

A wave is complete when:
```js
aliveEnemies.length === 0 && spawnQueue.length === 0
```

Both conditions must be true — the last enemy must be dead AND all scheduled spawns for this wave must have fired. This prevents the wave clearing while stragglers are still spawning.

---

## Spawn System

### Spawn Points

Each zone has defined spawn points. Enemies spawn from off-screen edges or predefined positions at the zone boundary. Spawn points are tagged by side: `left`, `right`, `back`.

```js
// Zone spawn point format
spawnPoints = [
  { id: 'left-1',  x: -8.0, y: 0, z: 0,    side: 'left'  },
  { id: 'left-2',  x: -8.0, y: 0, z: 0.8,  side: 'left'  },
  { id: 'right-1', x:  8.0, y: 0, z: 0,    side: 'right' },
  { id: 'right-2', x:  8.0, y: 0, z: 0.8,  side: 'right' },
  { id: 'back-1',  x:  0,   y: 0, z: -4.0, side: 'back'  },
]
```

### Spawn Queue

Each wave has a spawn queue — a list of `{ enemyType, spawnPointId, delay }` entries.

```js
// Wave definition format
wave = {
  waveNumber: 1,
  spawns: [
    { enemyType: 'grunt',   spawnPoint: 'left-1',  delay: 0.0 },
    { enemyType: 'grunt',   spawnPoint: 'right-1', delay: 0.0 },
    { enemyType: 'grunt',   spawnPoint: 'left-2',  delay: 2.0 },
    { enemyType: 'ranged',  spawnPoint: 'back-1',  delay: 4.0 },
  ]
}
```

`delay` is seconds after wave start. The wave manager ticks the elapsed time and fires each spawn when `elapsed >= delay`.

---

## Zone Wave Compositions

### Zone 1 — City Breach

| Wave | Enemies | Spawn timing |
|------|---------|-------------|
| Wave 1 | 4× Grunt | All at 0s |
| Wave 2 | 3× Grunt + 2× Ranged | Grunts at 0s, Ranged at 3s |
| Wave 3 | 4× Grunt + 2× Ranged + 1× Bruiser | Grunts 0s, Ranged 2s, Bruiser 5s |
| Miniboss | The Stampede | After Wave 3 clear |

### Zone 2 — Ruin Den

| Wave | Enemies | Spawn timing |
|------|---------|-------------|
| Wave 1 | 3× Grunt + 1× Bruiser | Grunts 0s, Bruiser 3s |
| Wave 2 | 4× Grunt + 2× Ranged | All at 0s |
| Wave 3 | 2× Bruiser + 3× Ranged | Bruisers 0s, Ranged 2s |
| Miniboss | The Tomb Crawler | After Wave 3 clear |

### Zone 3 — Shadow Core

| Wave | Enemies | Spawn timing |
|------|---------|-------------|
| Wave 1 | 4× Grunt + 1× Ranged | All at 0s |
| Wave 2 | 2× Bruiser + 2× Ranged | Bruisers 0s, Ranged 1s |
| Wave 3 | 3× Bruiser + 3× Ranged (hard) | Staggered 0s, 2s, 4s |

### Zone 4 — Thunder Spire

| Wave | Enemies | Spawn timing |
|------|---------|-------------|
| Wave 1 | 4× Grunt + 2× Ranged | All at 0s |
| Wave 2 | 3× Bruiser + 2× Ranged | Bruisers 0s, Ranged 2s |
| Wave 3 | 4× Bruiser + 2× Ranged (elite variants) | Staggered every 2s |

---

## Co-op Enemy Scaling

Enemy count scales with human player count. AI companions do NOT trigger scaling.

| Human players | Enemy count multiplier | Notes |
|--------------|----------------------|-------|
| 1 | 1.0× (base) | |
| 2 | 1.3× | Round up |
| 3 | 1.6× | Round up |
| 4 | 2.0× | |

```js
function scaleSpawnQueue(baseQueue, humanPlayerCount) {
  const multiplier = [1.0, 1.0, 1.3, 1.6, 2.0][humanPlayerCount]
  return baseQueue.map(spawn => ({
    ...spawn,
    count: Math.ceil((spawn.count || 1) * multiplier)
  }))
}
```

Scaling adds **additional spawns of the same type** at staggered delays (+1.5s per extra). It does not increase individual enemy HP — that is handled by BOSSES.md co-op HP scaling separately.

---

## Wave Banner

Shown at the start of each wave and on wave clear.

| Event | Banner text | Duration |
|-------|------------|----------|
| Wave start | "Wave [N]" | 1.0s |
| Wave clear | "Wave Complete" | 1.5s |
| Miniboss entry | (replaced by miniboss name card) | 2.0s |
| Portal unlock | "Zone Clear — Return to Hub" | 2.5s |

Banners are CSS overlays — not Three.js objects. They do not block gameplay (players can still move during the 1.0s wave start banner).

---

## No-Damage Wave Bonus

Tracked per wave per player.

```js
// Checked at wave clear
if (player.damageTakenThisWave === 0) {
  player.essence += 50
  showBonusText('+50 Essence — No Damage')
}
player.damageTakenThisWave = 0  // Reset for next wave
```

> `damageTakenThisWave` is a wave-local counter — not in RunState. It resets each wave and is discarded at zone exit.

---

## Enemy Alive Tracking

```js
class WaveManager {
  constructor() {
    this.aliveEnemies = []     // Array of active enemy instances
    this.spawnQueue   = []     // Remaining spawns for current wave
    this.elapsed      = 0      // Time since wave start
    this.state        = 'IDLE'
    this.currentWave  = 0
  }

  onEnemyDeath(enemy) {
    this.aliveEnemies = this.aliveEnemies.filter(e => e !== enemy)
    this.checkWaveComplete()
  }

  checkWaveComplete() {
    if (this.aliveEnemies.length === 0 && this.spawnQueue.length === 0) {
      this.setState('WAVE_CLEAR')
    }
  }

  tick(dt) {
    if (this.state !== 'WAVE_ACTIVE') return
    this.elapsed += dt
    // Fire spawns whose delay has elapsed
    this.spawnQueue = this.spawnQueue.filter(spawn => {
      if (this.elapsed >= spawn.delay) {
        spawnEnemy(spawn.enemyType, spawn.spawnPoint)
        this.aliveEnemies.push(lastSpawned)
        return false  // remove from queue
      }
      return true
    })
  }
}
```

---

## Related Docs

| System | Doc |
|--------|-----|
| Enemy types and stats | [ENEMIES.md](./ENEMIES.md) |
| Miniboss entry sequence | [MINIBOSS.md](./MINIBOSS.md) |
| Zone layouts and spawn point maps | [ZONES.md](./ZONES.md) |
| No-damage bonus Essence value | [RUNSTATE.md](./RUNSTATE.md) |
| Game loop step 8 | [GAMELOOP.md](./GAMELOOP.md) |
