# Huntix Co-op Input Plan

Unified, co-op-friendly scheme — shared keys across all hunters for chaos-free 1–4P, with unique effects/flavors per character.

---

## Keyboard / Mouse Layout

WASD moves fluidly (face direction; optional mouse aim). 10–15 frame buffer enables light/dodge cancels like Dead Cells.

| Action | Key | Details |
|---|---|---|
| Move | WASD | Responsive arcade; hunter speed varies (Dabik fastest) |
| Jump | Space | Light hop, no double jump |
| Sprint | Shift hold | ×1.2 speed (optional) |
| Light Attack | LMB | 3–5 chains, applies status (e.g. bleed); fastest |
| Heavy Attack | RMB | Arc/slam, high dmg/stagger, 1s CD |
| Dodge / Dash | LShift | 0.2s i-frames; unique per hunter (blink/charge); 0.8s CD |
| Special | E | Mana — minor (instant) / hold for advanced/ult |
| Interact | F | Shop / portal / pickup |
| Pause | Esc | Menu |

---

## Controller Layout (Xbox / PS)

Left stick moves/jumps; A bumpers/triggers for attacks like Castle Crashers spam.

| Action | Button | Details |
|---|---|---|
| Move | Left Stick | Same as KB |
| Jump | A | — |
| Sprint | L3 Click | — |
| Light Attack | X / Square | Chains |
| Heavy Attack | Y / Triangle | Burst |
| Dodge / Dash | B / Circle | I-frames |
| Special | RB / R1 | Mana skills |
| Interact | A (ctx) | — |
| Pause | Start | — |

---

## Hunter Dodge Differences

| Hunter | Dodge Type | Effect |
|---|---|---|
| Dabik | Blink | Teleports behind nearest enemy |
| Benzu | Shoulder Charge | Short forward burst, staggers enemies hit |
| Sereisa | Electric Dash | Dashes through enemies, applies slow on contact |
| Vesol | Flame Scatter | Releases burst of embers, pushes enemies back |

---

## Resource / Feedback Integration

- **Health** — red bar; potions heal; die at zero
- **Mana** — blue bar; regen on hits and passively
- **Surge** — yellow bar; triggers ultimate; no block/parry — defense via dodge and stats

---

## Tech Notes

- Input buffer queues 3 actions
- Hitstop 40–80ms on connect
- Particles on hit connect
- Light/dodge cancels work within 10–15 frame window
