# HUNTIX — Player Debuffs

> Enemies hit back. What they apply matters.

*Last updated April 15, 2026*

---

## Overview

Debuffs are negative status effects applied to hunters by enemy attacks and boss abilities. They are distinct from the status effects hunters apply to enemies (see SPELLS.md).

All debuffs:
- Are **visible on the HUD** (icon below HP bar)
- Have a **fixed duration** — no stacking in MVP
- Can be **refreshed** (re-applying extends duration, does not stack)
- Are **cleared on zone entry** and on revive
- Are **not cleared** by dodging or taking damage

---

## Debuff List

### 1. Bleed

| Property | Value |
|----------|-------|
| Applied by | Grunt melee hits (Zone 2+), Gate Warden Wide Swipe |
| Duration | 4.0s |
| Effect | Deals 3 damage per second (DoT). Does not interrupt actions. |
| Total damage | 12 over full duration |
| Visual | Red drip particles on hunter (3 particles, downward). HP bar ticks red. |
| HUD icon | Red droplet icon, countdown timer below |
| Cleanse | Duration only. No item cleanse in MVP. |

### 2. Slow

| Property | Value |
|----------|-------|
| Applied by | Ranged Unit Energy Bolt hit, ZARTH acid pool |
| Duration | 3.0s |
| Effect | Move speed reduced to 50% of base. Dodge distance reduced to 60%. |
| Visual | Blue frost shimmer on hunter feet. Slow aura pulse around legs. |
| HUD icon | Blue ice crystal icon |
| Cleanse | Duration only |
| Note | Does NOT slow attack speed or spell cast speed — movement only |

### 3. Stun

| Property | Value |
|----------|-------|
| Applied by | Bruiser Slam (direct hit), KIBAD shadow grab |
| Duration | 1.2s |
| Effect | Hunter cannot move, attack, or use spells. Full lock. |
| Visual | Yellow stars orbit hunter head (stun classic visual). Screen briefly desaturates. |
| HUD icon | Yellow lightning bolt icon, flashing |
| Cleanse | Duration only. Cannot be cancelled by any input. |
| Note | Shortest duration debuff — 1.2s is long enough to be punishing without being frustrating |

### 4. Burn

| Property | Value |
|----------|-------|
| Applied by | VRAEL fire pools, City Breach Fire Bruiser attacks |
| Duration | 5.0s |
| Effect | Deals 4 damage per second. Move speed reduced to 80%. |
| Total damage | 20 over full duration |
| Visual | Orange flame particles rising from hunter. Aura colour temporarily shifts toward orange. |
| HUD icon | Orange flame icon, countdown timer |
| Cleanse | Duration only. Jumping does NOT remove burn (fire follows you). |

### 5. Weaken

| Property | Value |
|----------|-------|
| Applied by | KIBAD shadow debuff aura (boss ability), Rogue Dabik mirror ability |
| Duration | 6.0s |
| Effect | All damage dealt by hunter reduced by 30%. |
| Visual | Hunter aura dims to 40% opacity. Faint grey wash over character. |
| HUD icon | Grey downward arrow icon |
| Cleanse | Duration only |
| Note | Most impactful debuff. Punishes staying in KIBAD’s shadow aura zone. |

### 6. Expose

| Property | Value |
|----------|-------|
| Applied by | Rogue Dabik shadow clone explosion (boss, Zone 4) |
| Duration | 4.0s |
| Effect | Hunter takes 25% increased damage from all sources. |
| Visual | Red outline pulse on hunter silhouette. |
| HUD icon | Red cracked shield icon |
| Cleanse | Duration only |
| Note | Pairs with Rogue Dabik’s follow-up attacks — clone explodes → Expose → boss charges |

---

## Debuff Interactions

| Combination | Result |
|-------------|--------|
| Bleed + Slow | Most common combo (Ranged Unit + Grunt). No special interaction. Both run independently. |
| Burn + Weaken | Dangerous. 4 DPS + 30% damage penalty. Forces aggressive play to end fight fast. |
| Stun + Expose | Devastating on bosses that inflict both. Hunter is locked + taking 25% more. Top priority to cleanse. |
| Any debuff + Downed | Debuffs are cleared on revive regardless. Reviving is a clean slate. |

---

## Debuff Display on HUD

- Debuff icons appear in a row below the HP bar, left-aligned
- Each icon is 16×16px
- Countdown timer (seconds, 1 decimal) shown below each icon
- At 1.0s remaining: icon flashes
- On expiry: icon fades out over 0.2s
- Maximum 3 debuffs simultaneously (MVP cap — fourth debuff replaces the oldest)

---

## Debuff Immunity

| State | Immune to debuffs? |
|-------|-------------------|
| DODGE (i-frames active) | Yes — full immunity during i-frame window |
| ULTIMATE (armoured) | Yes — debuffs cannot be applied during Ultimate |
| DOWNED | No new debuffs applied — already at 0 HP |
| Normal combat | No immunity |

---

## Related Docs

| System | Doc |
|--------|-----|
| Enemy attacks that apply debuffs | [ENEMIES.md](./ENEMIES.md) |
| Boss abilities that apply debuffs | [BOSSES.md](./BOSSES.md) |
| HUD debuff icon display | [HUD.md](./HUD.md) |
| I-frame immunity window | [ATTACKSYSTEM.md](./ATTACKSYSTEM.md) |
| Status effects on enemies (hunter-applied) | [SPELLS.md](./SPELLS.md) |
