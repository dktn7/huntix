# Huntix Enemy Design

Three base enemy types plus miniboss and boss (see BOSSES.md). All enemies use a shared FSM. Lane-based pathing on the X/Y plane.

---

## Shared Enemy FSM

```
IDLE → PATROL → AGGRO → ATTACK → RECOVER → PATROL
                  ↓
               HURT → DEAD
```

- **IDLE:** Stationary, plays idle animation
- **PATROL:** Moves left/right along lane within spawn bounds
- **AGGRO:** Triggered when player enters aggro range — charges toward nearest player
- **ATTACK:** Executes attack when within attack range, locks in place during wind-up
- **RECOVER:** Brief cooldown after attack before returning to PATROL/AGGRO
- **HURT:** Staggers on hit (80ms freeze), can interrupt ATTACK only if not in active hit frame
- **DEAD:** Plays death animation, spawns essence drops, removes from scene after 500ms

---

## Enemy 1 — Grunt

**Role:** Basic melee pressure. Tutorial enemy.

| Stat | Value |
|---|---|
| Health | 80 (×player count multiplier) |
| Speed | 4/10 |
| Attack Damage | 10 |
| Attack Range | 1.2 world units |
| Aggro Range | 8 world units |
| Attack Cooldown | 1.8s |
| Stagger Threshold | Any hit |
| Essence Drop | 5–20 |
| XP | 50 |

**Attacks:**
- **Swipe:** Single melee hit, 400ms wind-up, small horizontal arc. Telegraph: arm raises, brief pause.

**AI Notes:**
- Always targets nearest player
- No ranged capability
- Groups of 3–5 typical; can be staggered out of attack by any hit
- Instanced mesh — reuse geometry for all grunt variants

**Visual:** Low-poly humanoid, cracked gate energy on skin, dull grey/brown tones. Variant: red-tinged for zone 2+.

---

## Enemy 2 — Ranged Unit

**Role:** Distance control, projectile pressure, forces player movement.

| Stat | Value |
|---|---|
| Health | 60 |
| Speed | 3/10 |
| Attack Damage | 8 per projectile |
| Preferred Range | 6–10 world units |
| Aggro Range | 12 world units |
| Attack Cooldown | 2.5s |
| Stagger Threshold | Any hit |
| Essence Drop | 10–30 |
| XP | 75 |

**Attacks:**
- **Energy Bolt:** Single projectile, travels at 12 units/sec, 600ms wind-up. Telegraph: glowing charge on hand/weapon.
- **Retreat Step:** If player closes within 3 units, takes a backwards step before attacking.

**AI Notes:**
- Tries to maintain preferred distance — backs away when player closes
- Will strafe left/right if player is stationary
- Cannot attack while moving
- Spawn 1–2 per wave, more in later zones

**Visual:** Slender low-poly figure, energy crystal embedded in chest/arm. Glows brighter when charging attack.

---

## Enemy 3 — Bruiser

**Role:** Durable pressure tank. Punishes reckless play. Forces spacing.

| Stat | Value |
|---|---|
| Health | 250 |
| Speed | 2/10 |
| Attack Damage | 25 |
| Attack Range | 1.8 world units |
| Aggro Range | 6 world units |
| Attack Cooldown | 3s |
| Stagger Threshold | Heavy attack or 3× light hits |
| Essence Drop | 30–80 |
| XP | 150 |

**Attacks:**
- **Slam:** Overhead two-hand slam, large hit area, 800ms wind-up. Telegraph: both arms raise slowly, brief red flash.
- **Shove:** Pushes player back 3 units if they stay in melee range for 2+ seconds. No damage — positional disruption only.

**AI Notes:**
- Slow movement — players can outpace it
- Does not retreat, does not strafe
- Ignores stagger on light hits until threshold reached
- Max 2 on screen at once
- LOD switch at 10 world units from camera

**Visual:** Hulking low-poly mass, cracked gate ore plating. Dark stone/metal tones. Larger than grunt by 2×.

---

## Miniboss — Gate Warden

**Zone:** Appears at end of City Breach and Ruin Den as zone gatekeeper.

| Stat | Value |
|---|---|
| Health | 600 (×player count multiplier) |
| Speed | 3/10 |
| Attack Damage | 20–35 |
| Stagger Threshold | Heavy attack only |
| Essence Drop | 150–250 |
| XP | 800 |

**Phases:**

| Phase | HP | Attacks |
|---|---|---|
| 1 | 100–50% | Charge (line dash), Wide Swipe (180° arc) |
| 2 | 50–0% | Adds 2 grunts, Slam gains shockwave radius |

**Telegraphs:**
- Charge: full body leans back, red glow builds for 1s before launch
- Wide Swipe: weapon arm extends wide, 600ms pause
- Phase transition: brief slow-mo, aura flare, health bar shifts colour

**Visual:** Armoured humanoid, gate energy cracking through plate. Twice player height.

---

## Wave Composition by Zone

| Zone | Wave 1 | Wave 2 | Wave 3 | Boss |
|---|---|---|---|---|
| City Breach | 4 Grunts | 3 Grunts + 1 Ranged | 2 Grunts + 1 Bruiser | Fire Bruiser |
| Ruin Den | 3 Grunts + 2 Ranged | 2 Bruisers | 4 Grunts + 1 Bruiser + 1 Ranged | Earth Tank |
| Shadow Core | 5 Grunts + 1 Ranged | 2 Bruisers + 2 Ranged | 3 Grunts + 2 Bruisers | Rogue Dabik |
| Thunder Spire | 4 Grunts + 2 Ranged | 3 Bruisers | 2 Bruisers + 3 Ranged + 1 Grunt | Raiju |

**Co-op scaling:** multiply enemy HP by player count multiplier (see COOP.md). In 4P, add 1 extra Grunt per wave.

---

## Tech Notes

- All grunts use instanced mesh (single draw call for up to 10 grunts)
- Enemy positions Y-sorted every frame: `mesh.position.z = -worldY * 0.01`
- Max 20 enemies active simultaneously — queue extras in spawner
- Projectiles: max 10 active at once, pooled and reused
- Death animation: scale to 0 over 400ms, then remove from scene
