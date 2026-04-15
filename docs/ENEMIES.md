# HUNTIX — Enemy Design

Three base enemy types plus miniboss and boss (see BOSSES.md). All enemies use a shared advanced FSM with token-based aggression control and position slot targeting.

*Last updated April 15, 2026*

---

## Core AI Philosophy

- **Token system** — limits how many enemies attack simultaneously. Players are never unfairly overwhelmed.
- **Position slots** — enemies target abstract slots around the player, not just the player's position directly.
- **Variety by design** — each enemy type forces a different player response. Grunts pressure, Ranged units reposition, Bruisers punish recklessness.
- **Every attack telegraphed** — players can always read what's coming if they pay attention.
- **No cheap hits** — every hit the player takes should feel like their mistake, not a system failure.

---

## Token System (Aggression Capacity)

The token system prevents all enemies from attacking simultaneously. Each enemy must hold a token to enter the ATTACK state. Tokens are a global pool per combat encounter.

### Token Pool Size

| Player count | Max attack tokens |
|-------------|-------------------|
| 1 player | 2 tokens |
| 2 players | 3 tokens |
| 3 players | 4 tokens |
| 4 players | 5 tokens |

### Token Rules

| Rule | Detail |
|------|--------|
| Acquire | Enemy requests a token when entering AGGRO range and reaching attack range |
| Hold | Enemy holds token for the duration of their ATTACK + RECOVER states |
| Release | Token released when enemy enters PATROL, HURT, or DEAD |
| Denied | If no token available, enemy enters WAIT state — circles player without attacking |
| Priority | Closer enemies get token priority. Bruisers have lower priority than Grunts (they wait their turn). |
| Boss exception | Bosses are exempt from the token system — they always attack on their own schedule |

### Token State — WAIT

WAIT is a new state not in the original FSM. Enemies in WAIT:
- Continue moving toward a position slot (see below)
- Play an idle-threat animation (weapon raised, pacing)
- Re-request a token every 0.5s
- Can still be hit and enter HURT
- Visually distinct — slightly dimmed, no red aggro glow

---

## Position Slot System

Instead of all enemies pathfinding directly to the player's position, enemies target **abstract slots** around the player. This prevents enemy stacking and creates readable formations.

### Slot Layout

```
         [BACK-LEFT]  [BACK]  [BACK-RIGHT]

  [FLANK-LEFT]    [ PLAYER ]    [FLANK-RIGHT]

         [FRONT-LEFT] [FRONT] [FRONT-RIGHT]
```

### Slot Distances

| Slot zone | Distance from player | Assigned to |
|-----------|---------------------|-------------|
| FRONT | 1.2 units | Grunts — melee pressure |
| FLANK | 2.5 units | Grunts (flanking), Bruisers |
| BACK | 3.5 units | Grunts attempting to surround |
| RANGE | 6–10 units | Ranged units |

### Slot Assignment Rules

| Rule | Detail |
|------|--------|
| One enemy per slot | No two enemies occupy the same slot simultaneously |
| Dynamic reassignment | If a slot's occupant dies, nearest waiting enemy claims it |
| Bruiser preference | Bruisers always claim FLANK slots — never FRONT (too slow to close first) |
| Ranged preference | Ranged units never enter FRONT or FLANK slots — maintain RANGE zone |
| Overflow | If all slots are filled, excess enemies enter WAIT state until a slot opens |

---

## Advanced Enemy FSM

```
                    ┌────────────────────────────────────────┐
                    │              ENEMY FSM                       │
                    │                                              │
   SPAWN ─► IDLE ─► PATROL ─► AGGRO ─► [token check]             │
                                  │           │                   │
                          token granted    no token                │
                                  │           │                   │
                               TELEGRAPH    WAIT ◄──────► PATROL   │
                                  │                               │
                               ATTACK                              │
                                  │                               │
                               RECOVER ──► [release token] ─► PATROL│
                                  │                               │
                    HURT (any state except DEAD) ─► RECOVER         │
                                  │                               │
                               DEAD                                │
                    └────────────────────────────────────────┘
```

### State Definitions

| State | Behaviour | Token held? |
|-------|-----------|-------------|
| IDLE | Stationary. Waits for aggro trigger. | No |
| PATROL | Moves to assigned position slot. Paces if at slot. | No |
| AGGRO | Player detected. Moves toward position slot at full speed. Requests token. | No |
| WAIT | Token denied. Circles at slot distance. Re-requests every 0.5s. | No |
| TELEGRAPH | Token granted. Plays attack wind-up animation. Cannot be interrupted except by HURT. | Yes |
| ATTACK | Active hit frame fires. Hitbox active. | Yes |
| RECOVER | Post-attack cooldown. Backs off 0.5 units. Releases token on completion. | Yes → No |
| HURT | Hit stagger. 167ms. Interrupts TELEGRAPH and ATTACK (except active frame). Releases token. | Released |
| DEAD | Death animation. Essence drop. Removed after 500ms. Slot freed. | Released |

---

## Telegraph System

Every enemy attack has a distinct telegraph phase. Players must be able to read and react before the active hit frame.

### Telegraph Rules

| Rule | Detail |
|------|--------|
| Minimum telegraph | 300ms for fastest enemy attacks |
| Visual telegraph | Always: animation wind-up + glow/colour change |
| Audio telegraph | Grunt or charge sound specific to attack type |
| Interruptible | Telegraphs CAN be interrupted by player hits (except Bruiser slam — armoured after first 400ms) |
| Cancel on interrupt | If telegraph interrupted by HURT, attack does not fire |

### Telegraph Visual Language

| Attack type | Visual cue | Colour |
|-------------|-----------|--------|
| Melee swing | Arm/weapon raises, brief hold | Orange glow on weapon |
| Charge/dash | Body leans back, foot plants | Red pulse on body |
| Ranged shot | Hand/crystal charges visibly | Bright white-blue glow |
| AoE slam | Both arms raise, brief stillness | Deep red aura flare |
| Grab/shove | Arms extend forward, wide stance | Yellow outline |

---

## Enemy 1 — Grunt

**Role:** Basic melee pressure. Teaches movement and attack timing. Fodder that becomes dangerous in groups.

| Stat | Value |
|---|---|
| Health | 80 (solo) / ×1.5 per additional player |
| Move speed | 4.5 units/s |
| Attack damage | 10 |
| Attack range | 1.2 world units |
| Aggro range | 8 world units |
| Attack cooldown | 1.8s |
| Stagger threshold | Any hit |
| Essence drop | 5–20 |
| XP | 50 |
| Token cost | 1 |

### Attacks

**Swipe**
| Phase | Duration | Detail |
|-------|----------|--------|
| Telegraph | 400ms | Arm raises, orange glow on fist. Steps forward one pace. |
| Active | 100ms | Horizontal arc, 1.2 units wide |
| Recover | 300ms | Returns to idle stance |
| Damage | 10 |
| Knockback | 0.5 units |

### AI Behaviour

- Targets FRONT slot by default. If FRONT occupied, takes FLANK.
- Always targets nearest player
- In groups of 3+: flanking grunts wait at FLANK slots until FRONT grunt attacks, then one flanker requests a token
- Can be staggered out of TELEGRAPH by any hit
- Retreats 1 unit after RECOVER before re-engaging — gives player breathing room

**Visual:** Low-poly humanoid, cracked gate energy on skin, dull grey/brown tones. Variant: red-tinged for Zone 2+.

---

## Enemy 2 — Ranged Unit

**Role:** Distance control. Forces player movement. Punishes stationary play.

| Stat | Value |
|---|---|
| Health | 60 (solo) / ×1.5 per additional player |
| Move speed | 3.0 units/s |
| Attack damage | 8 per projectile |
| Preferred range | 6–10 world units |
| Aggro range | 12 world units |
| Attack cooldown | 2.5s |
| Stagger threshold | Any hit |
| Essence drop | 10–30 |
| XP | 75 |
| Token cost | 1 |

### Attacks

**Energy Bolt**
| Phase | Duration | Detail |
|-------|----------|--------|
| Telegraph | 600ms | Crystal charges visibly — white-blue glow builds from dim to bright |
| Active | Instant | Projectile fires at 12 units/s |
| Recover | 400ms | Recharge animation |
| Damage | 8 |
| Projectile size | 0.3m radius |
| Projectile lifetime | 2.0s |

**Retreat Step**
- Triggered automatically (not token-gated) if player closes within 3 units
- Backs up 2 units over 300ms
- No damage
- Cannot fire during retreat

### AI Behaviour

- Maintains RANGE slot (6–10 units from player)
- Strafes left/right if player is stationary for 1.5s+ — prevents easy tracking
- Retreats if player closes below 3 units (Retreat Step, no token required)
- Cannot attack while moving
- Prioritises targeting the player furthest from other enemies (splits attention in co-op)
- In co-op: one ranged unit focuses each player if 2+ ranged units active

**Visual:** Slender low-poly figure, energy crystal embedded in chest/arm. Glows brighter when charging.

---

## Enemy 3 — Bruiser

**Role:** Durable pressure tank. Punishes reckless play. Cannot be spam-staggered. Forces different tactics.

| Stat | Value |
|---|---|
| Health | 250 (solo) / ×1.5 per additional player |
| Move speed | 2.5 units/s |
| Attack damage | 25 (Slam), 0 (Shove) |
| Attack range | 1.8 world units |
| Aggro range | 6 world units |
| Attack cooldown | 3s |
| Stagger threshold | Heavy attack or 3× light hits in 1.5s |
| Essence drop | 30–80 |
| XP | 150 |
| Token cost | 1 |

### Attacks

**Slam**
| Phase | Duration | Detail |
|-------|----------|--------|
| Telegraph | 800ms | Both arms raise slowly, deep red aura flare. **Armoured after 400ms** — hits during second 400ms do not interrupt. |
| Active | 150ms | Large overhead slam, 2.0 unit radius at impact point |
| Recover | 600ms | Hunched recovery, vulnerable to all hits |
| Damage | 25 |
| Knockback | 1.5 units — triggers KNOCKDOWN on hunter |

**Shove**
| Phase | Duration | Detail |
|-------|----------|--------|
| Trigger | Automatic — no token needed | Fires if hunter stays within 1.5 units for 2.0s+ |
| Active | 200ms | Arms thrust forward, 1.5 unit push |
| Damage | 0 — positional disruption only |
| Pushback | 3.0 units |
| Purpose | Forces player out of melee camping position |

### AI Behaviour

- Targets FLANK slot — approaches from the side, not straight-on
- Does not retreat, does not strafe
- Ignores light hit stagger until threshold (3× light hits in 1.5s) — absorbs punishment
- After threshold stagger: 400ms vulnerable window, then resets threshold counter
- Maximum 2 Bruisers active simultaneously
- Slam wind-up armoured at 400ms — players must interrupt early or dodge

**Visual:** Hulking low-poly mass, cracked gate ore plating. Dark stone/metal tones. 2× player height.

---

## Miniboss — Gate Warden

**Zone:** Appears at end of City Breach and Ruin Den.

| Stat | Value |
|---|---|
| Health | 600 (solo) / ×1.5 per additional player |
| Move speed | 3.0 units/s |
| Attack damage | 20–35 |
| Stagger threshold | Heavy attack only |
| Essence drop | 150–250 |
| XP | 800 |
| Token system | Exempt — attacks on own schedule |

### Attacks by Phase

**Phase 1 (100–50% HP)**

| Attack | Telegraph | Active | Damage | Notes |
|--------|-----------|--------|--------|---------|
| Charge | 1.0s body lean + red glow build | Line dash across arena | 20 | Telegraphed direction is fixed — dodge perpendicular |
| Wide Swipe | 600ms arm extends wide | 180° arc, 2.5 unit radius | 25 | Jump or back-dodge to avoid |

**Phase 2 (50–0% HP)**

| Attack | Change from Phase 1 |
|--------|--------------------|
| Charge | Adds 0.5s fake-out — pauses mid-charge, then resumes |
| Wide Swipe | Gains shockwave: 1.5s after swipe, ground pulse in same arc, 15 damage |
| Summon | Spawns 2 Grunts on phase transition. Once only. |

**Phase Transition:**
- Brief slow-mo (0.3s at 20% speed)
- Aura flare — deep red
- Health bar colour shifts from red to dark crimson
- Screen shake 0.20 units / 350ms

**Visual:** Armoured humanoid, gate energy cracking through plate. Twice player height.

---

## Enemy Hitstun Responses

How each enemy reacts to being hit:

| Enemy | Light hit | Heavy hit | Spell hit | Knockdown trigger |
|-------|-----------|-----------|-----------|-------------------|
| Grunt | HURT (167ms stagger) | HURT + 1.0 unit knockback | HURT + status | Heavy attack |
| Ranged Unit | HURT (167ms stagger) | HURT + 1.5 unit knockback | HURT + status | Heavy attack |
| Bruiser | No stagger (unless threshold) | HURT (threshold counts as 1) | No stagger | 3× threshold stagger = knockdown |
| Gate Warden | No stagger | HURT (167ms) | No stagger | Not possible |

> Knockdown on enemies: sent to ground for 600ms (400ms down + 200ms getup). Fully vulnerable during. No i-frames on getup for enemies (unlike hunters).

---

## Wave Composition by Zone

| Zone | Wave 1 | Wave 2 | Wave 3 | Boss |
|---|---|---|---|---|
| City Breach | 4 Grunts | 3 Grunts + 1 Ranged | 2 Grunts + 1 Bruiser | VRAEL |
| Ruin Den | 3 Grunts + 2 Ranged | 2 Bruisers | 4 Grunts + 1 Bruiser + 1 Ranged | ZARTH |
| Shadow Core | 5 Grunts + 1 Ranged | 2 Bruisers + 2 Ranged | 3 Grunts + 2 Bruisers | KIBAD |
| Thunder Spire | 4 Grunts + 2 Ranged | 3 Bruisers | 2 Bruisers + 3 Ranged + 1 Grunt | THYXIS |

**Co-op scaling:** +50% HP per additional player. In 4P: add 1 extra Grunt per wave.

---

## Tech Notes

- All grunts use instanced mesh (single draw call for up to 10 grunts)
- Position slots computed each frame relative to target player position
- Token pool managed by `EnemySpawner.js` — global per-scene counter
- Enemy positions Y-sorted every frame: `mesh.position.z = -worldY * 0.01`
- Max 20 enemies active simultaneously — queue extras in spawner
- Projectiles: max 10 active at once, pooled and reused
- Death animation: scale to 0 over 400ms, then remove from scene
- WAIT state: enemy uses patrol-speed movement toward slot, no attack logic runs

---

## Related Docs

| System | Doc |
|--------|-----|
| Boss FSMs and phase patterns | [BOSSES.md](./BOSSES.md) |
| Hitstop values on enemy hit | [ATTACKSYSTEM.md](./ATTACKSYSTEM.md) |
| Status effects applied by spells | [SPELLS.md](./SPELLS.md) |
| Wave spawning logic | src/gameplay/EnemySpawner.js |
| Co-op HP scaling | [COOP.md](./COOP.md) |
