# HUNTIX — Attack System

> Every hit must be felt. Every chain must be learned.

*Last updated April 15, 2026*

---

## Overview

The attack system defines how hunter combat actions chain, cancel, and resolve. It covers:

- Player combat state machine
- Light and heavy attack chain rules
- Cancel windows — when you can and cannot transition
- Hitstop and impact feedback
- Perfect dodge (parry-equivalent)
- Knockdown and hitstun rules

---

## Player Combat State Machine

Every hunter runs through these states. Only one state is active at a time. Priority determines which state wins if two transitions are requested simultaneously.

```
┌─────────────────────────────────────────────────────────────────┐
│                     PLAYER STATE MACHINE                        │
│                                                                 │
│  IDLE ──► RUN ──► ATTACK_LIGHT ──► ATTACK_HEAVY                │
│    ▲        │          │    ▲           │                       │
│    │        ▼          ▼    │           ▼                       │
│    └──── DODGE ◄── SPELL ◄──┘        DODGE                     │
│              │                          │                       │
│              ▼                          ▼                       │
│           HURT ──────────────────► KNOCKDOWN                   │
│              │                          │                       │
│              ▼                          ▼                       │
│           RECOVER                    GETUP                      │
│                                                                 │
│  ULTIMATE (priority 7 — overrides all except DEAD/DOWNED)      │
│  DEAD / DOWNED (priority 6 — terminal states)                  │
└─────────────────────────────────────────────────────────────────┘
```

### State Definitions

| State | Description | Interruptible? |
|-------|-------------|----------------|
| IDLE | No input. Standing. | Yes — any input |
| RUN | Move input held. | Yes — any combat input |
| ATTACK_LIGHT | Light chain active. | Yes — at cancel windows only |
| ATTACK_HEAVY | Heavy attack. Wind-up cancellable, active frame not. | Partial |
| SPELL_MINOR | Minor spell cast. Committed. | No |
| SPELL_ADVANCED | Advanced spell cast. Committed. | No |
| DODGE | Dodge / dash. I-frame window active. | No |
| HURT | Hit stagger. Brief. | No (plays to completion) |
| KNOCKDOWN | Heavy stagger — player sent to ground. | No |
| RECOVER | Post-hurt recovery frames. | Yes — after frame 4 |
| GETUP | Rising from knockdown. | Yes — after frame 8 |
| ULTIMATE | Full Ultimate animation. Armoured. | No |
| DEAD | HP = 0. Solo mode. | No |
| DOWNED | HP = 0. Co-op mode. Awaiting revive. | No |

---

## Light Attack Chains

### Chain Structure

Each hunter has a unique light chain length and rhythm. See HUNTERS.md for per-hunter combo descriptions. The universal rules below apply to all hunters.

| Hunter | Chain length | Rhythm |
|--------|-------------|--------|
| Dabik | 4 hits | Fast — equal timing |
| Benzu | 2 hits | Slow — heavy weight |
| Sereisa | 3 hits | Fast — footwork shifts |
| Vesol | 3 hits (melee) / 1 shot (ranged) | Medium |

### Chain Timing Window

- Each hit opens a **next-hit window** of **0.35s** after the active frame
- Input within this window queues the next hit
- Input outside this window (after 0.35s) resets to hit 1
- Mashing does not skip hits — each hit waits for its animation slot

### Cancel Windows

Cancel windows define exactly when a transition to another state is allowed during a light chain.

| From | To | Allowed at |
|------|----|------------|
| ATTACK_LIGHT hit 1 | DODGE | Any frame |
| ATTACK_LIGHT hit 1 | SPELL | ❌ Not allowed |
| ATTACK_LIGHT hit 2 | DODGE | Any frame |
| ATTACK_LIGHT hit 2 | SPELL_MINOR | ✅ Recovery frames only (last 4f) |
| ATTACK_LIGHT hit 3 | DODGE | Any frame |
| ATTACK_LIGHT hit 3 | SPELL_MINOR | ✅ Recovery frames only (last 4f) |
| ATTACK_LIGHT hit 3 | SPELL_ADVANCED | ✅ Recovery frames only (last 4f) |
| ATTACK_LIGHT hit 4 (Dabik) | DODGE | Any frame |
| ATTACK_LIGHT hit 4 (Dabik) | SPELL (any) | ✅ Recovery frames only (last 4f) |
| ATTACK_LIGHT (any) | ATTACK_HEAVY | ✅ Recovery frames of any hit |

> **Rule:** Spell cancels are only available after hit 2 or later, and only during the recovery frames of that hit — not during wind-up or active frames. This rewards knowing the chain rhythm.

### Light → Heavy Cancel

- Can cancel into ATTACK_HEAVY from the **recovery frames of any light hit**
- Heavy then plays from its wind-up as normal
- This is how S-grade sequences are built — light chain into heavy into spell

---

## Heavy Attack

### Structure

| Phase | Frames | Duration | Cancellable? |
|-------|--------|----------|--------------|
| Wind-up | 8f | 133ms | ✅ Yes — dodge cancel allowed |
| Active hit frame | 3f | 50ms | ❌ No |
| Recovery | 7f | 117ms | ✅ Yes — dodge or spell after frame 3 of recovery |

### Heavy Cancel Rules

- **Dodge cancel during wind-up** — press DODGE during the 8f wind-up to bail out. Mana is not spent. No cooldown penalty. This is the skilled bailout for reading incoming attacks.
- **No cancel during active frames** — once the hit lands or the active window is active, it plays out.
- **Spell cancel in recovery** — after frame 3 of recovery, SPELL_MINOR or SPELL_ADVANCED can be triggered. Same cancel window rules as light chain recovery.

---

## Hitstop

Hitstop is a brief freeze applied to **both the attacker and the hit enemy** on impact. It sells the weight of the hit without interrupting the combat flow.

### Hitstop Values

| Hit type | Hitstop duration | Applied to |
|----------|-----------------|------------|
| Light attack | 40ms | Attacker + enemy |
| Heavy attack | 80ms | Attacker + enemy |
| Spell hit | 80ms | Attacker + enemy |
| Ultimate hit | 200ms | Attacker + all enemies on screen |
| Status proc (first stack) | 20ms | Enemy only |

### Hitstop Implementation

```js
// On confirmed hit:
function applyHitstop(duration) {
  gameSpeed = 0.0           // Freeze all game objects
  setTimeout(() => {
    gameSpeed = 1.0         // Resume at normal speed
  }, duration)
}
// Enemy flash white for hitstop duration
// Camera shake fires simultaneously (see Camera Shake below)
```

> Hitstop does NOT pause the HUD, particle systems, or audio. Only game object velocity and animation advance freeze.

---

## Camera Shake on Impact

| Hit type | Shake intensity | Shake duration | Direction |
|----------|----------------|----------------|----------|
| Light attack | 0.05 units | 80ms | Random X/Y |
| Heavy attack | 0.12 units | 150ms | Primarily X (horizontal) |
| Spell hit | 0.10 units | 120ms | Random X/Y |
| Ultimate | 0.25 units | 400ms | Full X/Y |
| Player hit taken | 0.08 units | 100ms | Toward attacker |
| Boss phase change | 0.30 units | 500ms | Full X/Y |

---

## Hitstun & Knockdown

### Hitstun (HURT state)

Triggered when a hunter or enemy takes a hit while not in an i-frame window.

| Property | Value |
|----------|-------|
| Duration | 167ms (10 frames) |
| Movement | Stagger back 0.3 units in hit direction |
| Interruptible | No — plays to completion |
| Cancels | ATTACK_LIGHT, ATTACK_HEAVY, SPELL in progress (unless armoured) |
| Does not cancel | DODGE (i-frames active), ULTIMATE (armoured) |

### Knockdown

Triggered by specific heavy attacks, bosses, or 3 stacks of Stun status.

| Property | Value |
|----------|-------|
| Trigger | Heavy attack with knockdown flag, 3× Stun stacks, or boss slam |
| Duration | KNOCKDOWN: 400ms + GETUP: 300ms |
| Movement | Sent back 1.0 unit in hit direction |
| Invincible during | GETUP frames only (300ms i-frames on rising) |
| Cancel | Cannot be cancelled — full animation plays |

> Knockdown is intentionally rare on hunters — it's reserved for boss moments and heavy-weight slams. Regular enemies cannot knock down hunters in MVP.

---

## Perfect Dodge

The perfect dodge is the parry equivalent — a tight timing reward that punishes enemy attacks and powers the combo system, using the existing dodge mechanic.

### Trigger Condition

- Player presses DODGE within **0.15s before** an enemy attack's active hit frame lands
- The dodge i-frame window must be active when the attack would have connected
- Works against all enemy attack types in MVP

### Perfect Dodge Rewards

| Effect | Value |
|--------|-------|
| Slowdown flash | 0.2s at 20% game speed — "bullet time" moment |
| Surge gain | +8% (bonus on top of standard dodge Surge) |
| Enemy stagger | Hit enemy enters HURT state for 0.5s |
| Combo preservation | Hit taken flag NOT set — SS grade remains achievable |
| Visual | Hunter aura flares briefly, edge vignette pulse |
| Audio | Distinct metallic ring SFX (see AUDIO.md) |

### Perfect Dodge Rules

| Rule | Detail |
|------|--------|
| Window | 0.15s (9 frames at 60fps) before attack active frame |
| Too early | Normal dodge — no reward, no stagger |
| Too late | Hit connects — HURT state, SS locked |
| No mana cost | Perfect dodge uses no mana |
| Cooldown | Uses standard dodge cooldown (no separate cooldown) |
| Works against | All enemy melee attacks. Does NOT work against projectiles or AoE ground effects. |

> The perfect dodge is silent in its criteria — no UI prompt, no indicator. Players discover it through feel. The 0.15s window is forgiving enough to be learnable but tight enough to be meaningful.

---

## Attack State Flow — Full Example

A full S-grade sequence for Sereisa:

```
1. IDLE
2. → ATTACK_LIGHT hit 1 (light jab) — 40ms hitstop
3. → ATTACK_LIGHT hit 2 (flick) — 40ms hitstop
4.   [Cancel window opens at hit 2 recovery]
5. → ATTACK_LIGHT hit 3 (sweep) — 40ms hitstop
6.   [Cancel window opens at hit 3 recovery]
7. → ATTACK_HEAVY (wide slash) — 80ms hitstop, knockback
8.   [Heavy wind-up: dodge cancel available]
9.   [Heavy recovery frame 3+: spell cancel available]
10.→ SPELL_MINOR (Electric Dart) — 80ms hitstop, slow proc
11.  [Status proc confirmed → +2% Surge, grade checks for S]
12.→ DODGE (Electric Dash) — re-engage within 0.8s
13.  [Dodge re-engage within window → A grade criteria met]
14.  [No hits taken → SS criteria met if status proc confirmed]
15.→ ATTACK_LIGHT hit 1 again — new chain begins

Result: SS grade if no hits taken. Surge built ~28% from this sequence alone.
```

---

## Impact Feedback Summary

| Feedback type | Light | Heavy/Spell | Ultimate |
|--------------|-------|-------------|----------|
| Hitstop | 40ms | 80ms | 200ms |
| Camera shake | 0.05u / 80ms | 0.12u / 150ms | 0.25u / 400ms |
| Enemy flash | White 40ms | White 80ms | White 200ms |
| Hit spark | Small | Medium | Full screen |
| Audio | Short crack | Heavy thud | Cinematic boom |
| Combo increment | +1 | +1 | +1 per enemy |
| Surge gain | +3% | +6% | N/A (costs Surge) |

---

## State Machine Integration Notes

`CombatController.js` currently drives state. Full state machine to be formalised in Phase 3.

```js
// State transition guard — called before any state change
function canTransition(currentState, nextState) {
  const locked = ['SPELL_MINOR', 'SPELL_ADVANCED', 'DODGE', 'HURT',
                  'KNOCKDOWN', 'GETUP', 'ULTIMATE', 'DEAD', 'DOWNED']
  if (locked.includes(currentState)) return false
  if (currentState === 'ATTACK_HEAVY' && nextState === 'DODGE') {
    return isInWindup()  // Only during wind-up frames
  }
  if (currentState.startsWith('ATTACK_LIGHT') && nextState.startsWith('SPELL')) {
    return isInCancelWindow()  // Only at hit 2+ recovery frames
  }
  return true
}
```

---

## Related Docs

| System | Doc |
|--------|-----|
| Combo counter and grade rules | [COMBOSYSTEM.md](./COMBOSYSTEM.md) |
| Surge gain values | [COMBOSYSTEM.md](./COMBOSYSTEM.md) |
| Spell cast animation timing | [ANIMATIONS.md](./ANIMATIONS.md) |
| Hunter-specific chain lengths | [HUNTERS.md](./HUNTERS.md) |
| Enemy hitstun and knockdown responses | [ENEMIES.md](./ENEMIES.md) |
| Audio cues per hit type | [AUDIO.md](./AUDIO.md) |
| Particle effects per hit type | PARTICLES.md (pending) |
