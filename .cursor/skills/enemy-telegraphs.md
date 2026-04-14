---
name: enemy-telegraphs
description: Attack wind-up flash, threat colour coding, aggro indicator, stagger flash, death dissolve. Readable combat is fair combat.
---

# Enemy Telegraphs (Quick Ref)

## Attack Wind-Up
```js
// Before ATTACK state — 0.4s pulse red/orange
enemy.mesh.material.emissive.setHex(0xff4400);
enemy.telegraphTimer = 0.4;
// Each frame: emissiveIntensity = 0.5 + 0.5*Math.sin(timer*Math.PI*8)*1.5
// On timer <= 0: emissiveIntensity=0, state='ATTACK'
```

## Stagger Flash (White)
```js
// On hurt: emissive=0xffffff, intensity=2.0, hurtFlashTimer=0.08
// On timer<=0: reset emissive to black
```

## Death Dissolve
```js
// On death: transparent=true, 0.5s timer
// Each frame: opacity = timer/0.5, scale.y = timer/0.5
// On timer<=0: scene.remove(mesh), return to pool
```

## Threat Colours
| Type | Base | Emissive |
|------|------|----------|
| Grunt | `0x884422` | none |
| Shield | `0x334488` | `0x0022ff` |
| Berserker | `0x882200` | `0xff2200` |
| Miniboss | `0x220044` | `0x9900ff` |

## Integration
- Telegraph: `EnemyAI.js` before ATTACK state
- Stagger flash: `CombatController.js` on hit resolution
- Death dissolve: `EnemyAI.js` on HP <= 0
