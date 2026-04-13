---
name: multiplayer-coop
description: 1-4P shared-screen local co-op for Huntix. Covers input routing, shared orthographic camera, AI companion fill, co-op scaling, player colour readability. Use for Phase 3.
---

# Multiplayer Co-op for Huntix

## Player Slots

```js
const players = [
  { id:0, type:'human', inputDevice:'keyboard',  hunter:'dabik' },
  { id:1, type:'human', inputDevice:'gamepad0',  hunter:'benzu' },
  { id:2, type:'ai',    inputDevice:null,         hunter:'sereisa' },
  { id:3, type:'ai',    inputDevice:null,         hunter:'vesol' },
];
```

## Keyboard Maps (P1 + P2)

```js
const KEYBOARD_MAPS = [
  { move_up:'w', move_down:'s', move_left:'a', move_right:'d', attack_light:'z', attack_heavy:'x', dodge:'c', special:'v' },
  { move_up:'ArrowUp', move_down:'ArrowDown', move_left:'ArrowLeft', move_right:'ArrowRight', attack_light:'Numpad1', attack_heavy:'Numpad2', dodge:'Numpad3', special:'Numpad4' },
];
```

## Shared Camera (Frames All Living Players)

```js
function updateSharedCamera(camera, players, padding = 4) {
  const living = players.filter(p => p.state !== 'DEAD');
  if (!living.length) return;
  const xs = living.map(p => p.position.x);
  const zs = living.map(p => p.position.z);
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const spread = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
  camera.position.x += (centerX - camera.position.x) * 0.08;
  const targetHalf = Math.max(10, spread / 2 + padding);
  camera.top += (targetHalf - camera.top) * 0.08;
  camera.bottom = -camera.top;
  camera.left = camera.bottom * (window.innerWidth / window.innerHeight);
  camera.right = -camera.left;
  camera.updateProjectionMatrix();
}
```

## AI Companion Fill

Human-ish timing variance, targets nearest enemy, attacks when in range:

```js
if (dist > 3) { /* chase */ } 
else if (cooldown <= 0) { hunter.triggerAttack('light'); cooldown = 0.6 + Math.random() * 0.4; }
```

## Status Synergies

| Combo | Effect |
|---|---|
| Bleed (Dabik) + Slow (Sereisa) | Setup → punish window |
| Stun (Benzu) + wall | Trapped enemy |
| Burn (Vesol) + Slam (Benzu) | AoE damage burst |
