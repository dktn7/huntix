# Huntix Animation Spec

Defines animation states, frame budgets, and placeholder rules for each hunter. Used by Codex in Phase 3 when building the animation state machine.

---

## Animation Philosophy

- Animations must be **broad and readable** from the 2.5D side camera
- Every attack needs a clear **wind-up** before the active hit frame
- Dodge must have a strong **lean** in the movement direction
- Idle poses must reflect each hunter's personality
- MVP uses placeholder geometry (boxes) — animation state machine must be ready for real models in Phase 3

---

## Shared Animation States (All Hunters)

| State | Trigger | Loop | Priority |
|---|---|---|---|
| IDLE | No input, no combat | Yes | 0 (lowest) |
| RUN | Move input held | Yes | 1 |
| ATTACK_LIGHT | LIGHT action | No | 3 |
| ATTACK_HEAVY | HEAVY action | No | 3 |
| DODGE | DODGE action | No | 4 |
| SPECIAL | SPECIAL action | No | 3 |
| HURT | Hit taken, not in i-frames | No | 5 |
| DEAD | Health reaches 0 | No | 6 (highest) |
| ULTIMATE | Full Surge + SPECIAL | No | 6 |

**Transition rules:**
- DEAD cannot be interrupted
- DODGE cannot be interrupted (i-frame window)
- ATTACK can be cancelled into DODGE at any frame
- HURT interrupts ATTACK if not in active hit frame
- IDLE/RUN can transition to any combat state instantly

---

## Frame Budgets (60fps target)

| Animation | Frames | Duration | Notes |
|---|---|---|---|
| IDLE | Loop | — | Subtle breathing or weight shift |
| RUN | 12 frames | 200ms loop | Distinct gait per hunter |
| ATTACK_LIGHT | 10 frames | 167ms | Wind-up 4f, active 2f, recover 4f |
| ATTACK_HEAVY | 18 frames | 300ms | Wind-up 8f, active 3f, recover 7f |
| DODGE | 18 frames | 300ms | Lean 4f, travel 10f, recover 4f |
| SPECIAL (minor) | 14 frames | 233ms | Cast 6f, effect 4f, recover 4f |
| SPECIAL (advanced) | 24 frames | 400ms | Wind-up 10f, effect 6f, recover 8f |
| ULTIMATE | 60 frames | 1000ms | Cinematic — hitstop + camera zoom |
| HURT | 10 frames | 167ms | Stagger back, recover |
| DEAD | 24 frames | 400ms | Fall, land, hold |

---

## Hunter-Specific Animation Notes

### Dabik
- **IDLE:** One hand resting near dagger hilt. Low, controlled stance. Minimal movement.
- **RUN:** Low centre of gravity, forward lean, economical stride
- **ATTACK_LIGHT:** Rapid flick combo — arms alternate, daggers flash
- **ATTACK_HEAVY:** Wide cross-slash, brief crouch into strike
- **DODGE (Blink):** Dissolve out (4f), teleport VFX, dissolve in behind target (4f) — no travel arc
- **ULTIMATE:** Daggers fan out, brief stillness, then invisible rapid-strike flurry (speed lines)

### Benzu
- **IDLE:** Wide stance, arms crossed or hanging heavy. Slight chest heave.
- **RUN:** Heavy footfall, slight body lean, armour shifts with each step
- **ATTACK_LIGHT:** Single gauntlet jab — short range, weight transfer
- **ATTACK_HEAVY:** Full two-handed overhead slam, large arc
- **DODGE (Shoulder Charge):** Body drops low, explosive forward surge — enemies hit stagger
- **ULTIMATE:** Both fists raised, slam down simultaneously, shockwave ripple out from point

### Sereisa
- **IDLE:** Fencing ready stance — one foot forward, one blade raised, weight forward
- **RUN:** Upright sprint, blades held back, aggressive forward lean
- **ATTACK_LIGHT:** Quick blade flick combos, footwork shifts between each hit
- **ATTACK_HEAVY:** Wide sweeping slash — both blades arc together
- **DODGE (Electric Dash):** Forward dash blur through enemies, lightning trail left behind
- **ULTIMATE:** Blades raised, lightning crown appears, launches into sustained dash loop

### Vesol
- **IDLE:** Standing straight, focus device at waist height, slight arcane particle float around hands
- **RUN:** Controlled jog, one hand raised with focus, coat flows behind
- **ATTACK_LIGHT:** Directed flame bolt from focus — arm extends, small recoil
- **ATTACK_HEAVY:** Wide flame arc sweep, arm arcs across body
- **DODGE (Flame Scatter):** Arms push out, burst of embers expands radially, brief backward drift
- **ULTIMATE:** Focus raised overhead, blue aura bleeds to full crimson, fire fills arena

---

## Placeholder Animation (Phase 1–2)

Until 3D models are added in Phase 3, all animations are simulated with geometry transforms:

| State | Placeholder Behaviour |
|---|---|
| IDLE | Box sits still, slight Y bob (±0.05 units, 1s cycle) |
| RUN | Box translates on X axis |
| ATTACK_LIGHT | Box scales X briefly (1 → 1.3 → 1 over 167ms), flash white |
| ATTACK_HEAVY | Box scales XY (1 → 1.5 → 1 over 300ms), flash yellow |
| DODGE | Box translates rapidly in dodge direction over 300ms, flash cyan |
| HURT | Box shakes ±0.1 units on X axis for 167ms |
| DEAD | Box scales Y to 0 over 400ms |

---

## Animation State Machine Integration

The `CombatController.js` (Phase 1) drives state. In Phase 3, `AnimationController.js` will:

1. Subscribe to state changes from `PlayerState.js`
2. Map states to Three.js `AnimationMixer` clips
3. Blend transitions using `crossFadeTo()` with appropriate durations
4. Lock transitions during non-cancellable states

**File to create in Phase 3:** `src/gameplay/AnimationController.js`
