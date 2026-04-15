# HUNTIX — Weapons

> Slot 1 is your identity. Slot 2 is your decision.

*Last updated April 15, 2026*

---

## Weapon Slot System

Every hunter has **2 weapon slots**:

| Slot | Contents | Can change? |
|------|----------|-------------|
| **Slot 1 — Signature** | Hunter's default weapon, locked to their identity | ❌ Never removed |
| **Slot 2 — Equipped** | Starts empty. Filled from shop. Swapped mid-run. | ✅ Buy from shop, swap anytime in hub |

In combat press **Q** (or **LB** on controller) to toggle between Slot 1 and Slot 2.

Slot 2 does **not replace** the signature — it gives the hunter a second tool with a different feel, reach, or spell interaction. Choosing what to put in Slot 2 is a meaningful build decision every run.

---

## Weapon Types — Combo Behaviour

Weapon type determines combo string, heavy attack action, and reach. All hunters share this framework — the weapon drives the behaviour, not the hunter.

| Type | Combo string | Heavy attack | Reach |
|------|-------------|--------------|-------|
| **Fast** | 4-hit light → auto-loop or cancel to heavy | Quick stab burst, guaranteed status proc | Short |
| **Heavy** | 2-hit light → cancel to heavy | Slam with AoE shockwave, staggers all nearby enemies | Short–Medium |
| **Precision** | 3-hit light → cancel to heavy | Thrust lunge, extended reach, guaranteed status on hit | Medium |
| **Ranged** | 3-shot burst → cancel to heavy | Charged single shot, knockback on hit | Long |
| **Cast / Focus** | 2-hit melee jab → cancel to spell cast | Amplified spell with bonus effect | Medium–Long |
| **Utility / Special** | Varies per weapon | Unique per weapon — defined in weapon entry below | Varies |

> **Input buffer applies to all weapon types.** 10–15 frame buffer on cancel windows means fast and precise inputs both feel good.

---

## Weapon Stat Block Format

Every weapon is defined by:

- **Damage** — multiplier relative to base 1.0 (hunter base damage × this)
- **Attack Speed** — hits per second on light attack
- **Reach** — short / medium / long
- **Combo Length** — light hits before the string loops or forces heavy
- **Heavy Attack** — exact action, not just flavour
- **Special Property** — unique mechanic this weapon adds
- **Spell Interaction** — what changes about the equipped hunter's active spell when this weapon is in the active slot

---

## Slot 1 — Signature Weapons

Locked to each hunter. Always available. Cannot be sold or replaced.

### 🌑 Dabik — Twin Curved Daggers

| Stat | Value |
|------|-------|
| Type | Fast |
| Damage | 0.8× (low per hit, high per combo) |
| Attack Speed | 4.5 hits/sec |
| Reach | Short |
| Combo Length | 4 hits → auto-loop |
| Heavy Attack | Blink to nearest enemy + guaranteed bleed proc |
| Special Property | Every 4th hit in a combo applies a bleed stack |
| Spell Interaction | Shadow Step cooldown −20% while daggers are active slot |

### 🔴 Benzu — Stone-Forged Gauntlets

| Stat | Value |
|------|-------|
| Type | Heavy |
| Damage | 2.2× per hit |
| Attack Speed | 1.2 hits/sec |
| Reach | Short |
| Combo Length | 2 hits → forced heavy |
| Heavy Attack | Ground slam — shockwave in 3m radius, stuns all hit for 1.2s |
| Special Property | Each hit taken while combo is active adds 1 bonus damage to next heavy |
| Spell Interaction | Shield Bash stun duration +0.4s while gauntlets are active slot |

### ⚡ Sereisa — Lightning Rapier

| Stat | Value |
|------|-------|
| Type | Precision |
| Damage | 1.1× |
| Attack Speed | 3.2 hits/sec |
| Reach | Medium |
| Combo Length | 3 hits → cancel window |
| Heavy Attack | Lunge thrust — travels 2.5m, applies slow on hit, ignores 1 block |
| Special Property | Electric Dash through an enemy while rapier is active applies slow + 1 bonus hit |
| Spell Interaction | Electric Dart projectile speed +30% while rapier is active slot |

### 🔥 Vesol — Gate Crystal Focus

| Stat | Value |
|------|-------|
| Type | Cast / Focus |
| Damage | 0.6× melee jab, 1.6× spell |
| Attack Speed | 2.0 jabs/sec |
| Reach | Medium–Long (spells) |
| Combo Length | 2 melee jabs → spell cast cancel |
| Heavy Attack | Amplified Flame Bolt — 2.5× damage, applies burn instantly |
| Special Property | Every spell hit generates +3 mana regen for 3s |
| Spell Interaction | Baseline — this is the spell-optimised default. All spell interactions are measured relative to this. |

---

## Slot 2 — Shop Weapons

Bought from the hub shop. Equips into Slot 2. Any hunter can use any weapon — stat bonuses and spell interactions favour the listed **Best For** hunter but all hunters benefit.

**Shop rules (reconciled with PROGRESSION.md):**
- 5 items shown per visit (weapons share pool with other shop items)
- Max 2 purchases per hub visit
- Reroll costs 30 Essence
- Weapons are not consumable — they persist for the full run once bought

---

### ⚔️ Fast Weapons

#### Shadow Kunai
| Stat | Value |
|------|-------|
| Cost | 65 🟠 |
| Best For | Dabik |
| Damage | 0.75× |
| Attack Speed | 5.0 hits/sec |
| Reach | Short (melee) / Long (thrown) |
| Combo Length | 4 hits → auto-throw on heavy |
| Heavy Attack | Throws 3 tracking kunai, each applies bleed |
| Special Property | Thrown kunai return — on return hit, bleed duration doubles |
| Spell Interaction | Minor spell cooldown −20% (Fast type bonus) |

#### Portal Dagger
| Stat | Value |
|------|-------|
| Cost | 75 🟠 |
| Best For | Dabik |
| Damage | 0.85× |
| Attack Speed | 4.2 hits/sec |
| Reach | Short |
| Combo Length | 4 hits → blink heavy |
| Heavy Attack | Melee blink — teleports behind target, deals 1.4× hit |
| Special Property | After a blink, next 2 hits deal +25% damage |
| Spell Interaction | Minor spell cooldown −20% (Fast type bonus) |

#### Oni Katana
| Stat | Value |
|------|-------|
| Cost | 85 🟠 |
| Best For | All |
| Damage | 1.1× |
| Attack Speed | 3.0 hits/sec |
| Reach | Short–Medium |
| Combo Length | 4 hits → wide arc heavy |
| Heavy Attack | Wide arc slash — hits all enemies in 180° cone, applies current hunter's status |
| Special Property | Every kill with katana restores 8 HP |
| Spell Interaction | Minor spell cooldown −20% (Fast type bonus) |

---

### 🪨 Heavy Weapons

#### Earth Maul
| Stat | Value |
|------|-------|
| Cost | 95 🟠 |
| Best For | Benzu |
| Damage | 2.4× |
| Attack Speed | 0.9 hits/sec |
| Reach | Short–Medium |
| Combo Length | 2 hits → slam heavy |
| Heavy Attack | Overhead slam — 4m radius shockwave, knocks all enemies back, stuns for 1.5s |
| Special Property | Enemies stunned by maul take +30% damage from all sources for 2s |
| Spell Interaction | Minor spell gains +stagger on hit (Heavy type bonus) |

#### Gate Fist
| Stat | Value |
|------|-------|
| Cost | 80 🟠 |
| Best For | Benzu |
| Damage | 1.9× |
| Attack Speed | 1.4 hits/sec |
| Reach | Short |
| Combo Length | 2 hits → stun burst heavy |
| Heavy Attack | Close-range energy burst — staggers all enemies within 1.5m, generates +15% Surge |
| Special Property | Taking a hit while this is active slot generates +5% Surge |
| Spell Interaction | Minor spell gains +stagger on hit (Heavy type bonus) |

#### Glaive of Embers
| Stat | Value |
|------|-------|
| Cost | 100 🟠 |
| Best For | Vesol |
| Damage | 1.5× |
| Attack Speed | 1.8 hits/sec |
| Reach | Medium–Long |
| Combo Length | 2 hits → sweep heavy |
| Heavy Attack | Full horizontal sweep — hits all enemies in range, leaves burn trail for 2s |
| Special Property | Burn trail from heavy applies Vesol's burn status to any enemy that walks through it |
| Spell Interaction | Minor spell gains +stagger on hit (Heavy type bonus) |

---

### 🎯 Precision Weapons

#### Storm Lance
| Stat | Value |
|------|-------|
| Cost | 90 🟠 |
| Best For | Sereisa |
| Damage | 1.2× |
| Attack Speed | 2.8 hits/sec |
| Reach | Medium–Long |
| Combo Length | 3 hits → lunge heavy |
| Heavy Attack | Extended thrust lunge — 3.5m range, slows enemy 50% for 2s |
| Special Property | Electric Dash distance +25% while lance is equipped |
| Spell Interaction | Minor spell gains +1 target (Precision type bonus) |

#### Crescent Blade
| Stat | Value |
|------|-------|
| Cost | 80 🟠 |
| Best For | All |
| Damage | 1.0× |
| Attack Speed | 3.0 hits/sec |
| Reach | Medium |
| Combo Length | 3 hits → arc heavy |
| Heavy Attack | Rising crescent arc — launches airborne hitbox, applies current hunter's status on all hits |
| Special Property | On combo ×5 or higher, crescent arc gains +50% damage |
| Spell Interaction | Minor spell gains +1 target (Precision type bonus) |

#### Phase Edge
| Stat | Value |
|------|-------|
| Cost | 85 🟠 |
| Best For | Dabik / Sereisa |
| Damage | 1.0× |
| Attack Speed | 3.5 hits/sec |
| Reach | Medium |
| Combo Length | 3 hits → blink-lunge heavy |
| Heavy Attack | Blink-lunge — blinks to target then thrusts, applies bleed (Dabik) or slow (Sereisa) |
| Special Property | Dodge followed immediately by heavy costs no stamina and deals +20% damage |
| Spell Interaction | Minor spell gains +1 target (Precision type bonus) |

---

### 🏹 Ranged Weapons

#### Lightning Bow
| Stat | Value |
|------|-------|
| Cost | 85 🟠 |
| Best For | Sereisa |
| Damage | 1.1× |
| Attack Speed | 2.5 shots/sec |
| Reach | Long |
| Combo Length | 3 shots → charged heavy |
| Heavy Attack | Charged lightning shot — chains to 2 nearby enemies, all slowed |
| Special Property | Hitting a slowed enemy with the bow deals +35% damage |
| Spell Interaction | Minor spell becomes a projectile if it wasn't already (Ranged type bonus) |

#### Gatebreaker Rifle
| Stat | Value |
|------|-------|
| Cost | 110 🟠 |
| Best For | Benzu |
| Damage | 1.8× |
| Attack Speed | 1.2 shots/sec |
| Reach | Long |
| Combo Length | 3 shots → burst heavy |
| Heavy Attack | 3-round burst — stuns first enemy hit, knocks back others |
| Special Property | Stun from rifle heavy lasts 0.5s longer on Bruiser-type enemies |
| Spell Interaction | Minor spell becomes a projectile if it wasn't already (Ranged type bonus) |

#### Inferno Bolt
| Stat | Value |
|------|-------|
| Cost | 80 🟠 |
| Best For | Vesol |
| Damage | 1.0× |
| Attack Speed | 2.0 shots/sec |
| Reach | Long |
| Combo Length | 3 shots → amplified heavy |
| Heavy Attack | Overcharged bolt — 2× damage, applies burn on hit, restores 10 mana |
| Special Property | Every bolt hit on a burning enemy extends burn duration by 1s |
| Spell Interaction | Minor spell becomes a projectile if it wasn't already (Ranged type bonus) |

#### Shadow Dart
| Stat | Value |
|------|-------|
| Cost | 65 🟠 |
| Best For | Dabik |
| Damage | 0.7× |
| Attack Speed | 3.5 shots/sec |
| Reach | Long |
| Combo Length | 3 shots → tracking heavy |
| Heavy Attack | 3 homing darts — each applies bleed, total DoT stacks |
| Special Property | Darts fired from stealth or post-blink deal 2× damage |
| Spell Interaction | Minor spell becomes a projectile if it wasn't already (Ranged type bonus) |

---

### ✨ Cast / Focus Weapons

#### Mana Staff
| Stat | Value |
|------|-------|
| Cost | 80 🟠 |
| Best For | Vesol |
| Damage | 0.7× melee, 1.8× spell |
| Attack Speed | 1.8 jabs/sec |
| Reach | Medium–Long |
| Combo Length | 2 jabs → spell cancel |
| Heavy Attack | Staff slam — AoE around caster, knocks back, applies burn |
| Special Property | +20% spell damage on all spells |
| Spell Interaction | +15% spell damage, mana cost −10% (Cast type bonus) |

#### Gate Crystal Shard
| Stat | Value |
|------|-------|
| Cost | 70 🟠 |
| Best For | All |
| Damage | 0.5× melee, 1.3× spell |
| Attack Speed | 1.5 jabs/sec |
| Reach | Medium |
| Combo Length | 2 jabs → spell cancel |
| Heavy Attack | Mana burst — deals low damage but restores 20 mana instantly |
| Special Property | Passive: +25 max mana while shard is in Slot 2 |
| Spell Interaction | +15% spell damage, mana cost −10% (Cast type bonus) |

---

### 🔧 Utility / Special Weapons

#### Portal Blaster
| Stat | Value |
|------|-------|
| Cost | 120 🟠 |
| Best For | Dabik |
| Damage | 0.9× |
| Attack Speed | 2.0 shots/sec |
| Reach | Medium |
| Combo Length | 3 shots → portal heavy |
| Heavy Attack | Fires a decoy portal — enemies in range are taunted toward it for 3s |
| Special Property | While enemies are taunted by the portal, Dabik's bleed deals +40% damage |
| Spell Interaction | Spell triggers weapon's special property on cast (Utility type bonus) |

#### Storm Bangle
| Stat | Value |
|------|-------|
| Cost | 90 🟠 |
| Best For | Sereisa |
| Damage | 0.6× (shock burst only) |
| Attack Speed | Passive — triggers on dodge |
| Reach | Short burst |
| Combo Length | N/A — passive trigger |
| Heavy Attack | Manual shock burst — short range AoE, slows all hit for 1.5s |
| Special Property | Every dodge releases a shock burst that slows enemies within 1.5m |
| Spell Interaction | Spell triggers weapon's special property on cast (Utility type bonus) |

#### Void Bracer
| Stat | Value |
|------|-------|
| Cost | 95 🟠 |
| Best For | All |
| Damage | 0× (utility only) |
| Attack Speed | N/A — passive |
| Reach | N/A |
| Combo Length | N/A |
| Heavy Attack | Force pulse — short AoE knockback, no damage |
| Special Property | Passive: dodge applies Slot 1 weapon's status effect to all enemies within 1.5m |
| Spell Interaction | Spell triggers weapon's special property on cast (Utility type bonus) |

---

## Spell Interaction — Type Summary

When a Slot 2 weapon is the **active slot**, its type applies a bonus to the hunter's currently active spell:

| Weapon Type in Active Slot | Spell Effect |
|---------------------------|-------------|
| Fast | Minor spell cooldown −20% |
| Heavy | Minor spell gains +stagger on hit |
| Precision | Minor spell gains +1 target |
| Ranged | Minor spell becomes a projectile (if it wasn't) |
| Cast / Focus | +15% spell damage, mana cost −10% |
| Utility / Special | Spell triggers the weapon's Special Property on cast |

> These bonuses apply to whichever spell is active (Minor at L1–L2, Advanced from L3+). Swapping back to Slot 1 (Signature) removes the Slot 2 bonus and restores the Signature's spell interaction.

---

## Weapon Distribution by Hunter

| Hunter | Signature (Slot 1) | Strong Slot 2 picks | Works on all |
|--------|-------------------|--------------------|--------------|
| 🌑 Dabik | Twin Curved Daggers | Shadow Kunai, Portal Dagger, Phase Edge, Shadow Dart, Portal Blaster | Oni Katana, Crescent Blade, Void Bracer, Gate Crystal Shard |
| 🔴 Benzu | Stone-Forged Gauntlets | Earth Maul, Gate Fist, Glaive of Embers, Gatebreaker Rifle | Oni Katana, Crescent Blade, Void Bracer, Gate Crystal Shard |
| ⚡ Sereisa | Lightning Rapier | Storm Lance, Phase Edge, Lightning Bow, Storm Bangle | Oni Katana, Crescent Blade, Void Bracer, Gate Crystal Shard |
| 🔥 Vesol | Gate Crystal Focus | Glaive of Embers, Inferno Bolt, Mana Staff, Gate Crystal Shard | Oni Katana, Crescent Blade, Void Bracer |

---

## Design Rules

- Signature weapons are **never removed** from Slot 1 in MVP
- Slot 2 weapons are run-tied — lost on wipe, kept on full clear for score purposes only
- Every weapon entry must define all 7 stat block fields — no flavour-only entries
- Shared weapons (**All**) must have a meaningful effect for every hunter, not just the listed best-for
- Weapon tone: dark, grounded, gate-world material — no joke or comedic weapons in MVP
- Each shop rotation must include at least 1 weapon from a type the current hunter benefits from (weighted random)
- The Q / LB swap must feel instant — no swap animation delay longer than 4 frames
