# HUNTIX — Hitbox System

> A hit only counts if the geometry says so.

*Last updated April 15, 2026*

---

## Overview

Huntix uses a simple box/sphere overlap system built on top of Three.js. There is no physics engine — all collision is manual overlap detection run once per frame in the combat resolution step of the game loop.

Three box types exist:

| Box type | Owner | Purpose |
|----------|-------|---------|
| **Hurtbox** | Hunter, Enemy | The region that can receive damage. Always active unless immune. |
| **Hitbox** | Attack actions | The region that deals damage. Active only during attack active frames. |
| **Pushbox** | Hunter, Enemy | Used for physical separation — prevents overlap between characters. Not used for damage. |

---

## Coordinate System

All hitbox values are in **world units**, centred on the character's root position (feet, ground level).

- X = horizontal (left/right)
- Y = vertical (up)
- Z = depth (into screen — limited range in 2.5D)

---

## Hurtbox Definitions

### Hunter Hurtbox

All hunters share the same hurtbox geometry — the hitbox is defined relative to root position.

| State | Width (X) | Height (Y) | Depth (Z) | Offset Y |
|-------|-----------|------------|-----------|----------|
| IDLE / RUN | 0.6 | 1.6 | 0.5 | +0.8 (centred at mid-body) |
| CROUCH (not in MVP) | — | — | — | — |
| DODGE (i-frames) | **Immune** — hurtbox deactivated | | | |
| DOWNED | 0.8 | 0.6 | 0.5 | +0.3 (low profile) |
| ULTIMATE | **Immune** — hurtbox deactivated | | | |

### Enemy Hurtbox

Each enemy type has its own hurtbox proportional to its model size.

| Enemy | Width (X) | Height (Y) | Depth (Z) | Notes |
|-------|-----------|------------|-----------|-------|
| Grunt | 0.7 | 1.6 | 0.5 | Standard humanoid |
| Ranged Unit | 0.6 | 1.7 | 0.5 | Slightly taller |
| Bruiser | 1.2 | 2.0 | 0.7 | Large — easy to hit |
| Boss | 1.8 | 2.8 | 0.8 | Per-boss exact values in BOSSES.md |

---

## Hitbox Definitions

Hitboxes are spawned at the start of an attack's active frames and destroyed at the end. They exist for the active frame duration only.

### Hunter Hitboxes

#### Light Attacks

| Hunter | Hit | Width (X) | Height (Y) | Depth (Z) | Offset X | Offset Y | Active frames |
|--------|-----|-----------|------------|-----------|----------|----------|---------------|
| Dabik | Hit 1–4 | 0.8 | 0.9 | 0.5 | +0.5 (forward) | +0.9 | 2f (33ms) |
| Benzu | Hit 1 | 1.2 | 1.0 | 0.6 | +0.6 | +0.8 | 3f (50ms) |
| Benzu | Hit 2 | 1.4 | 1.2 | 0.7 | +0.7 | +0.8 | 3f (50ms) |
| Sereisa | Hit 1–3 | 0.9 | 0.9 | 0.5 | +0.5 | +0.9 | 2f (33ms) |
| Vesol (melee) | Hit 1–3 | 0.8 | 0.8 | 0.5 | +0.5 | +0.8 | 2f (33ms) |
| Vesol (ranged) | Projectile | 0.2 | 0.2 | 0.2 | Travels forward | +0.9 | Until impact |

#### Heavy Attacks

| Hunter | Width (X) | Height (Y) | Depth (Z) | Offset X | Offset Y | Active frames |
|--------|-----------|------------|-----------|----------|----------|---------------|
| Dabik | 1.0 | 1.6 | 0.6 | +0.6 | +0.8 | 3f (50ms) |
| Benzu | 1.6 | 1.8 | 0.8 | +0.8 | +0.9 | 3f (50ms) |
| Sereisa | 1.2 | 1.6 | 0.6 | +0.6 | +0.9 | 3f (50ms) |
| Vesol | 1.0 | 1.4 | 0.6 | +0.6 | +0.8 | 3f (50ms) |

#### Spells

Spell hitboxes are defined in SPELLS.md. They follow the same format — width/height/depth/offset/active frames — but vary significantly per spell. Key principle: spells have **larger hitboxes and longer active frames** than melee attacks.

---

## Overlap Detection

Run once per frame in combat resolution (GAMELOOP.md step 6).

```js
function checkOverlap(boxA, boxB) {
  // AABB overlap test
  return (
    Math.abs(boxA.x - boxB.x) < (boxA.halfW + boxB.halfW) &&
    Math.abs(boxA.y - boxB.y) < (boxA.halfH + boxB.halfH) &&
    Math.abs(boxA.z - boxB.z) < (boxA.halfD + boxB.halfD)
  )
}
```

### Overlap Check Pairs

| Hitbox source | Check against | Result on hit |
|---------------|--------------|---------------|
| Player attack hitbox | Enemy hurtboxes | Damage + status + combo |
| Enemy attack hitbox | Player hurtboxes | Damage + debuff + hitstun |
| AoE hitbox (spell, boss) | All hurtboxes in radius | Damage per target |
| Projectile hitbox | First hurtbox intersected | Damage + destroy projectile |

---

## Hit Registration Rules

| Rule | Detail |
|------|--------|
| One hit per active window | A single attack hitbox can only hit the same target **once** per active window. No repeated damage from the same swing. |
| Multi-target | A single hitbox CAN hit multiple different targets in the same frame. AoE and wide swings hit all overlapping enemies. |
| Hurtbox priority | If a hunter is in DODGE (i-frames) or ULTIMATE, their hurtbox is deactivated — overlap tests skip them entirely. |
| Projectile destruction | Projectiles are destroyed on first hurtbox contact. Do not pierce in MVP. |
| Friendly fire | OFF in MVP. Player hitboxes do not check against player hurtboxes. |
| Z-depth tolerance | The Z axis is shallow (0.5–0.8 units) — this keeps the 2.5D illusion while ensuring attacks land visually correctly. |

---

## Pushbox (Separation)

Pushboxes prevent characters from walking through each other. They are separate from hitboxes and hurtboxes.

| Character | Pushbox width | Pushbox depth |
|-----------|--------------|---------------|
| Hunter | 0.5 | 0.4 |
| Grunt | 0.5 | 0.4 |
| Bruiser | 0.9 | 0.6 |
| Boss | Not pushed by players — boss is immovable |

### Pushbox Resolution

```js
// Run after movement, before combat resolution
function resolvePushboxes(entityA, entityB) {
  const overlap = getPushboxOverlap(entityA, entityB)
  if (overlap > 0) {
    // Push both apart equally along X axis
    entityA.x -= overlap * 0.5
    entityB.x += overlap * 0.5
  }
}
```

> Pushboxes only resolve on the **X axis**. Y (vertical) and Z (depth) overlaps are ignored for pushbox purposes — vertical overlap is handled by gravity/ground collision, Z overlap is cosmetic in 2.5D.

---

## Hitbox Visualisation (Debug Mode)

In debug mode (`?debug=1` URL param):

- **Red wireframe** = active hitbox (attack)
- **Green wireframe** = hurtbox (damageable region)
- **Blue wireframe** = pushbox
- **Yellow wireframe** = hurtbox immune (i-frames / armour)

```js
if (DEBUG_MODE) {
  renderHitboxWireframes()
}
```

---

## Related Docs

| System | Doc |
|--------|-----|
| Active frame timing per attack | [ATTACKSYSTEM.md](./ATTACKSYSTEM.md) |
| Spell hitbox values | [SPELLS.md](./SPELLS.md) |
| Enemy hurtbox responses | [ENEMIES.md](./ENEMIES.md) |
| Collision layer rules | [COLLISIONLAYERS.md](./COLLISIONLAYERS.md) |
| Overlap test in game loop | [GAMELOOP.md](./GAMELOOP.md) |
