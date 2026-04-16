# PROJECTILES — Projectile System Spec

*Last updated April 16, 2026*

---

## Overview

Projectiles are billboard quads in the Three.js scene — 2D sprites on a flat plane, always facing the camera. They move on the X/Y plane only. Z is fixed at the emitter's depth layer. Collision is AABB on X/Y. All projectiles are pooled — no runtime allocation after init.

---

## Projectile Types

| Type | Movement | Pierce | Homing | Used By |
|---|---|---|---|---|
| **Straight** | Linear X or Y | No | No | Ranged grunt, Vesol crystal bolt |
| **Arc** | Parabolic Y offset | No | No | Bruiser rock throw |
| **Homing** | Steers toward target | No | Soft | Sereisa lightning bolt (Phase 2+) |
| **Piercing** | Linear, passes through | Yes | No | Dabik shadow needle (Advanced spell) |
| **AoE Burst** | No movement — explodes on spawn | Splash | No | Boss Phase 3 |

---

## Spawn Rules

- Projectile spawns at the **sprite anchor point** (centre-top for ranged, centre for casters) — not at the mesh origin.
- Spawn offset defined per entity in their stat block: `projectileOffset: { x, y }`.
- Direction: normalised vector from emitter to target position at time of fire.
- Hunter projectiles spawn on **layer 1** (in front of environment, behind HUD).
- Enemy projectiles spawn on **layer 1** as well — differentiated by team flag, not layer.

---

## Collision

- AABB check on X/Y only. Z ignored.
- Hitbox size defined per projectile type (see table below).
- Check runs every frame against all valid targets in opposite team.
- On hit: apply damage + status, play hit SFX + particle burst, return to pool.
- On miss (off-screen or max range): return to pool silently.

| Type | Hitbox W | Hitbox H |
|---|---|---|
| Straight | 16px | 16px |
| Arc | 24px | 24px |
| Homing | 20px | 20px |
| Piercing | 12px | 48px |
| AoE Burst | 160px | 160px |

---

## Object Pooling

- Pool initialised at scene load: **60 projectile slots** total.
- Split: 30 enemy, 20 hunter, 10 reserved for boss AoE.
- If pool is exhausted, oldest active projectile in that team's pool is forcibly recycled.
- Each slot is a pre-allocated `THREE.Mesh` with a `PlaneGeometry` — texture swapped on activate.
- Pool manager lives in `ProjectilePool.js` — accessed as singleton.

```js
// Activate from pool
const p = ProjectilePool.get('enemy');
p.activate({ origin, direction, speed, damage, type, emitter });

// Return to pool on hit or expire
p.deactivate();
```

---

## Per-Projectile Config

| Property | Type | Description |
|---|---|---|
| `type` | string | straight / arc / homing / piercing / aoe |
| `speed` | number | World units per second |
| `damage` | number | Base damage on hit |
| `statusEffect` | string\|null | Status to apply on hit |
| `statusChance` | 0–1 | Probability of applying status |
| `maxRange` | number | Auto-expire distance in world units |
| `piercing` | boolean | Pass through targets |
| `homingStrength` | 0–1 | Steering force per frame (0 = no homing) |
| `team` | 'hunter'\|'enemy' | Determines valid collision targets |

---

## Hunter Projectiles

### Vesol — Crystal Bolt (Minor Spell)
- Type: Straight
- Speed: 600 u/s
- Damage: 35
- Status: Burn (40% chance)
- Max range: 800px
- Visual: orange-red crystal shard, additive glow

### Sereisa — Storm Needle (Minor Spell)
- Type: Straight
- Speed: 900 u/s
- Damage: 20
- Status: Slow (30% chance)
- Max range: 700px
- Visual: thin electric blue lance

### Sereisa — Lightning Bolt (Advanced Spell, L3+)
- Type: Homing
- Speed: 500 u/s
- Damage: 55
- Status: Slow (60% chance)
- Homing strength: 0.4
- Max range: 1000px
- Visual: arcing white-blue bolt with trail

### Dabik — Shadow Needle (Advanced Spell, L3+)
- Type: Piercing
- Speed: 800 u/s
- Damage: 28 per target
- Status: Bleed (50% chance)
- Max range: 900px
- Visual: dark violet thin spike

---

## Enemy Projectiles

### Ranged Grunt
- Type: Straight
- Speed: 400 u/s
- Damage: 12
- Status: None
- Max range: 600px
- Visual: green energy orb

### Bruiser — Rock Throw
- Type: Arc
- Speed: 350 u/s
- Damage: 30
- Status: None (knockback on hit)
- Max range: 500px
- Visual: grey rock chunk, no glow

### Boss AoE Burst (Phase 3)
- Type: AoE Burst
- Damage: 45
- Status: Boss-specific (see BOSSES.md)
- Radius: 160px
- Visual: ground shockwave ring, boss-element colour

---

## Visual Standards

- All projectiles use `THREE.Sprite` or billboard `PlaneGeometry` — never 3D meshes.
- Magic projectiles use `AdditiveBlending` for glow effect.
- Physical projectiles (rocks, arrows) use `NormalBlending`.
- Each projectile type has a single sprite sheet (1–4 frames, looped).
- Trail effect: thin opacity-faded quad drawn 1 frame behind at 40% alpha.

---

## Implementation Notes

- `ProjectileSystem.update(delta)` called each frame — moves all active projectiles, runs collision checks.
- Projectile movement: `position.x += direction.x * speed * delta`.
- Arc: add `position.y += Math.sin(t * Math.PI) * arcHeight * delta` where `t` is 0→1 over lifetime.
- Homing: lerp direction toward `(target.position - projectile.position).normalize()` by `homingStrength` each frame.
- No projectile should ever navigate in Z.
