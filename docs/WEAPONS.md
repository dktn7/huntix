# HUNTIX — Weapons

> Slot 1 is your identity. Slot 2 changes how it hits.

*Last updated April 20, 2026*

---

## Rendering Rule — Sprite Pipeline

**All weapons are visually represented by the hunter's signature weapon sprite at all times.**
Slot 2 weapons do not change the sprite. They change stats, combo behaviour, spell interactions, and VFX.
The code and VFX layer handle all visual feedback for Slot 2 — colour tint on the signature weapon, hit particle colour, aura intensity shift.
This means no additional weapon sprites are needed. The four signature weapons are the complete visual set.

---

## Weapon Slot System

Every hunter has **2 weapon slots**:

| Slot | Contents | Sprite change? |
|------|----------|----------------|
| **Slot 1 — Signature** | Hunter's default weapon, locked to their identity | ✅ Always shown |
| **Slot 2 — Modifier** | Bought from shop. Changes stats, behaviour, and VFX only. | ❌ No sprite change — VFX tint only |

In combat press **Q** (or **LB** on controller) to toggle between Slot 1 and Slot 2.

When Slot 2 is active, the code applies:
- A **colour tint** over the signature weapon sprite (e.g. red tint for heavy modifier, blue for cast)
- A **hit VFX swap** — the particle colour and shape on attack hits changes to reflect the equipped modifier
- A **aura intensity shift** — the hunter's aura edge colour blends toward the modifier's element colour
- All stat and spell interaction bonuses from the modifier

Swapping back to Slot 1 removes all tints and VFX overrides instantly.

---

## Weapon Types — Combo Behaviour

Modifier type determines combo string, heavy attack action, reach, and spell interaction when Slot 2 is active.

| Type | Combo string | Heavy attack | Reach |
|------|-------------|--------------|-------|
| **Fast** | 4-hit light → auto-loop or cancel to heavy | Quick burst, guaranteed status proc | Short |
| **Heavy** | 2-hit light → cancel to heavy | Slam with AoE shockwave, staggers all nearby | Short–Medium |
| **Precision** | 3-hit light → cancel to heavy | Thrust lunge, extended reach, guaranteed status | Medium |
| **Ranged** | 3-shot burst → cancel to heavy | Charged single shot, knockback on hit | Long |
| **Cast / Focus** | 2-hit melee jab → cancel to spell cast | Amplified spell with bonus effect | Medium–Long |
| **Utility / Special** | Varies per modifier | Unique per modifier — defined in entry below | Varies |

> **Input buffer applies to all weapon types.** 10–15 frame buffer on cancel windows means fast and precise inputs both feel good.

---

## Weapon Stat Block Format

Every weapon modifier is defined by:

- **Damage** — multiplier relative to base 1.0 (hunter base damage × this)
- **Attack Speed** — hits per second on light attack
- **Reach** — short / medium / long
- **Combo Length** — light hits before the string loops or forces heavy
- **Heavy Attack** — exact action
- **Special Property** — unique mechanic this modifier adds
- **Spell Interaction** — what changes about the equipped hunter's active spell when this slot is active
- **VFX Tint** — colour applied to the signature weapon sprite and hit particles when active

---

## Slot 1 — Signature Weapons

Locked to each hunter. Always available. Sprite never changes.

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
| VFX Tint | None — default sprite |

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
| VFX Tint | None — default sprite |

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
| VFX Tint | None — default sprite |

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
| Spell Interaction | Baseline — all spell interactions measured relative to this |
| VFX Tint | None — default sprite |

---

## Slot 2 — Modifier Shop

Bought from the hub shop. Equips into Slot 2. Any hunter can equip any modifier.
**No new sprites required.** All visual feedback is VFX tint on the existing signature weapon sprite.

**Shop rules:**
- 5 items shown per visit (modifiers share pool with other shop items)
- Max 2 purchases per hub visit
- Reroll costs 30 Essence
- Modifiers are not consumable — they persist for the full run once bought

---

### ⚔️ Fast Modifiers

#### Shadow Kunai
| Stat | Value |
|------|-------|
| Cost | 65 🟠 |
| Best For | Dabik |
| Damage | 0.75× |
| Attack Speed | 5.0 hits/sec |
| Reach | Short / Long (thrown) |
| Combo Length | 4 hits → auto-throw on heavy |
| Heavy Attack | Throws 3 tracking projectiles, each applies bleed |
| Special Property | Thrown projectiles return — on return hit, bleed duration doubles |
| Spell Interaction | Minor spell cooldown −20% (Fast type bonus) |
| VFX Tint | Dark purple tint on weapon sprite, bleed-red hit particles |

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
| VFX Tint | Void-purple tint, portal shimmer on heavy |

#### Oni Katana
| Stat | Value |
|------|-------|
| Cost | 85 🟠 |
| Best For | All |
| Damage | 1.1× |
| Attack Speed | 3.0 hits/sec |
| Reach | Short–Medium |
| Combo Length | 4 hits → wide arc heavy |
| Heavy Attack | Wide arc — hits all enemies in 180° cone, applies hunter's status |
| Special Property | Every kill restores 8 HP |
| Spell Interaction | Minor spell cooldown −20% (Fast type bonus) |
| VFX Tint | Deep red slash trails, white arc flash on heavy |

---

### 🪨 Heavy Modifiers

#### Earth Maul
| Stat | Value |
|------|-------|
| Cost | 95 🟠 |
| Best For | Benzu |
| Damage | 2.4× |
| Attack Speed | 0.9 hits/sec |
| Reach | Short–Medium |
| Combo Length | 2 hits → slam heavy |
| Heavy Attack | Overhead slam — 4m radius shockwave, knocks back, stuns 1.5s |
| Special Property | Stunned enemies take +30% damage from all sources for 2s |
| Spell Interaction | Minor spell gains +stagger on hit (Heavy type bonus) |
| VFX Tint | Stone-grey tint, earth-crack particles on heavy |

#### Gate Fist
| Stat | Value |
|------|-------|
| Cost | 80 🟠 |
| Best For | Benzu |
| Damage | 1.9× |
| Attack Speed | 1.4 hits/sec |
| Reach | Short |
| Combo Length | 2 hits → stun burst heavy |
| Heavy Attack | Close-range energy burst — staggers all within 1.5m, +15% Surge |
| Special Property | Taking a hit while active generates +5% Surge |
| Spell Interaction | Minor spell gains +stagger on hit (Heavy type bonus) |
| VFX Tint | Gold-orange gate ore glow on weapon, burst ring on heavy |

#### Glaive of Embers
| Stat | Value |
|------|-------|
| Cost | 100 🟠 |
| Best For | Vesol |
| Damage | 1.5× |
| Attack Speed | 1.8 hits/sec |
| Reach | Medium–Long |
| Combo Length | 2 hits → sweep heavy |
| Heavy Attack | Full horizontal sweep — all enemies in range, burn trail 2s |
| Special Property | Burn trail applies Vesol's burn to any enemy that walks through it |
| Spell Interaction | Minor spell gains +stagger on hit (Heavy type bonus) |
| VFX Tint | Ember-orange tint, fire trail on sweep heavy |

---

### 🎯 Precision Modifiers

#### Storm Lance
| Stat | Value |
|------|-------|
| Cost | 90 🟠 |
| Best For | Sereisa |
| Damage | 1.2× |
| Attack Speed | 2.8 hits/sec |
| Reach | Medium–Long |
| Combo Length | 3 hits → lunge heavy |
| Heavy Attack | Extended thrust lunge — 3.5m range, slows 50% for 2s |
| Special Property | Electric Dash distance +25% while equipped |
| Spell Interaction | Minor spell gains +1 target (Precision type bonus) |
| VFX Tint | Electric blue tint, extended lightning trail on lunge |

#### Crescent Blade
| Stat | Value |
|------|-------|
| Cost | 80 🟠 |
| Best For | All |
| Damage | 1.0× |
| Attack Speed | 3.0 hits/sec |
| Reach | Medium |
| Combo Length | 3 hits → arc heavy |
| Heavy Attack | Rising arc — launches hitbox upward, applies hunter's status on all hits |
| Special Property | On combo ×5 or higher, arc gains +50% damage |
| Spell Interaction | Minor spell gains +1 target (Precision type bonus) |
| VFX Tint | Silver-white arc trail, crescent flash on heavy |

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
| Special Property | Dodge into heavy costs no stamina and deals +20% damage |
| Spell Interaction | Minor spell gains +1 target (Precision type bonus) |
| VFX Tint | Phase-white shimmer, void trail on blink-lunge |

---

### 🏹 Ranged Modifiers

#### Lightning Bow
| Stat | Value |
|------|-------|
| Cost | 85 🟠 |
| Best For | Sereisa |
| Damage | 1.1× |
| Attack Speed | 2.5 shots/sec |
| Reach | Long |
| Combo Length | 3 shots → charged heavy |
| Heavy Attack | Charged shot — chains to 2 nearby enemies, all slowed |
| Special Property | Hitting a slowed enemy deals +35% damage |
| Spell Interaction | Minor spell becomes a projectile if it wasn't already (Ranged type bonus) |
| VFX Tint | Yellow-white arc tint, lightning chain on charged shot |

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
| Special Property | Stun lasts 0.5s longer on Bruiser-type enemies |
| Spell Interaction | Minor spell becomes a projectile if it wasn't already (Ranged type bonus) |
| VFX Tint | Gate-orange muzzle flash, impact shockwave ring |

#### Inferno Bolt
| Stat | Value |
|------|-------|
| Cost | 80 🟠 |
| Best For | Vesol |
| Damage | 1.0× |
| Attack Speed | 2.0 shots/sec |
| Reach | Long |
| Combo Length | 3 shots → amplified heavy |
| Heavy Attack | Overcharged bolt — 2× damage, burn on hit, restores 10 mana |
| Special Property | Each bolt hit on a burning enemy extends burn by 1s |
| Spell Interaction | Minor spell becomes a projectile if it wasn't already (Ranged type bonus) |
| VFX Tint | Crimson-orange bolt trail, ember burst on hit |

#### Shadow Dart
| Stat | Value |
|------|-------|
| Cost | 65 🟠 |
| Best For | Dabik |
| Damage | 0.7× |
| Attack Speed | 3.5 shots/sec |
| Reach | Long |
| Combo Length | 3 shots → tracking heavy |
| Heavy Attack | 3 homing projectiles — each applies bleed, DoT stacks |
| Special Property | Projectiles from stealth or post-blink deal 2× damage |
| Spell Interaction | Minor spell becomes a projectile if it wasn't already (Ranged type bonus) |
| VFX Tint | Shadow-black dart trail, bleed-red on hit |

---

### ✨ Cast / Focus Modifiers

#### Mana Staff
| Stat | Value |
|------|-------|
| Cost | 80 🟠 |
| Best For | Vesol |
| Damage | 0.7× melee, 1.8× spell |
| Attack Speed | 1.8 jabs/sec |
| Reach | Medium–Long |
| Combo Length | 2 jabs → spell cancel |
| Heavy Attack | AoE around caster — knocks back, applies burn |
| Special Property | +20% spell damage on all spells |
| Spell Interaction | +15% spell damage, mana cost −10% (Cast type bonus) |
| VFX Tint | Deep blue arcane glow, staff pulse on spell cast |

#### Gate Crystal Shard
| Stat | Value |
|------|-------|
| Cost | 70 🟠 |
| Best For | All |
| Damage | 0.5× melee, 1.3× spell |
| Attack Speed | 1.5 jabs/sec |
| Reach | Medium |
| Combo Length | 2 jabs → spell cancel |
| Heavy Attack | Mana burst — low damage, restores 20 mana instantly |
| Special Property | Passive: +25 max mana while shard is in Slot 2 |
| Spell Interaction | +15% spell damage, mana cost −10% (Cast type bonus) |
| VFX Tint | Cold blue crystal shimmer, mana restore burst on heavy |

---

### 🔧 Utility / Special Modifiers

#### Portal Blaster
| Stat | Value |
|------|-------|
| Cost | 120 🟠 |
| Best For | Dabik |
| Damage | 0.9× |
| Attack Speed | 2.0 shots/sec |
| Reach | Medium |
| Combo Length | 3 shots → portal heavy |
| Heavy Attack | Fires a decoy portal — enemies in range taunted toward it for 3s |
| Special Property | While enemies are taunted, Dabik's bleed deals +40% damage |
| Spell Interaction | Spell triggers weapon's special property on cast (Utility type bonus) |
| VFX Tint | Void-purple portal glow, taunt ring on heavy |

#### Storm Bangle
| Stat | Value |
|------|-------|
| Cost | 90 🟠 |
| Best For | Sereisa |
| Damage | 0.6× (shock burst only) |
| Attack Speed | Passive — triggers on dodge |
| Reach | Short burst |
| Combo Length | N/A — passive trigger |
| Heavy Attack | Manual shock burst — short range AoE, slows all hit 1.5s |
| Special Property | Every dodge releases a shock burst slowing enemies within 1.5m |
| Spell Interaction | Spell triggers weapon's special property on cast (Utility type bonus) |
| VFX Tint | Electric yellow bangle glow ring, shock burst on dodge |

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
| Special Property | Passive: dodge applies Slot 1 weapon's status to all enemies within 1.5m |
| Spell Interaction | Spell triggers weapon's special property on cast (Utility type bonus) |
| VFX Tint | Deep void-black ring pulse on dodge, faint aura outline |

---

## Spell Interaction — Type Summary

When a Slot 2 modifier is the **active slot**, its type applies a bonus to the hunter's active spell:

| Modifier Type in Active Slot | Spell Effect |
|-----------------------------|-------------|
| Fast | Minor spell cooldown −20% |
| Heavy | Minor spell gains +stagger on hit |
| Precision | Minor spell gains +1 target |
| Ranged | Minor spell becomes a projectile (if it wasn't) |
| Cast / Focus | +15% spell damage, mana cost −10% |
| Utility / Special | Spell triggers the modifier's Special Property on cast |

> Swapping back to Slot 1 removes the Slot 2 bonus and restores the Signature spell interaction.

---

## Modifier Distribution by Hunter

| Hunter | Signature (Slot 1) | Strong Slot 2 picks | Works on all |
|--------|-------------------|--------------------|--------------| 
| 🌑 Dabik | Twin Curved Daggers | Shadow Kunai, Portal Dagger, Phase Edge, Shadow Dart, Portal Blaster | Oni Katana, Crescent Blade, Void Bracer, Gate Crystal Shard |
| 🔴 Benzu | Stone-Forged Gauntlets | Earth Maul, Gate Fist, Glaive of Embers, Gatebreaker Rifle | Oni Katana, Crescent Blade, Void Bracer, Gate Crystal Shard |
| ⚡ Sereisa | Lightning Rapier | Storm Lance, Phase Edge, Lightning Bow, Storm Bangle | Oni Katana, Crescent Blade, Void Bracer, Gate Crystal Shard |
| 🔥 Vesol | Gate Crystal Focus | Glaive of Embers, Inferno Bolt, Mana Staff, Gate Crystal Shard | Oni Katana, Crescent Blade, Void Bracer |

---

## Design Rules

- Signature weapons are **never removed** from Slot 1 in MVP
- **No new weapon sprites are needed** — the signature weapon sprite is always shown, Slot 2 is VFX-only visually
- Slot 2 modifiers are run-tied — lost on wipe, kept on full clear for score purposes only
- Every modifier entry must define all 8 stat block fields including VFX Tint
- Shared modifiers (**All**) must have a meaningful effect for every hunter
- Weapon tone: dark, grounded, gate-world material — no joke or comedic weapons in MVP
- Each shop rotation must include at least 1 modifier from a type the current hunter benefits from (weighted random)
- The Q / LB swap must feel instant — no swap animation delay longer than 4 frames
- VFX tint is applied by code via `MeshBasicMaterial` colour blend on the sprite quad — no sprite changes needed
