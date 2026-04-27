# STATUSEFFECTS — Status Effect Implementation Spec

*Last updated April 16, 2026*

---

## Overview

Four core status effects drive Huntix's combat identity: Bleed, Burn, Slow, Stun. Each is tied to one hunter's kit but can be applied by spells and items. Effects are managed by a `StatusManager` that ticks independently of the attack system.

---

## Effect Summary

| Effect | Applied By | Tick Damage | Duration | Stack Cap | Immunity |
|---|---|---|---|---|---|
| **Bleed** 🩸 | Dabik | 8/sec | 4s | 3 stacks | KIBAD |
| **Burn** 🔥 | Vesol | 12/sec | 3s | 2 stacks | VRAEL |
| **Slow** 🌀 | Sereisa | None | 3s | 1 stack | THYXIS |
| **Stun** ? | Benzu | None | 1.2s | 1 stack | ZARTH |

---

## Bleed 🩸

- **Tick rate:** Every 0.5s
- **Damage per tick:** 8 (scales with Dabik's damage multiplier)
- **Duration:** 4 seconds per application
- **Stack behaviour:** Additive — each application adds a new 4s timer. Max 3 simultaneous stacks. Each stack ticks independently.
- **Refresh:** New application resets that stack's timer to 4s
- **Visual:** Red drip particles from sprite, red number floaters
- **Sprite flash:** Subtle red tint pulse every 0.5s tick
- **Boss immunity:** KIBAD immune — no application, no visual

## Burn 🔥

- **Tick rate:** Every 0.4s
- **Damage per tick:** 12 (scales with Vesol's damage multiplier)
- **Duration:** 3 seconds per application
- **Stack behaviour:** Refresh — new application resets timer, does not add a second stack. Max 2 stacks (second stack from separate source only).
- **Visual:** Orange flame particle emitter at sprite base, orange number floaters
- **Sprite flash:** Orange tint held for full duration
- **Boss immunity:** VRAEL immune

## Slow 🌀

- **Effect:** Reduces target movement speed by 40% and attack speed by 30%
- **Duration:** 3 seconds
- **Stack behaviour:** Refresh only — no stacking. Reapplication resets timer.
- **Visual:** Blue swirl particles orbiting sprite, sprite tinted cool blue
- **Sprite flash:** Constant blue tint during duration
- **Boss immunity:** THYXIS immune
- **Implementation:** Multiply `entity.speed` by 0.6 on apply, restore on expire

## Stun ⚡

- **Effect:** Target cannot move or attack. Interrupted if taking damage > 15 in one hit.
- **Duration:** 1.2 seconds
- **Stack behaviour:** No stacking. Second application during active stun is ignored.
- **Cooldown:** Same target cannot be stunned again for 3s after stun expires (stun immunity window)
- **Visual:** Yellow lightning sparks circling sprite head, "ZAP" text flash
- **Sprite flash:** Bright yellow full-sprite flash on application
- **Boss immunity:** ZARTH immune
- **Implementation:** Set `entity.state = STUNNED`, block all state transitions until timer expires

---

## Co-op Synergy Triggers

Synergies fire automatically when conditions are met. The `StatusManager` checks for synergy pairs each tick.

| Synergy | Condition | Effect | Hunters |
|---|---|---|---|
| **Bleeding Slow** | Bleed + Slow active simultaneously | Bleed ticks deal +60% damage | Dabik + Sereisa |
| **Cage** | Stun + any wall/AoE active | Stunned enemy takes +40% damage from all sources | Benzu + Vesol |
| **Backstab Window** | Slow + Dabik within 80px behind target | Dabik's next hit is a guaranteed crit (+100% damage) | Sereisa + Dabik |
| **Scorch Slam** | Burn + Benzu heavy attack | Heavy hit deals +50% damage and extends Burn by 1s | Vesol + Benzu |

Synergy visual: brief white flash on affected enemy + synergy label text popup.

---

## StatusManager Implementation

```js
// StatusManager ticks all active effects
StatusManager.update(delta) {
  for (const entity of activeEntities) {
    for (const effect of entity.statusEffects) {
      effect.timer -= delta;
      if (effect.tickTimer <= 0 && effect.tickDamage > 0) {
        entity.takeDamage(effect.tickDamage);
        effect.tickTimer = effect.tickRate;
      }
      if (effect.timer <= 0) entity.removeEffect(effect);
    }
    StatusManager.checkSynergies(entity);
  }
}
```

- `StatusManager.apply(entity, effectType, source)` — checks immunity, stacks or refreshes
- `StatusManager.remove(entity, effectType)` — clears effect, restores stats, removes visuals
- `StatusManager.checkSynergies(entity)` — runs synergy pair checks each tick
- Called from `GameLoop.update()` after combat, before rendering

---

## Item & Spell Interactions

- **Resonance Stone** (shop item): All synergy bonus damage +20%
- **Shadow Amp** (shop item): Bleed tick damage +25%
- **Dabik Advanced Spell (Shadow Needle):** 50% chance to apply Bleed on projectile hit
- **Vesol Minor Spell (Crystal Bolt):** 40% chance to apply Burn on hit
- **Sereisa Storm Needle:** 30% chance to apply Slow on hit
- **Benzu Heavy Attack:** 25% base chance to apply Stun (increases with Thunder upgrades)

