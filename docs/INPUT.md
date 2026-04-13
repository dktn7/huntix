# Huntix Input Spec

Unified control scheme for 1–4P local co-op. All actions go through `InputManager.js`.

> **Source of truth:** `src/engine/InputManager.js` — this doc reflects what is implemented.
> P2–P4 keyboard and gamepad support is planned for Phase 3 (Days 7–9).

---

## P1 Keyboard (Implemented — Phase 1)

| Action | Key(s) | Notes |
|---|---|---|
| Move Left | A, ← Arrow | |
| Move Right | D, → Arrow | |
| Move Up | W, ↑ Arrow | |
| Move Down | S, ↓ Arrow | |
| Light Attack | J | 3–5 chain combos, applies status |
| Heavy Attack | K | Wide arc/slam, high damage + stagger |
| Dodge / Dash | Shift (L or R) | 300ms total, 200ms i-frames, unique per hunter |
| Special | E | Mana cost; hold for advanced |
| Interact | F | Shop / portal / pickup |
| Pause | Escape | |

---

## P1 Gamepad (Implemented — Phase 1)

Xbox / PS layout. Deadzone: 0.3 on all axes.

| Action | Button/Axis | Notes |
|---|---|---|
| Move | axes[0] (LX), axes[1] (LY) | Deadzone 0.3 |
| Interact | Button 0 (A / Cross) | |
| Dodge | Button 1 (B / Circle) | 300ms, 200ms i-frames |
| Light Attack | Button 2 (X / Square) | Chains, applies status |
| Heavy Attack | Button 3 (Y / Triangle) | Burst, stagger |
| Special | Button 5 (RB / R1) | Mana skills |
| Pause | Button 9 (Start / Options) | |

---

## P2–P4 Input (Phase 3 — Not Yet Implemented)

P2 keyboard layout (to be confirmed and added to `InputManager.js` in Phase 3):

| Action | Key |
|---|---|
| Light Attack | H |
| Heavy Attack | L |
| Dodge | N |
| Special | M |
| Movement | TBD — confirm before implementing |

P2–P4 gamepads: `navigator.getGamepads()[playerIndex]` polled each frame.
Never cache the gamepad object — always re-poll inside the animation loop.

---

## Hunter Dodge Differences

| Hunter | Dodge Type | Effect |
|---|---|---|
| Dabik | Blink | Teleports behind nearest enemy |
| Benzu | Shoulder Charge | Short forward burst, staggers enemies hit |
| Sereisa | Electric Dash | Dashes through enemies, applies slow on contact |
| Vesol | Flame Scatter | Releases burst of embers, pushes enemies back |

---

## Input Buffer

- Buffer queues up to 3 actions
- 10–15 frame window for light → dodge cancel
- Only valid cancel: any attack → dodge

---

## Combat Feel Timing (from AGENTS.md spec)

| Action | Timing |
|---|---|
| Light attack hitstop | 80ms |
| Heavy attack hitstop | 150ms |
| Dodge duration | 300ms total |
| Dodge i-frames | 200ms |
| Dodge cooldown | 800ms |

---

## Tech Notes

- All input goes through `InputManager.isDown(action)` or `justPressed(action)` — never read raw keys in gameplay code
- `InputManager.poll()` is called once per frame at the top of the game loop by `SceneManager.update()`
- `moveVector` is normalised — diagonal movement is not faster than axis-aligned
- Fixed timestep: `dt` in all update calls is always `1/60 = 0.01667s`
