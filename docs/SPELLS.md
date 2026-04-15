# HUNTIX — Spells

> Spells are earned, not given. You start with one. You build toward the rest.

*Last updated April 15, 2026*

---

## Global Spell Rules

| Rule | Value |
|------|-------|
| Cooldown type | **Independent** — each spell has its own cooldown timer, casting one never locks another |
| Cast commitment | **Committed** — once a spell cast begins it plays to completion. No dodge-cancel mid-cast. |
| Ultimate behaviour | **Armoured** — once an Ultimate triggers, it plays out in full. The hunter cannot be interrupted, staggered, or killed during it. |
| Status stacking | **Capped at 3 stacks** — a 4th proc refreshes the duration of existing stacks but does not add a 4th. |
| Status tick rate | Every **0.5 seconds** per stack |
| Mana regen (passive) | +5 mana per second baseline for all hunters |
| Mana regen (light hit) | Per hunter — see stat entries below |

---

## Base Damage Reference

All spell damage is expressed as a multiplier on each hunter's base damage value.

| Hunter | Base Damage | Notes |
|--------|------------|-------|
| Sereisa | 100 | Reference baseline |
| Vesol | 90 (melee) / 120 (spell) | Split base — weak up close, strong at range |
| Dabik | 80 | Low per hit, high per full combo |
| Benzu | 140 | Highest single-hit in roster |

> Example: Flame Bolt at 1.8× on Vesol = **216 damage** (120 spell base × 1.8).

---

## Status Effect Reference

| Status | Hunter | Damage per tick | Tick rate | Max stacks | Duration per stack | Extra effect |
|--------|--------|----------------|-----------|------------|-------------------|---------------|
| **Bleed** | Dabik | 18 | 0.5s | 3 | 3s | None — pure damage over time |
| **Stun** | Benzu | 0 | — | 3 | 1.2s per proc | Enemy cannot move or attack while stunned |
| **Slow** | Sereisa | 0 | — | 3 | 2s per proc | -20% move speed per stack (max -60%) |
| **Burn** | Vesol | 22 | 0.5s | 3 | 3s | Burning enemies take +15% damage from all heavy attacks |

> Stack 3 of any status is visually distinct — aura flares, enemy model reacts. See VISUAL-DESIGN.md for status VFX spec.

---

## Unlock Schedule

| Spell Tier | Unlocked At | Notes |
|------------|------------|-------|
| Minor | Level 1 (start) | Always available from first enemy |
| Advanced | Level 3 | Unlocked after ~first zone clear |
| Minor modification | Level 4 | Pick 1 of 3 cards — changes how Minor spell plays |
| Advanced modification | Level 6 | Pick 1 of 3 cards — changes how Advanced spell plays |
| Ultimate | Level 9 | Unlocked in final zone stretch |

---

## DABIK — Shadow Spells

*Base damage: 80*

---

### Minor — Shadow Step

| Field | Value |
|-------|-------|
| Mana cost | 15 |
| Cooldown | 3.5s |
| Cast type | Instant teleport |
| Range | Up to 4m (snaps to nearest enemy within range) |
| Hitbox | Point — lands behind target, 0.5m strike zone |
| Damage | 1.2× (96 damage) |
| Status | Applies 1 bleed stack on landing hit |
| Duration | Instant |
| Cancellable | No — committed |

**L4 Modification — pick 1 of 3:**

| Card | Name | What changes |
|------|------|---------------|
| A | *Phantom Trail* | Blink destination leaves a bleed zone (1.5m radius, 2s duration, applies 1 bleed stack per 0.5s to enemies inside) |
| B | *Double Blink* | Cooldown reduced to 1.8s. Can blink twice before cooldown starts — second blink must be used within 1.5s of first |
| C | *Soul Siphon* | Each successful blink restores 8 HP. Bleed stack on landing hit increased to 2 stacks |

---

### Advanced — Shadow Clone

| Field | Value |
|-------|-------|
| Mana cost | 40 |
| Cooldown | 9s |
| Cast type | Instant summon |
| Range | Spawns at Dabik's current position |
| Hitbox | Clone has 1.0m collision radius for enemy aggro |
| Damage | 0 (clone deals no damage by default) |
| Status | None by default |
| Duration | 3s taunt duration |
| Cancellable | No — committed |

> Clone taunts all enemies within 6m radius — they redirect aggro to the clone for its full duration. Dabik is free to attack from any angle.

**L6 Modification — pick 1 of 3:**

| Card | Name | What changes |
|------|------|---------------|
| A | *Mirror Fight* | Clone actively attacks nearest enemy — deals 0.6× Dabik base damage (48) per hit, 1.5 hits/sec, applies bleed on every 3rd hit |
| B | *Twin Veil* | Spawns 2 clones instead of 1. Each clone lasts 2s (shorter). Both taunt independently, splitting enemy aggro |
| C | *Death Mark* | Clone explodes on expiry — 2.0× base damage (160) in 2.5m radius, applies 2 bleed stacks to all hit |

---

### Ultimate — Monarch's Domain

| Field | Value |
|-------|-------|
| Surge cost | Full Surge bar |
| Cooldown | N/A — requires Surge to rebuild |
| Cast type | Area — zone-wide |
| Hitbox | Full arena |
| Damage | 0 on activation — damage dealt during strike mode |
| Status | All enemies frozen (cannot move or attack) for 4s |
| Duration | 4s freeze + 4s invisible rapid-strike mode |
| Cancellable | No — armoured, plays to completion |

> **Monarch's Domain sequence:**
> 1. Activation flash — all enemies in arena freeze instantly (4s)
> 2. Dabik turns invisible
> 3. For 4s Dabik moves at 2× speed and each hit deals 1.5× base damage (120) with guaranteed bleed proc
> 4. At the end of the 4s window Dabik reappears with a final position strike — 2.5× base damage (200)

---

## BENZU — Thunder/Earth Spells

*Base damage: 140*

---

### Minor — Shield Bash

| Field | Value |
|-------|-------|
| Mana cost | 20 |
| Cooldown | 5s |
| Cast type | Instant melee burst |
| Range | 1.8m in front of Benzu |
| Hitbox | 1.8m × 1.2m arc |
| Damage | 1.4× (196 damage) |
| Status | Applies 1 stun stack (1.2s stun) to all hit |
| Duration | Instant |
| Cancellable | No — committed |

**L4 Modification — pick 1 of 3:**

| Card | Name | What changes |
|------|------|---------------|
| A | *Thunder Clap* | Hitbox expands to 3.0m × 2.0m. Small shockwave on hit knocks enemies back 1.5m |
| B | *Iron Counter* | If Shield Bash is cast within 0.3s of taking a hit, damage doubles to 2.8× (392 damage). Stun duration extends to 2.0s |
| C | *Quake Step* | Bash leaves a ground crack (3m long, 0.5m wide) that slows enemies walking over it by 40% for 3s |

---

### Advanced — Seismic Slam

| Field | Value |
|-------|-------|
| Mana cost | 50 |
| Cooldown | 11s |
| Cast type | Leap + slam |
| Range | Benzu leaps up to 5m to target point |
| Hitbox | 4m radius shockwave on landing |
| Damage | 2.2× (308 damage) at epicentre, 1.4× (196) at shockwave edge |
| Status | Knocks back all enemies in radius 2.5m. Applies 1 stun stack on direct hit |
| Duration | Leap: 0.6s, shockwave: instant |
| Cancellable | No — committed (once leap starts, it lands) |

**L6 Modification — pick 1 of 3:**

| Card | Name | What changes |
|------|------|---------------|
| A | *Aftershock* | 1.0s after landing, a second shockwave pulses — 2.5m radius, 0.8× base damage (112), applies 1 additional stun stack |
| B | *Crater Zone* | Impact point leaves a crater (3m radius) that slows enemies inside by 35% for 3s |
| C | *Boulder Drop* | Removes the leap. Instead, a boulder falls from above at target point (up to 8m range) — 2.8× damage (392) on direct hit, 1.6× (224) splash |

---

### Ultimate — Titan's Wrath

| Field | Value |
|-------|-------|
| Surge cost | Full Surge bar |
| Cooldown | N/A — requires Surge to rebuild |
| Cast type | Full arena ground shatter |
| Hitbox | Full arena |
| Damage | 3.0× base damage (420) to all enemies |
| Status | All enemies stunned for 5s |
| Duration | Activation: 0.8s wind-up, 5s stun window |
| Cancellable | No — armoured, plays to completion. Benzu takes zero damage during activation and stun window |

> **Titan's Wrath sequence:**
> 1. Benzu slams both fists into the ground — 0.8s wind-up animation
> 2. Ground shatters across the full arena — all enemies take 3.0× damage and are stunned for 5s
> 3. Benzu is fully invincible for the entire duration
> 4. Aura blazes to full intensity — deep red and gold, screen tremor for 0.4s

---

## SEREISA — Lightning Spells

*Base damage: 100*

---

### Minor — Electric Dart

| Field | Value |
|-------|-------|
| Mana cost | 15 |
| Cooldown | 3.0s |
| Cast type | Projectile |
| Range | Full arena width (travels until it hits an enemy or wall) |
| Projectile speed | 18m/s |
| Hitbox | 0.3m radius projectile |
| Damage | 1.1× (110 damage) |
| Status | Applies 1 slow stack (-20% move speed, 2s duration) |
| Duration | Projectile lifetime: 2.0s |
| Cancellable | No — committed |

**L4 Modification — pick 1 of 3:**

| Card | Name | What changes |
|------|------|---------------|
| A | *Volt Burst* | On impact, dart explodes in 1.5m radius. Chains to 1 nearby enemy within 3m for 0.6× damage (60). Both enemies slowed |
| B | *Overcharge* | Hold cast button to charge (max 1.0s). Uncharged = base. Fully charged = 2.0× damage (200), applies stun (1.2s) instead of slow |
| C | *Ricochet* | Dart bounces to a second enemy automatically within 4m of first hit. Second hit deals 0.7× damage (70), applies slow |

---

### Advanced — Chain Shock

| Field | Value |
|-------|-------|
| Mana cost | 45 |
| Cooldown | 10s |
| Cast type | Instant chain — originates from Sereisa, jumps between targets |
| Range | First target within 8m. Each chain jumps up to 4m |
| Targets | Up to 4 enemies |
| Hitbox | Per-target point hit |
| Damage | 1.6× (160) on first target, −0.15× per jump (min 1.0× / 100 on last target) |
| Status | Applies 1 slow stack to each target hit |
| Duration | Chain resolves in 0.3s |
| Cancellable | No — committed |

**L6 Modification — pick 1 of 3:**

| Card | Name | What changes |
|------|------|---------------|
| A | *Storm Net* | Chain jumps to 6 targets instead of 4. Jump range increases to 5m |
| B | *Overclock* | Any enemy already slowed when hit by Chain Shock takes an instant bonus hit: 1.0× damage (100), no additional status |
| C | *Grounding Wire* | Each chained enemy is rooted (cannot move) for 1.5s in addition to slow. Root and slow stack independently |

---

### Ultimate — Storm Surge

| Field | Value |
|-------|-------|
| Surge cost | Full Surge bar |
| Cooldown | N/A — requires Surge to rebuild |
| Cast type | Self-buff — Sereisa enters Storm Surge state |
| Hitbox | Each dash during state deals damage — 1.5m wide dash trail |
| Damage | 1.2× (120) per dash hit |
| Status | Each dash applies 1 slow stack to all enemies passed through |
| Duration | 6s |
| Cancellable | No — armoured, plays to completion |

> **Storm Surge sequence:**
> 1. Activation flash — Sereisa's aura erupts to full white-yellow blaze
> 2. For 6s: move speed doubles, dodge becomes a damaging dash (1.2× per enemy passed through), Sereisa is untouchable (all incoming hits are negated)
> 3. Each dash during the window applies 1 slow stack to every enemy it passes through
> 4. At end of 6s: final position lightning burst — 2.0× damage (200) in 2m radius around Sereisa

---

## VESOL — Flame Spells

*Base damage: 90 melee / 120 spell*

> All Vesol spell damage uses **spell base (120)** unless noted.

---

### Minor — Flame Bolt

| Field | Value |
|-------|-------|
| Mana cost | 12 |
| Cooldown | 2.5s |
| Cast type | Projectile |
| Range | Full arena width |
| Projectile speed | 16m/s |
| Hitbox | 0.4m radius projectile |
| Damage | 1.8× (216 damage) |
| Status | Applies 1 burn stack (22 damage/tick, 0.5s tick, 3s duration) |
| Duration | Projectile lifetime: 2.5s |
| Cancellable | No — committed |

**L4 Modification — pick 1 of 3:**

| Card | Name | What changes |
|------|------|---------------|
| A | *Piercing Bolt* | Bolt passes through all enemies in a line. Each enemy hit takes full damage and 1 burn stack. No limit on pierce count |
| B | *Charged Shot* | Hold cast button (max 1.2s). Fully charged: 3.0× damage (360), hitbox expands to 0.8m radius, applies 2 burn stacks |
| C | *Scattershot* | On impact (or at max range), bolt splits into 3 smaller bolts at 30° spread. Each deals 0.8× damage (96) and applies 1 burn stack |

---

### Advanced — Flame Wall

| Field | Value |
|-------|-------|
| Mana cost | 45 |
| Cooldown | 12s |
| Cast type | Placed area — wall appears at target point up to 6m away |
| Hitbox | Wall: 4m wide, 2m tall. Damage zone: 0.5m either side of wall |
| Damage | 1.4× (168) per second to enemies inside or passing through |
| Status | Applies 1 burn stack per second to enemies in contact |
| Duration | 5s |
| Cancellable | No — committed |

**L6 Modification — pick 1 of 3:**

| Card | Name | What changes |
|------|------|---------------|
| A | *Afterburn* | Wall leaves a burn floor patch (4m × 1m) for 5s after expiry. Floor deals 0.6× damage/sec (72) and applies 1 burn stack/sec |
| B | *Double Wall* | Cast places 2 walls simultaneously. Second wall appears 3m from the first, parallel. Same stats as base wall. Mana cost increases to 65 |
| C | *Inferno Gate* | Wall becomes a pull zone — enemies within 5m are pulled 1.5m/s toward the wall while it is active. Damage and burn unchanged |

---

### Ultimate — Inferno

| Field | Value |
|-------|-------|
| Surge cost | Full Surge bar |
| Cooldown | N/A — requires Surge to rebuild |
| Cast type | Full arena fire fill |
| Hitbox | Full arena |
| Damage | 1.0× (120) per second to all enemies |
| Status | Applies 1 burn stack per second to all enemies. All 3 burn stacks are active within 3s |
| Duration | 6s |
| Cancellable | No — armoured, plays to completion. Vesol is immune to her own flames during Inferno |

> **Inferno sequence:**
> 1. Vesol raises her focus — aura shifts from cold blue to deep crimson (0.6s wind-up)
> 2. Fire floods the entire arena floor — all enemies take 1.0× damage per second and accumulate burn stacks
> 3. Vesol moves freely, casts freely, and takes no damage from her own fire
> 4. At 6s: fire extinguishes. All burning enemies take a final burst hit — 0.5× per burn stack currently active (max 1.5× bonus / 180 bonus damage)

---

## Spell × Progression Cross-Reference

| Level | Event | Spell impact |
|-------|-------|--------------|
| L1 | Start | Minor spell available |
| L3 | Advanced unlocked | Second spell slot activates on HUD |
| L4 | Card pick | Minor spell permanently modified for rest of run |
| L6 | Card pick | Advanced spell permanently modified for rest of run |
| L9 | Ultimate unlocked | Surge bar becomes functional — Ultimate castable |
| L10 | Capstone | Path capstone may further modify spell behaviour (see PROGRESSION.md) |

---

## Spell × Weapon Cross-Reference

When Slot 2 weapon is the active slot, the equipped weapon type modifies the active spell. See WEAPONS.md for full table. Summary:

| Slot 2 Weapon Type | Spell bonus |
|--------------------|-------------|
| Fast | Minor cooldown −20% |
| Heavy | Minor spell gains +stagger |
| Precision | Minor spell gains +1 target |
| Ranged | Minor spell becomes projectile |
| Cast / Focus | +15% spell damage, −10% mana cost |
| Utility | Spell triggers weapon special property on cast |
