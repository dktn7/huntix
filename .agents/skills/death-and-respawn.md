---
name: death-and-respawn
description: Player death ragdoll impulse, ghost fade-in on respawn, invincibility flash, co-op revive mechanic. How a player dies and comes back is a trust signal.
---

# Death & Respawn for Huntix

## Death Sequence

```js
// In PlayerState.js — on transition to DEAD state
function onPlayerDeath(player, overlay, audio) {
  player.state = 'DEAD';
  audio.play('player_death');

  // 1. Ragdoll impulse — spin and fall
  player.deathRotVel = (Math.random() > 0.5 ? 1 : -1) * Math.PI * 4; // rad/s
  player.deathFallVel = -8; // units/s downward
  player.deathTimer = 0.6;

  // 2. Flash black
  overlay.flashBlack(200);

  // Co-op: trigger revive window instead of instant death
  if (coopManager.playerCount > 1) {
    player.state = 'DOWNED';
    player.reviveTimer = 8.0; // 8 seconds for teammate to revive
  }
}

// In PlayerState.update() while DEAD:
if (player.deathTimer > 0) {
  player.deathTimer -= dt;
  player.mesh.rotation.z += player.deathRotVel * dt;
  player.mesh.position.y += player.deathFallVel * dt;
  // Fade out
  player.mesh.material.opacity = Math.max(0, player.deathTimer / 0.6);
}
```

## Downed State (Co-op)

```js
// Downed player: lies on ground, pulsing red, revive timer UI visible
function updateDownedPlayer(player, dt) {
  player.reviveTimer -= dt;

  // Pulse red to signal urgency
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008);
  player.mesh.material.emissive.setHex(0xff0000);
  player.mesh.material.emissiveIntensity = pulse;

  // Update revive bar UI
  const pct = (player.reviveTimer / 8.0) * 100;
  document.getElementById(`revive-bar-p${player.index}`).style.width = `${pct}%`;

  if (player.reviveTimer <= 0) triggerGameOver();
}

// Revive on teammate overlap
function checkRevive(downedPlayer, allPlayers, dt) {
  for (const p of allPlayers) {
    if (p === downedPlayer || p.state === 'DEAD' || p.state === 'DOWNED') continue;
    const dist = p.position.distanceTo(downedPlayer.position);
    if (dist < 1.2) {
      downedPlayer.reviveProgress = (downedPlayer.reviveProgress ?? 0) + dt;
      if (downedPlayer.reviveProgress >= 2.0) respawnPlayer(downedPlayer);
    } else {
      downedPlayer.reviveProgress = 0;
    }
  }
}
```

## Respawn Sequence

```js
function respawnPlayer(player, spawnPos) {
  player.hp = player.maxHp * 0.4; // revive at 40% HP
  player.state = 'IDLE';
  player.mesh.position.copy(spawnPos);
  player.mesh.material.opacity = 0;
  player.mesh.material.transparent = true;

  // Ghost fade-in over 0.8s
  player.respawnFadeTimer = 0.8;

  // Invincibility frames: 2 seconds
  player.iFrames = 2.0;

  // Audio
  audio.play('player_respawn');
}

// In update while respawnFadeTimer > 0:
player.respawnFadeTimer -= dt;
const t = 1 - (player.respawnFadeTimer / 0.8);
player.mesh.material.opacity = t;
// Flicker during i-frames
if (player.iFrames > 0) {
  player.iFrames -= dt;
  player.mesh.visible = Math.sin(Date.now() * 0.03) > 0; // rapid flicker
} else {
  player.mesh.visible = true;
  player.mesh.material.opacity = 1;
  player.mesh.material.transparent = false;
}
```

## Game Over Screen

```js
function triggerGameOver() {
  overlay.fadeOut(600).then(() => {
    document.getElementById('game-over-screen').style.display = 'flex';
  });
}
```

## Integration Points
- `onPlayerDeath()`: call from `PlayerState.js` on HP <= 0
- `updateDownedPlayer()` + `checkRevive()`: call from `CoopManager.js` each frame
- `respawnPlayer()`: call from `CoopManager.js` when revive completes
- i-frame flicker must use mesh.visible toggle, not opacity — faster visually
- Requires `screen-transitions.md` overlay
