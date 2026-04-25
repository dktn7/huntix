# Huntix Animation Spec

Defines animation states, frame budgets, and placeholder rules for each hunter. Used by agents when building the animation state machine.

*Last updated April 25, 2026*

> **Animation model:** All hunter and enemy animations are **frame-based sprite sheet stepping** — not `THREE.AnimationMixer`, not GLTF clips, not bone rigs. See `docs/RENDERING.md` for the full sprite rendering model.

---

## Animation Philosophy

- Animations must be **broad and readable** from the 2.5D side camera
- Every attack needs a clear **wind-up** before the active hit frame
- Dodge must have a strong **lean** in the movement direction
- Idle poses must reflect each hunter's personality
- Spell casts must be visually distinct from attacks — arm/body position changes clearly
- Weapon swap must feel **instant** — no swap animation longer than 4 frames
- **Weapon swap does NOT change the physical weapon** — it is a pure aura/mode shift. Each hunter's signature weapon stays in hand throughout. Only the aura colour or intensity changes to confirm the slot switch.
- MVP uses placeholder geometry (boxes) — animation state machine must be ready for real sprites in Phase 3

---

## Shared Animation States (All Hunters)

| State | Trigger | Loop | Priority |
|---|---|---|---|
| IDLE | No input, no combat | Yes | 0 (lowest) |
| RUN | Move input held | Yes | 1 |
| ATTACK_LIGHT | LIGHT action | No | 3 |
| ATTACK_HEAVY | HEAVY action | No | 3 |
| DODGE | DODGE action | No | 4 |
| SPELL_MINOR | Minor spell cast | No | 3 |
| SPELL_ADVANCED | Advanced spell cast | No | 3 |
| WEAPON_SWAP | Q / LB pressed | No | 2 |
| HURT | Hit taken, not in i-frames | No | 5 |
| DEAD | Health reaches 0 | No | 6 |
| DOWNED | Co-op — HP reaches 0, awaiting revive | Yes (loop) | 6 |
| REVIVE | Co-op — teammate revives | No | 6 |
| ULTIMATE | Full Surge + SPECIAL | No | 7 (highest) |

**Transition rules:**
- ULTIMATE cannot be interrupted (armoured — plays to completion)
- DEAD cannot be interrupted
- DOWNED cannot be interrupted until REVIVE triggers
- DODGE cannot be interrupted (i-frame window)
- SPELL_MINOR and SPELL_ADVANCED cannot be cancelled (committed casts)
- ATTACK can be cancelled into DODGE at any frame
- HURT interrupts ATTACK if not in active hit frame
- WEAPON_SWAP can trigger from any non-locked state (IDLE, RUN, ATTACK recovery frames)
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
| SPELL_MINOR | 14 frames | 233ms | Cast 4f, effect 6f, recover 4f |
| SPELL_ADVANCED | 24 frames | 400ms | Wind-up 10f, effect 6f, recover 8f |
| WEAPON_SWAP | 4 frames | 67ms | Hard cap — must feel instant. Aura/mode shift only — no weapon change. |
| ULTIMATE | 60 frames | 1000ms | Cinematic — hitstop + camera zoom |
| HURT | 10 frames | 167ms | Stagger back, recover |
| DEAD | 24 frames | 400ms | Fall, land, hold |
| DOWNED | Loop | — | Collapsed on ground, slight movement |
| REVIVE | 18 frames | 300ms | Rise from ground, brief aura flash |

---

## Hunter-Specific Animation Notes

### Dabik
- **IDLE:** One hand resting near dagger hilt. Low, controlled stance. Minimal movement.
- **RUN:** Low centre of gravity, forward lean, economical stride
- **ATTACK_LIGHT:** Rapid flick combo — arms alternate, daggers flash
- **ATTACK_HEAVY:** Wide cross-slash, brief crouch into strike
- **DODGE (Blink):** Dissolve out (4f), teleport VFX, dissolve in behind target (4f) — no travel arc
- **SPELL_MINOR (Shadow Step):** Body drops into crouch, shadow particles pull inward, blink — same dissolve as dodge but with purple shadow burst at destination
- **SPELL_ADVANCED (Shadow Clone):** One hand raised, palm out — shadow splits from body sideways, clone materialises (6f), Dabik snaps back to idle
- **WEAPON_SWAP (Aura Shift):** Off-hand flicks to hip — same twin daggers stay in hand. Brief white flash on frame 1 transitioning to deep purple aura pulse on frames 2–3, settled by frame 4. No draw animation. No weapon change.
- **ULTIMATE (Monarch's Domain):** Arms spread wide, head drops, shadow erupts outward from body — full arena freeze VFX, then Dabik fades to invisible
- **DOWNED:** Collapsed on side, one hand weakly reaching forward
- **REVIVE:** Pushed up from ground by shadow energy beneath hands, stands in 18f

### Benzu
- **IDLE:** Wide stance, arms crossed or hanging heavy. Slight chest heave.
- **RUN:** Heavy footfall, slight body lean, armour shifts with each step
- **ATTACK_LIGHT:** Single gauntlet jab — short range, weight transfer
- **ATTACK_HEAVY:** Full two-handed overhead slam, large arc
- **DODGE (Shoulder Charge):** Body drops low, explosive forward surge — enemies hit stagger
- **SPELL_MINOR (Shield Bash):** Arm pulls back (wind-up 4f), explosive forward thrust — shockwave ring visible at hit point
- **SPELL_ADVANCED (Seismic Slam):** Both knees bend, explosive upward jump (4f), hang at peak (2f), crash down — ground crack VFX radiates from landing point
- **WEAPON_SWAP (Aura Shift):** Gauntlet clenches at side — same gauntlets stay on hands. Brief white flash on frame 1 transitioning to deep red-gold fracture pulse across both knuckles on frames 2–3, settled by frame 4. No weapon change.
- **ULTIMATE (Titan's Wrath):** Both fists raised overhead (wind-up 8f), slammed into ground simultaneously — full arena shatter VFX, Benzu glows deep red-gold throughout
- **DOWNED:** Face down, one fist still pressed into ground — still trying
- **REVIVE:** Pushes up from ground with one arm, rises to knees then standing in 18f — brief thunder spark on aura

### Sereisa
- **IDLE:** Fencing ready stance — one foot forward, one blade raised, weight forward
- **RUN:** Upright sprint, blade held back, aggressive forward lean
- **ATTACK_LIGHT:** Quick blade flick combos, footwork shifts between each hit
- **ATTACK_HEAVY:** Wide sweeping slash — full arm arc, foot plants
- **DODGE (Electric Dash):** Forward dash blur through enemies, lightning trail left behind
- **SPELL_MINOR (Electric Dart):** Blade points forward, electric charge visibly builds on tip (3f), dart fires — brief recoil on arm
- **SPELL_ADVANCED (Chain Shock):** Blade raised vertically, lightning arcs from tip outward — chain jumps visible as branching bolts, Sereisa held in place for cast duration
- **WEAPON_SWAP (Aura Shift):** Blade flicks to side — same rapier stays in hand. Brief white flash on frame 1 transitioning to intense yellow-white electric pulse crackling along the full blade length on frames 2–3, settled by frame 4. No weapon change.
- **ULTIMATE (Storm Surge):** Blades raised, lightning crown appears (6f), launches into sustained dash loop — Sereisa trails white-yellow afterimages throughout
- **DOWNED:** On one knee, blade planted in ground for support
- **REVIVE:** Lightning crackles up from blade through arm — rises to standing in 18f

### Vesol
- **IDLE:** Standing straight, focus at waist height, arcane particles float around hands
- **RUN:** Controlled jog, one hand raised with focus, coat flows behind
- **ATTACK_LIGHT (melee jab):** Focus extends forward, brief flame burst at tip — short reach
- **ATTACK_HEAVY (amplified spell):** Both hands raise focus overhead, charged flame bolt fires — larger recoil
- **DODGE (Flame Scatter):** Arms push out, burst of embers expands radially, brief backward drift
- **SPELL_MINOR (Flame Bolt):** Focus arm extends, flame bolt materialises at tip and fires (instant, 14f total) — distinct from melee jab: two-hand grip, wider stance
- **SPELL_ADVANCED (Flame Wall):** Focus held sideways, both hands on it — wall projection fires from tip as a horizontal beam that solidifies into the wall (6f build)
- **WEAPON_SWAP (Aura Shift):** Focus pulses at wrist — same crystal focus stays in place. Brief white flash on frame 1 transitioning to deep crimson aura glow on frames 2–3, settled into new aura state by frame 4. No weapon change.
- **ULTIMATE (Inferno):** Focus raised overhead, aura bleeds from blue to full crimson (6f wind-up), arms spread wide as fire floods arena — Vesol holds centre pose throughout, eyes closed, completely still while everything burns
- **DOWNED:** Seated, one hand pressed to ground, focus still loosely held
- **REVIVE:** Flame lifts beneath hands, rises to standing carried by the heat in 18f

---

## Spell Animation Rules

| Rule | Detail |
|------|--------|
| Minor spells | Must be visually distinct from ATTACK_LIGHT — different hand position, different particle colour |
| Advanced spells | Wind-up must be clearly readable — player must see the build before the effect |
| Committed casts | No cancel frame — the full SPELL_ADVANCED animation plays once started |
| Ultimate entry | Always begins with a hitstop (6 frames, all motion freezes) then the animation plays |
| Aura during Ultimate | Aura blazes to full intensity for the entire Ultimate duration — see VISUAL-DESIGN.md |

---

## Weapon Swap Animation Rules

| Rule | Detail |
|------|--------|
| Max duration | 4 frames (67ms) — hard cap, must feel instant |
| Trigger window | Can trigger during IDLE, RUN, or attack recovery frames only — not during active hit frames or spells |
| Visual | **No physical weapon change.** Each hunter's signature weapon stays in hand. The swap is a pure aura/mode shift — a brief white flash followed by the hunter's aura colour pulsing at peak intensity, then settling. |
| Per-hunter aura | Dabik: deep purple pulse on both daggers. Benzu: red-gold fracture flare on gauntlets. Sereisa: yellow-white electric crackle along rapier blade. Vesol: blue-to-crimson (or crimson-to-blue) shift on focus crystal. |
| Audio cue | Brief whoosh SFX (see AUDIO.md) — confirms swap without being distracting |
| HUD update | Active slot indicator on weapon HUD updates on frame 1 of swap — not after animation completes |

---

## Placeholder Animation (Phase 1–2)

Until sprite atlases are integrated in Phase 3, all animations are simulated with geometry transforms on the placeholder box mesh:

| State | Placeholder Behaviour |
|---|---|
| IDLE | Box sits still, slight Y bob (±0.05 units, 1s cycle) |
| RUN | Box translates on X axis |
| ATTACK_LIGHT | Box scales X briefly (1 → 1.3 → 1 over 167ms), flash white |
| ATTACK_HEAVY | Box scales XY (1 → 1.5 → 1 over 300ms), flash yellow |
| DODGE | Box translates rapidly in dodge direction over 300ms, flash cyan |
| SPELL_MINOR | Box flashes hunter aura colour, small particle burst at front |
| SPELL_ADVANCED | Box pulses aura colour (2× scale, 400ms), effect spawns at target |
| WEAPON_SWAP | Box flashes hunter's aura colour for 4 frames — no geometry change |
| HURT | Box shakes ±0.1 units on X axis for 167ms |
| DEAD | Box scales Y to 0 over 400ms |
| DOWNED | Box lays flat (rotates 90° on Z) with slow pulse |
| REVIVE | Box rises from flat back to upright over 300ms, flash green |

---

## Animation State Machine Integration (Phase 3)

`CombatController.js` (Phase 1) drives state transitions. In Phase 3, `AnimationController.js` will:

1. Subscribe to state changes from `PlayerState.js`
2. Map states to frame ranges in the hunter's sprite atlas JSON
3. Call `SpriteAnimator.play(stateName)` to begin stepping through the correct frames
4. Lock transitions during non-cancellable states (ULTIMATE, DEAD, DOWNED, SPELL_ADVANCED)
5. Handle WEAPON_SWAP as a hard-cut aura flash (4 frames) — no blend, no weapon geometry change

**Files to create in Phase 3:**
- `src/gameplay/AnimationController.js` — state machine wiring, subscribes to PlayerState
- `src/visuals/SpriteAnimator.js` — UV frame stepper, driven by AnimationController
- `src/visuals/HunterMeshes.js` — builds the PlaneGeometry sprite quad per hunter, loads atlas

See `docs/RENDERING.md` for the full sprite atlas format and SpriteAnimator implementation reference.
