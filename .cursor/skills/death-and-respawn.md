---
name: death-and-respawn
description: Player death ragdoll, ghost fade-in respawn, i-frame flicker, co-op revive mechanic.
---

# Death & Respawn (Quick Ref)

## Death
```js
// PlayerState DEAD entry:
player.deathRotVel = (Math.random()>0.5?1:-1) * Math.PI * 4;
player.deathFallVel = -8;
player.deathTimer = 0.6;
player.mesh.material.transparent = true;
// Each frame: rotation.z += deathRotVel*dt; position.y += deathFallVel*dt; opacity = timer/0.6
// Co-op: set state='DOWNED', reviveTimer=8.0 instead of full death
```

## Downed (Co-op)
```js
// Pulse red emissive: intensity = 0.5+0.5*Math.sin(Date.now()*0.008)
// Revive bar: pct = (reviveTimer/8)*100
// Teammate within 1.2 units for 2s → respawnPlayer()
```

## Respawn
```js
player.hp = player.maxHp * 0.4; // revive at 40%
player.iFrames = 2.0;           // 2s invincibility
player.respawnFadeTimer = 0.8;  // ghost fade-in
// i-frame flicker: mesh.visible = Math.sin(Date.now()*0.03) > 0
// On iFrames<=0: visible=true, transparent=false
```

## Integration
- `PlayerState.js` on HP <= 0 → death sequence
- `CoopManager.js` each frame → `updateDownedPlayer()` + `checkRevive()`
- Requires `screen-transitions.md` overlay for flash + fade
