# RUIN DEN — Zone 2

**Boss:** ZARTH (Earth Tank)  
**Unlock:** After City Breach cleared  
**Theme:** Genuinely deep underground. Forgotten collapse site. The city above has no idea this exists.  
**Tone:** Ordinary tragedy made permanent. Not an experiment. Not a conspiracy. Just workers who showed up for a shift and never came back.

---

## The Place

The Ruin Den is not a facility. It is not a bunker. It is not a project.

It is a void the city was built on top of without knowing.

Deep below the industrial district, beneath the foundations of buildings that have stood for decades, there was a hollow space — natural cavern, old foundation void, the kind of emptiness that sits under cities for generations while everything above it grows heavier. Nobody surveyed it. Nobody mapped it. It was simply there, in the dark, as it had always been.

When the gates opened, the hollow filled.

Not with gate creatures. Not with energy that could be measured or studied. Just with presence — raw and formless, the kind that saturates stone over years the way water saturates wood. The gate energy had nowhere to go and a great deal of space to settle into.

A construction crew hit the cavity during routine excavation work. Extension of a utility conduit, standard depth, standard crew. Seven workers on the day shift. The ground gave way. The gate energy that had been quietly accumulating in the hollow for however long it had been there responded to the intrusion the only way it knew how.

The collapse was reported. The missing persons were filed. The site was sealed at surface level and the project was rerouted.

That was the last anyone above thought about it.

Below, the energy kept settling. The stone kept absorbing. The grief of seven ordinary deaths — not heroic, not experimental, just seven people who showed up for work — became part of the material. And the material became Zarth.

He is not angry about what happened here. He does not remember it. He is made of it.

The Ruin Den is his body and his memory simultaneously. Every wall is him. Every collapsed tunnel is a thought he has already finished having. The workers who died here are not ghosts — they are structure. They are why he holds together.

He does not want to destroy the hunters.

He wants them to stop going deeper.

---

## Environmental Details

There are no facility remnants here. No research equipment. No signage with burned-away names. Just the ordinary things that were left when ordinary people didn't come back.

- **Hard hats in the rubble:** Three of them, scattered across the lane. Standard issue, no markings. One has a crack running through the crown that was not caused by the collapse.
- **The drill:** A rotary drill stopped mid-rotation, still positioned at the point of entry. The drill bit is inside the wall. The wall closed around it when the gate energy hardened the stone. It has been like this ever since.
- **Work order on a clipboard:** Laminated, attached to a section of conduit that is still partially intact. The document is readable. It lists the job, the date, the crew size. Seven names. The job description is three lines of utility language. At the bottom, a supervisor signature and a start time: 07:00.
- **A thermos:** On a natural stone shelf that wasn't there before the collapse, somehow undisturbed. Still sealed. The gate energy that restructured the cavern moved around it.
- **Boot prints:** Pressed into a section of hardened gate-energy mud near the entrance. They stop. There are no prints going the other way.

---

## Enemies

The enemies in the Ruin Den are not separate creatures that wandered in. They are fragments of Zarth — sections of the ruin that broke off and gained independent motion. The same stone, the same red fissures, the same dead-weight presence at smaller scale.

Fighting them feels like chipping at a building. Not defeating enemies — reducing a structure.

### Grunt — Rubble Shard
Basic melee pressure. Stone fragment with gate energy fissures, roughly humanoid in shape but not designed to be. Moves with the lurching weight of something that doesn't understand why it's moving, only that it should.

| Stat | Value |
|---|---|
| Health | 80 |
| Speed | 4/10 |
| Attack Damage | 10 |
| Attack Cooldown | 1.8s |
| Essence Drop | 5–20 |

- **Attack:** Swipe — single melee hit, 400ms wind-up
- **Visual:** Low-poly stone fragment, red fissures, no face. Slightly different shape every instance — no two look identical because they broke off from different parts of Zarth.

### Ranged Unit — Debris Caster
Distance pressure. Hurls chunks of gate-energy-hardened rubble. Stays back, forces movement. Visually: a wider, flatter stone form with one oversized arm used for throwing.

| Stat | Value |
|---|---|
| Health | 60 |
| Speed | 3/10 |
| Attack Damage | 8 per projectile |
| Attack Cooldown | 2.5s |
| Essence Drop | 10–30 |

- **Attack:** Rubble Throw — arcing chunk, stuns on direct hit for 0.3s
- **Retreat Step:** Backs away if player closes within 3 units

### Bruiser — Foundation Block
Durable pressure. The largest fragment — a section of actual structural foundation that detached and moves. Nearly unstaggerable. Hits like a wall falling on you because it basically is.

| Stat | Value |
|---|---|
| Health | 250 |
| Speed | 2/10 |
| Attack Damage | 25 |
| Attack Cooldown | 3s |
| Essence Drop | 30–80 |

- **Attack:** Slam — overhead impact, large hit area, 800ms wind-up
- **Shove:** Pushes player back 3 units after 2s proximity, no damage
- **Stagger threshold:** Heavy attack or 3× light hits

---

## Wave Composition

| Wave | Enemies | Notes |
|---|---|---|
| Wave 1 | 3 Rubble Shards + 2 Debris Casters | Ranged pressure from the start — tighter zone |
| Wave 2 | 2 Foundation Blocks | Bruiser spacing lesson — two at once |
| Wave 3 | 4 Rubble Shards + 1 Foundation Block + 1 Debris Caster | Full pressure before boss |
| Boss | ZARTH | Arena restructures, walls close in Phase 2 |

**4P adds:** +1 Rubble Shard per wave

---

## Visual Design

| Element | Detail |
|---|---|
| Tone | Ancient, oppressive, forgotten — a place that has been wrong for a long time |
| Colours | Dark grey, deep brown, faint red-gold from fissures, dust haze throughout |
| Parallax — Background | Tunnel void, absolute dark beyond a certain depth, faint red glow far back |
| Parallax — Midground | Crumbled support columns, pipe sections, exposed rebar, collapsed archways |
| Parallax — Foreground | Rubble mounds, scattered tools, hardhat debris, the drill still in the wall |
| Hazards | Foreground rubble columns reduce clear lane space to ~28 units at edges |
| Ambient particles | Dust — constant, slow, 20 max sprites. Never stops. Part of the zone identity. |
| Ground | Packed earth and cracked stone, red-gold fissures running through like veins |
| Lighting | Almost no ambient light. Red-gold from fissures is the primary source. Cold white from a single intact work light on the ceiling, flickering. |
| Music mood | Heavy, grinding, slow industrial percussion. Pressure building. No release until the boss. |

---

## Zone Flow

```
Portal entry (descent — players come in from above, the zone opens downward)
→ Work order visible immediately on the right wall — readable if players stop
→ Wave 1 — tighter space, ranged units force movement from the start
→ Wave 2 — two Foundation Blocks, spacing lesson
→ Wave 3 — full mixed pressure
→ ZARTH intro — the far wall of the cavern shifts. What players thought was stone was always him.
→ Boss fight — arena space reduces as rubble walls rise in Phase 2
→ ZARTH defeated — fissures go dark one by one. Dust settles for the first time.
→ Essence magnet
→ Exit portal opens — a new passage breaks open in the left wall. It was not there before.
```

**Portal detail:** Players enter from above — descending into the zone. The exit opens in a wall that was solid for the entire fight. Zarth's defeat is what makes leaving possible. The zone didn't have an exit until he stopped holding it together.
