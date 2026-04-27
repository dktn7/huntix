# HUNTIX — Particle System

> Particles are feedback, not decoration. Every emitter must earn its draw call.

*Last updated April 15, 2026*

---

## Philosophy

- Every particle serves a gameplay purpose — communicating hits, status, power state, or danger
- Global cap of **500 active particles** at all times — enforced hard limit
- Particles are pooled and reused — no runtime allocation after init
- Particles never obscure hitboxes or enemy telegraphs
- Performance budget: particles must not exceed **2ms per frame** on target hardware

---

## Global Caps

| Category | Max active particles |
|----------|---------------------|
| Hit sparks (all players combined) | 120 |
| Hunter aura particles | 80 (20 per hunter) |
| Status effect particles (all enemies) | 80 |
| Spell effect particles | 100 |
| Ultimate effect particles | 80 |
| Ambient / environment | 60 |
| Essence pickup trail | 20 |
| Death burst | 40 |
| **Total hard cap** | **500** |

> If a new emitter would exceed the cap, the oldest low-priority particles are culled first. Priority order (lowest to highest): ambient → aura → status → hit sparks → spell → ultimate.

---

## Pooling System

All particles are pre-allocated at scene load. No `new` calls during gameplay.

```js
ParticlePool = {
  total: 500,
  available: [],     // Inactive particles ready for reuse
  active: [],        // Currently playing particles

  spawn(config) {
    const p = this.available.pop() || this.cullLowest()
    p.reset(config)
    this.active.push(p)
    return p
  },

  update(dt) {
    for (const p of this.active) {
      p.tick(dt)
      if (p.isDead()) this.recycle(p)
    }
  }
}
```

---

## Particle Properties

Each particle has:

| Property | Type | Notes |
|----------|------|-------|
| position | Vec2 | World position |
| velocity | Vec2 | Units per second |
| acceleration | Vec2 | Applied each frame |
| life | Number | Seconds remaining |
| maxLife | Number | Total lifetime |
| size | Number | Radius in pixels |
| sizeDecay | Number | Size reduction per second |
| colour | Hex | Start colour |
| colourEnd | Hex | End colour (lerped over lifetime) |
| opacity | Number | 0.0–1.0 |
| opacityDecay | Number | Opacity reduction per second |
| shape | String | `'circle'` \| `'spark'` \| `'ring'` \| `'square'` |

---

## Hit Spark Events

Fired at the point of contact on every valid hit.

### Light Attack Hit

| Property | Value |
|----------|-------|
| Count | 6 particles |
| Shape | `spark` — elongated in hit direction |
| Colour | White `#ffffff` → grey `#888888` |
| Size | 3px → 0px |
| Lifetime | 0.15s |
| Velocity | 80–120 units/s outward from impact, spread ±30° |
| Gravity | Light downward pull — 0.5 units/s² |

### Heavy Attack Hit

| Property | Value |
|----------|-------|
| Count | 14 particles |
| Shape | `spark` + 2 `ring` |
| Colour | Yellow `#f39c12` → orange `#e67e22` |
| Size | 5px → 0px |
| Lifetime | 0.25s |
| Velocity | 100–160 units/s, wider spread ±60° |
| Gravity | Moderate — 2.0 units/s² |
| Ring | Expands from 0 → 20px radius over 0.2s then fades |

### Spell Hit

| Property | Value |
|----------|-------|
| Count | 10 particles |
| Shape | `circle` + `ring` |
| Colour | Hunter aura colour → white |
| Size | 4px → 0px |
| Lifetime | 0.3s |
| Velocity | 60–90 units/s radial spread |
| Ring | 0 → 30px radius over 0.25s |

### Ultimate Hit (per enemy)

| Property | Value |
|----------|-------|
| Count | 20 particles per enemy |
| Shape | `spark` + `ring` + `square` |
| Colour | Hunter aura colour (blazing) → white → fade |
| Size | 8px → 0px |
| Lifetime | 0.5s |
| Velocity | 150–220 units/s full radial |
| Ring | 0 → 60px over 0.4s |
| Note | Capped at 80 total — 4 enemies × 20 max |

---

## Hunter Aura Particles

Passive ambient particles that float around the hunter at all times. Represent their elemental power state.

### Aura States

| State | Particle count | Behaviour |
|-------|---------------|----------|
| Idle / low level | 4 | Slow drift, tight radius (0.5 units) |
| In combat | 8 | Faster drift, wider radius (0.8 units) |
| Surge 50%+ | 12 | Orbiting motion, radius 1.0 units |
| Surge 100% (ready) | 20 | Fast orbit + upward spray, radius 1.2 units, pulsing |
| Ultimate active | 20 (max) | Full blaze — outward burst pattern, no orbit |

### Per-Hunter Aura Colours

| Hunter | Aura colour | Secondary colour |
|--------|------------|------------------|
| Dabik | `#9b59b6` purple | `#2c3e50` deep shadow |
| Benzu | `#e74c3c` red | `#f39c12` gold |
| Sereisa | `#f1c40f` yellow | `#ffffff` white |
| Vesol | `#3498db` blue (default) → `#e74c3c` crimson (Ultimate) | `#e67e22` orange |

### Aura Particle Properties

| Property | Value |
|----------|-------|
| Shape | `circle` |
| Size | 2–4px, varies by state |
| Lifetime | 0.8–1.2s (looping — respawns immediately) |
| Opacity | 0.4–0.9, fades toward end of life |
| Motion | Orbital drift with slight noise offset per particle |

---

## Status Effect Particles

Shown on enemies with active status stacks. Updates per stack count.

| Status | Colour | Shape | Count per stack | Behaviour |
|--------|--------|-------|----------------|----------|
| Bleed | `#c0392b` dark red | `circle` | 3 | Drip downward, gravity 4.0 units/s² |
| Stun | `#f1c40f` yellow | `spark` | 4 | Orbit enemy head, slow rotation |
| Slow | `#3498db` blue | `circle` | 2 | Float upward slowly, fade out |
| Burn | `#e67e22` orange | `spark` + `circle` | 5 | Rise upward, flicker motion |

> At 3 stacks: particle count doubles (6 / 8 / 4 / 10). Visually distinct at max stack — players can read enemy status state from across the arena.

---

## Spell Effect Particles

### Shadow Step (Dabik Minor)
| Event | Particles | Detail |
|-------|-----------|--------|
| Departure | 8 purple sparks | Burst outward from origin position |
| Arrival | 12 purple sparks + ring | Burst at destination, ring expands 0 → 25px |

### Shadow Clone (Dabik Advanced)
| Event | Particles | Detail |
|-------|-----------|--------|
| Clone spawn | 15 purple + dark particles | Coalesce inward → form clone shape |
| Clone expiry | 10 particles burst outward | Dissolve outward |
| Clone explosion (mod) | 30 particles | Large radial burst, deep purple |

### Shield Bash (Benzu Minor)
| Event | Particles | Detail |
|-------|-----------|--------|
| Impact | 12 red-gold sparks | Burst at impact point, forward-facing arc |
| Quake crack (mod) | 8 grey dust particles | Trail along ground crack |

### Seismic Slam (Benzu Advanced)
| Event | Particles | Detail |
|-------|-----------|--------|
| Jump trail | 6 dust particles | Rise from ground on takeoff |
| Landing impact | 20 particles — dust + sparks + ring | Large burst at landing point |
| Shockwave edge | 8 dust particles at radius edge | Radiate outward along ground |

### Electric Dart (Sereisa Minor)
| Event | Particles | Detail |
|-------|-----------|--------|
| Projectile trail | 4 yellow sparks (continuous) | Trail behind bolt during flight |
| Impact | 10 yellow + white sparks | Burst at hit point |
| Chain arc (mod) | 6 white sparks per jump | Arc between chained enemies |

### Chain Shock (Sereisa Advanced)
| Event | Particles | Detail |
|-------|-----------|--------|
| Origin | 8 yellow sparks | Burst from Sereisa's blade tip |
| Chain jump | 6 white sparks per target | Arc between targets |
| Final target | 12 sparks | Larger burst at last target |

### Flame Bolt (Vesol Minor)
| Event | Particles | Detail |
|-------|-----------|--------|
| Projectile trail | 6 orange particles (continuous) | Fire trail during flight |
| Impact | 12 orange + yellow sparks + ring | Burst at hit point |
| Scattershot (mod) | 4 particles per sub-bolt | Smaller trails on each split bolt |

### Flame Wall (Vesol Advanced)
| Event | Particles | Detail |
|-------|-----------|--------|
| Wall active | 20 particles (continuous, cycling) | Rising flame columns along wall width |
| Wall expiry | 8 particles burst up | Flame extinguish burst |
| Afterburn floor (mod) | 10 low particles (continuous) | Low heat shimmer along floor patch |

---

## Ultimate Particles

### Monarch's Domain (Dabik)
| Phase | Particles | Detail |
|-------|-----------|--------|
| Activation | 30 purple particles | Radial burst from Dabik, full arena spread |
| Invisible state | 8 purple whisps (continuous) | Faint trail showing Dabik's movement path |
| Final strike | 20 particles + large ring | Position reveal burst |

### Titan's Wrath (Benzu)
| Phase | Particles | Detail |
|-------|-----------|--------|
| Wind-up | 15 red-gold particles rising from fists | Build energy upward |
| Ground shatter | 40 dust + rock particles | Radiate outward from slam point across full arena |
| Stun pulse | 10 yellow sparks per enemy | Stun application burst on each enemy |

### Storm Surge (Sereisa)
| Phase | Particles | Detail |
|-------|-----------|--------|
| Activation | 20 white-yellow particles | Crown burst around Sereisa's head |
| Dash state | 8 lightning trail particles (continuous) | Trail per dash, lingers 0.3s |
| Final burst | 25 particles + ring | Position burst at end of 6s window |

### Inferno (Vesol)
| Phase | Particles | Detail |
|-------|-----------|--------|
| Wind-up | 10 blue → crimson particles | Aura colour shift particles rising from body |
| Fire floor | 30 flame particles (continuous, cycling) | Low fire across full arena floor |
| Final burst | 20 orange particles per burning enemy | Extinguish burst on each enemy at end |

---

## Environment Ambient Particles

Passive zone atmosphere. Does not affect gameplay. Lowest culling priority.

| Zone | Particles | Count | Behaviour |
|------|-----------|-------|-----------|
| City Breach | Ember float | 15 | Rise slowly, drift right, fade |
| Ruin Den | Dust motes | 15 | Slow horizontal drift, very low opacity |
| Shadow Core | Shadow wisps | 20 | Drift upward, irregular motion, purple-black |
| Thunder Spire | Storm sparks | 20 | Fast random movement, white-blue, flicker |
| Hub | Rune particle drift | 10 | Slow floor-level drift, faint aura colours |

---

## Essence Pickup Particles

| Event | Particles | Detail |
|-------|-----------|--------|
| Drop spawn | 4 gold sparks | Small burst at drop point |
| Idle float | 2 gold particles (continuous) | Slow orbit around pickup |
| Collected | 8 gold particles | Burst toward collector, then fade |
| Float-up text | Not a particle — DOM element | See HUD.md |

---

## Death Burst

Fired on enemy death.

| Enemy type | Particles | Colours |
|-----------|-----------|--------|
| Grunt | 12 sparks + dust | Grey + gate energy colour of zone |
| Ranged Unit | 10 sparks | White-blue + crystal shard effect |
| Bruiser | 20 dust + rock | Dark grey + deep orange |
| Bosses | 30 mixed | Full burst - boss-specific accent colors |

---

## Perfect Dodge Particles

Fired on successful perfect dodge (see ATTACKSYSTEM.md).

| Property | Value |
|----------|-------|
| Count | 12 particles |
| Shape | `spark` outward from hunter |
| Colour | Hunter aura colour → white |
| Size | 4px → 0px |
| Lifetime | 0.2s |
| Velocity | 100 units/s radial |
| Timing | Fires at dodge activation frame, not on enemy miss |

---

## Performance Rules

| Rule | Detail |
|------|--------|
| Hard cap | 500 particles total. Non-negotiable. |
| Culling order | Ambient first, then aura, then status, then hit sparks |
| No alpha sorting | Particles rendered additive blend — no sort needed |
| Single draw call | All particles in one `THREE.Points` geometry, updated each frame |
| No shadows | Particles cast and receive no shadows |
| No physics | Particles use simple Euler integration only — no collision |
| Off-screen cull | Particles outside camera frustum are skipped in update loop |
| Max particle size | 8px — larger effects use rings (geometry) not particle size |

---

## Related Docs

| System | Doc |
|--------|-----|
| Hit events that spawn sparks | [ATTACKSYSTEM.md](./ATTACKSYSTEM.md) |
| Aura states tied to Surge | [COMBOSYSTEM.md](./COMBOSYSTEM.md) |
| Per-spell visual descriptions | [SPELLS.md](./SPELLS.md) |
| Status effect application | [SPELLS.md](./SPELLS.md) |
| Ultimate visual sequences | [SPELLS.md](./SPELLS.md) |
| Performance caps enforcement | [TECHSTACK.md](./TECHSTACK.md) |

