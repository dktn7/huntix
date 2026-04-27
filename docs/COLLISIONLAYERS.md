# HUNTIX — Collision Layers

> Not everything should collide with everything. This is the map.

*Last updated April 15, 2026*

---

## Overview

Collision layers define which objects interact with which. Without this, every object checks against every other object — expensive and wrong. With layers, each check is intentional.

Huntix uses a bitmask layer system. Each object has a `layer` (what it is) and a `mask` (what it collides with).

---

## Layer Definitions

| Layer name | Bit | What it represents |
|------------|-----|--------------------|
| `PLAYER` | 1 | Hunter characters |
| `ENEMY` | 2 | All enemy types and bosses |
| `PLAYER_ATTACK` | 4 | Hitboxes from player attacks and spells |
| `ENEMY_ATTACK` | 8 | Hitboxes from enemy attacks |
| `ENVIRONMENT` | 16 | Arena walls, floor, platforms |
| `PROJECTILE_PLAYER` | 32 | Player-fired projectiles (Vesol ranged, spells) |
| `PROJECTILE_ENEMY` | 64 | Enemy-fired projectiles (Ranged Unit bolts, boss projectiles) |
| `TRIGGER` | 128 | Non-damaging zones — revive range, shop range, portal range |

---

## Collision Mask Table

Each row is an object type. Columns show what it collides with (✓ = yes, — = no).

| Object | PLAYER | ENEMY | PLAYER_ATTACK | ENEMY_ATTACK | ENVIRONMENT | PROJ_PLAYER | PROJ_ENEMY | TRIGGER |
|--------|--------|-------|--------------|-------------|-------------|------------|-----------|--------|
| Hunter (PLAYER) | Pushbox only | — | — | ✓ damage | ✓ blocked | — | ✓ damage | ✓ overlap |
| Enemy (ENEMY) | — | Pushbox only | ✓ damage | — | ✓ blocked | ✓ damage | — | — |
| Player hitbox (PLAYER_ATTACK) | — | ✓ damage | — | — | — | — | — | — |
| Enemy hitbox (ENEMY_ATTACK) | ✓ damage | — | — | — | — | — | — | — |
| Player projectile (PROJ_PLAYER) | — | ✓ damage | — | — | ✓ destroy | — | — | — |
| Enemy projectile (PROJ_ENEMY) | ✓ damage | — | — | — | ✓ destroy | — | — | — |
| Trigger zone (TRIGGER) | ✓ overlap | — | — | — | — | — | — | — |

---

## Key Rules

### Friendly Fire — OFF
Player hitboxes (`PLAYER_ATTACK`) do not check against `PLAYER` layer. Players cannot damage each other. This is a deliberate MVP decision — co-op brawlers with accidental friendly fire feel bad.

### Enemy vs Enemy — Pushbox Only
Enemies do not damage each other. They use pushboxes to avoid stacking, but their hitboxes do not check against `ENEMY` layer. Boss AoE does not hit other enemies.

### Player vs Player — Pushbox Only
Players cannot walk through each other. Pushboxes separate them. No damage.

### Projectile Destruction
Projectiles are destroyed on first collision with either a hurtbox OR environment. They do not pierce in MVP.

### Trigger Zones
Trigger zones (revive proximity, shop range, portal entry) overlap check against `PLAYER` only. They produce no damage — only state flags (e.g. `inReviveRange = true`).

---

## Bitmask Implementation

```js
// Layer constants
const LAYERS = {
  PLAYER:           0b00000001,  // 1
  ENEMY:            0b00000010,  // 2
  PLAYER_ATTACK:    0b00000100,  // 4
  ENEMY_ATTACK:     0b00001000,  // 8
  ENVIRONMENT:      0b00010000,  // 16
  PROJ_PLAYER:      0b00100000,  // 32
  PROJ_ENEMY:       0b01000000,  // 64
  TRIGGER:          0b10000000,  // 128
}

// Mask definitions — what each layer collides with
const MASKS = {
  PLAYER:        LAYERS.ENEMY_ATTACK | LAYERS.PROJ_ENEMY | LAYERS.ENVIRONMENT | LAYERS.TRIGGER,
  ENEMY:         LAYERS.PLAYER_ATTACK | LAYERS.PROJ_PLAYER | LAYERS.ENVIRONMENT,
  PLAYER_ATTACK: LAYERS.ENEMY,
  ENEMY_ATTACK:  LAYERS.PLAYER,
  PROJ_PLAYER:   LAYERS.ENEMY | LAYERS.ENVIRONMENT,
  PROJ_ENEMY:    LAYERS.PLAYER | LAYERS.ENVIRONMENT,
  TRIGGER:       LAYERS.PLAYER,
}

// Collision check guard
function shouldCollide(layerA, layerB) {
  return (MASKS[layerA] & layerB) !== 0
}
```

---

## I-Frame Immunity

I-frames (DODGE, ULTIMATE states) are handled at the **hurtbox level**, not the layer level. The hurtbox is deactivated — it does not exist in the collision check. The layer system does not need to know about immunity; it simply finds no hurtbox to test against.

This is cleaner than a layer toggle — the hurtbox object is removed from the active set while i-frames are running.

```js
// On dodge start:
activeHurtboxes.delete(player.hurtbox)

// On dodge end:
activeHurtboxes.add(player.hurtbox)
```

---

## Environment Collision

Environment collision is separate from the combat hitbox system. It uses a simpler AABB-vs-tile check:

- Floor: Y = 0. Gravity pulls all entities to Y = 0. Jump arcs resolve above it.
- Walls (arena boundary): Hard X limits per zone. Entities cannot move past X_MIN or X_MAX.
- Z bounds: Entities clamped to Z_MIN and Z_MAX (shallow depth lane).

Environment is static — it never moves, so there are no moving platform complications in MVP.

---

## Trigger Zones

| Trigger | Radius | Effect |
|---------|--------|--------|
| Revive range | 2.0 units (sphere) | Sets `inReviveRange[playerIndex] = true` — enables revive input prompt |
| Shop NPC range | 1.5 units | Opens shop UI |
| Portal range | 1.5 units | Shows "Press E to enter" prompt |
| Essence orb pickup | 0.5 units | Auto-collect — player walks into it |

All trigger overlaps are checked in game loop step 4 (player update), not in combat resolution.

---

## Related Docs

| System | Doc |
|--------|-----|
| Hitbox geometry and active frames | [HITBOX.md](./HITBOX.md) |
| I-frame states | [ATTACKSYSTEM.md](./ATTACKSYSTEM.md) |
| Revive trigger range | [DEATH.md](./DEATH.md) |
| Game loop collision step | [GAMELOOP.md](./GAMELOOP.md) |
| Environment bounds per zone | [ZONES.md](./ZONES.md) |
