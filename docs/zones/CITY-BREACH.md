# CITY BREACH — Zone 1

**Boss:** VRAEL (Fire Bruiser)  
**Unlock:** Always open  
**Theme:** Ruined industrial-research district. Entry zone. Teaches movement and dodging.  
**Tone:** Controlled experiment that stopped being controlled. The city didn't do this. A facility did.

---

## The Place

City Breach is not a war zone. It is a containment failure.

This district was a mix of industrial infrastructure and research facilities — the kind of area where unmarked buildings sit next to warehouses and nobody asks what happens inside either. Gate energy research was expensive, classified, and concentrated here. The facility that produced Vrael was one of several operating in this district, each with different mandates, most of them overlapping in ways their funders preferred not to document.

When the experiment failed the fire didn't stay inside the building. Gate energy doesn't respect walls. It spread through the district's infrastructure — pipes, conduits, ventilation systems — and by the time any response arrived the entire area was compromised. The official report called it a gate breach. It wasn't. It was an exit wound.

The city cordoned the district and stopped trying to reclaim it. That was months ago. Maybe longer. The fire hasn't stopped. The gate energy feeding it means it never will.

Vrael is still here because the energy that made him is strongest here. He doesn't know that. He doesn't know anything anymore. But the district holds him the way a wound holds heat — not by intention, just by nature.

**The facility has no name.** Whatever was on the signage burned with everything else. Nobody has claimed responsibility. Nobody has been named. The programme existed, it produced results, and then the fire took the record with it.

Players will look for the name. There is nothing to find.

---

## Environmental Details

The zone tells the story before the boss fight begins. None of these details are highlighted. No tooltips. No prompts. They are just there for players who look.

- **Facility entrance:** A reinforced door frame still standing in the rubble, walls collapsed around it. An access panel beside it still blinking green. *Access granted.* Nobody left to enter.
- **Lab equipment:** Containment cylinders, cracked and empty, scattered across the lane. Some still connected to power lines that run nowhere. One is still sealed — whatever was inside is gone, the cylinder is just full of fire now.
- **ID tag in the debris:** A facility ID badge fused into a section of melted floor. The photo is gone. The serial number is partially legible. It matches the partial number still visible on Vrael's shoulder plate.
- **Fire suppression system:** Still cycling on the eastern wall of a building that has no roof. Water vapour hits the gate fire and evaporates instantly. It has been doing this for months. Nobody turned it off because nobody came back to turn it off.
- **Signage:** Two buildings still have partial signage visible — letters burned away, frames intact. One reads: *—EARCH FA—*. The other is completely blank, paint gone, just the mounting brackets.

---

## Enemies

The grunts in City Breach are not random gate creatures. They are products of the same uncontrolled fire gate energy that made Vrael — failed iterations, earlier test subjects, or things the facility produced before Cael that didn't cohere the way he did. They don't have his scale. They don't have his presence. They just have the burning.

### Grunt — Ember Remnant
Standard melee pressure. Visually distinct from base grunts — cracked orange-red skin with gate energy fissures, burnt remnants of facility-issue clothing still visible underneath. Moves erratically, like something that has been on fire long enough to stop noticing.

| Stat | Value |
|---|---|
| Health | 80 |
| Speed | 4/10 |
| Attack Damage | 10 |
| Attack Cooldown | 1.8s |
| Essence Drop | 5–20 |

- **Attack:** Swipe — single melee hit, 400ms wind-up, small horizontal arc
- **Visual tell:** Fissures brighten slightly before attacking

### Ranged Unit — Torch
Distance control. Hurls condensed gate fire rather than energy bolts. Keeps distance, punishes stationary players. Visually: taller than the grunt, one arm completely consumed by fire, used as the throwing limb.

| Stat | Value |
|---|---|
| Health | 60 |
| Speed | 3/10 |
| Attack Damage | 8 per projectile |
| Attack Cooldown | 2.5s |
| Essence Drop | 10–30 |

- **Attack:** Fire Lob — arcing projectile, leaves a small fire patch on landing (1s duration)
- **Retreat Step:** Backs away if player closes within 3 units

### Bruiser — Slag
Durable pressure. The heaviest of the facility's failed experiments — gate energy absorption went too deep, body partially calcified around the fire. Slow, nearly unstaggerable, hits like a structure falling.

| Stat | Value |
|---|---|
| Health | 250 |
| Speed | 2/10 |
| Attack Damage | 25 |
| Attack Cooldown | 3s |
| Essence Drop | 30–80 |

- **Attack:** Slam — overhead two-hand impact, large hit area, 800ms wind-up
- **Shove:** Pushes player back 3 units after 2s sustained proximity, no damage
- **Stagger threshold:** Heavy attack or 3× light hits

---

## Wave Composition

| Wave | Enemies | Notes |
|---|---|---|
| Wave 1 | 4 Ember Remnants | Intro — player learns basic combat |
| Wave 2 | 3 Ember Remnants + 1 Torch | Ranged pressure introduced |
| Wave 3 | 2 Ember Remnants + 1 Slag | Bruiser introduced before boss |
| Boss | VRAEL | Full arena, fire pools in Phase 2 |

**4P adds:** +1 Ember Remnant per wave

---

## Visual Design

| Element | Detail |
|---|---|
| Tone | Contained disaster — not apocalyptic, just abandoned and burning |
| Colours | Dark charcoal, deep orange fire glow, pale neon from dead signage, hazy gate light |
| Parallax — Background | Ruined city skyline, smoke columns, gate energy haze at horizon |
| Parallax — Midground | Collapsed building shells, exposed structural frames, facility entrance remnants |
| Parallax — Foreground | Debris piles, broken barriers, scattered lab equipment, fire patches |
| Hazards | None in waves — VRAEL adds fire pools in Phase 2 |
| Ambient particles | Embers rising — constant, slow, 30 max sprites |
| Ground | Cracked concrete with gate energy fissures glowing orange-amber underneath |
| Lighting | Warm orange dominates right side (gate source). Cold blue-white from dead facility lighting on left. |
| Music mood | Urban tension, industrial percussion, rising energy — something that used to be a city |

---

## Zone Flow

```
Portal entry (facility entrance frame — the green light blinks as players pass)
→ Wave 1 — open lane, forgiving space, learn the combat
→ Wave 2 — Torch introduced, players forced to move
→ Wave 3 — Slag introduced, players learn spacing
→ VRAEL intro — emerges from the collapsed facility interior, deep in the right side of the lane
→ Boss fight
→ VRAEL defeated — implosion, gate energy collapses inward
→ Essence magnet
→ Exit portal opens (left side of lane — away from the facility)
```

**Portal detail:** Players enter through what used to be the facility entrance. The green access light blinks as they pass. They exit from the opposite end of the district, away from the building. The zone does not let you leave the way you came in.
