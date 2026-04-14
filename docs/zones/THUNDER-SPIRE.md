# THUNDER SPIRE — Zone 4

**Boss:** THYXIS (Thunder Beast)  
**Unlock:** After Shadow Core cleared  
**Theme:** Gate-grown storm structure at the edge of the world. The wolf's territory. The final zone.  
**Tone:** Sacred and hostile simultaneously. A place that was never built for humans and does not apologise for it.

---

## The Place

Nobody built the Thunder Spire.

It grew.

When the gates opened and raw atmospheric gate energy began bleeding into the world, most of it dispersed. Some of it didn't. In one location — an exposed high-altitude ridge above the city, already battered by natural storm systems — the gate energy found the weather and the weather found the gate energy and neither one let go.

Over years, the combined charge began to solidify. Lightning struck the same points repeatedly until the stone fused. Wind pressure compressed gate-saturated air into dense crystalline structures. The storm built itself a home. Not a fortress, not a tower in any designed sense — just the shape that lightning wants to make when it has long enough to work.

The result is the Spire: a jagged, asymmetrical structure of fused stone and compressed storm energy rising from the ridge, crackling with permanent charge. No rooms. No floors. No architecture a human would recognise. Just vertical mass and open platforms and the constant sound of something that has never once been quiet.

The wolf was already there when the Spire began to form.

Old. Solitary. Bound to that ridge by something older than the gates — an instinct to guard what the world needed guarded, even when the world didn't know what that was anymore. It watched the Spire grow around it the way a tree watches weather. It stayed because staying was what it did.

When the essence of Thyxis descended through the gate energy and found the wolf, the Spire surged. The charge that had been building for years released and reset and built again. It has been building ever since.

The storm did not create a lair. It created a sanctuary.

Hunters who enter are not invaders to be destroyed. They are the first things in years to climb high enough to arrive. The Spire does not know what to do with that except respond with everything it has.

---

## Environmental Details

The Spire has no human remnants. No tools, no bodies, no records. Just ancient storm and old stone and the marks the wolf left over years of living here.

- **Paw prints in solidified lightning-stone:** Pressed into sections of the floor where the gate energy crystallised around the wolf's weight. They are large. Older hunters will note they were made before the Spire reached its current height — the wolf has been here longer than the structure.
- **Scorched circles:** Sections of platform where the wolf rested during storms, the lightning striking around but never at it. The stone is blacker there. Slightly warm.
- **Fur caught in a rock split:** A single tuft of grey-brown fur pressed into a crack in the stone near the zone entrance. Natural colour. Not electric. Not blue-white. Just an animal's fur.
- **The silence at the top:** Before the boss encounter begins, there is one beat where the constant ambient crackling stops. Total silence. Then the wind resumes. That beat is the wolf registering that something has arrived.
- **Crystal formations:** Gate energy and storm charge compressed into jutting crystalline outgrowths along the lane edges. Electric blue, humming. They are structural — part of the Spire's body, not decorations.

---

## Enemies

The enemies in the Thunder Spire are gate creatures that wandered into the storm and never left. The Spire's charge got into them the way it gets into everything that stays long enough — not transforming them completely, just making them faster, more erratic, permanently overcharged.

They are not loyal to Thyxis. They are just creatures that live in lightning and learned to like it.

### Grunt — Surge Runner
Fast, aggressive, direct. Gate creature with arcing static discharge on skin, moves in short rapid bursts. The charge makes it harder to track and faster to punish. Prioritises closing distance.

| Stat | Value |
|---|---|
| Health | 80 |
| Speed | 6/10 |
| Attack Damage | 10 |
| Attack Cooldown | 1.8s |
| Essence Drop | 5–20 |

- **Attack:** Shock Swipe — single melee hit with brief static burst on contact, 400ms wind-up
- **Visual:** Standard grunt frame with electric arcing across skin, eyes permanently white

### Ranged Unit — Storm Caster
Hovers at mid-range, fires lightning bolts rather than projectiles. Moves laterally while attacking — harder to close on than other ranged units. Visually floats slightly off the ground, constantly crackling.

| Stat | Value |
|---|---|
| Health | 60 |
| Speed | 3/10 |
| Attack Damage | 8 per bolt |
| Attack Cooldown | 2.5s |
| Essence Drop | 10–30 |

- **Attack:** Lightning Bolt — fast straight projectile, travels at 14 units/sec
- **Drift:** Moves laterally between attacks rather than retreating

### Bruiser — Thunder Hulk
The heaviest gate creature the Spire has overcharged. Dense, slow, but its strikes discharge on impact — AoE static pulse on every heavy hit. The charge built up in it over so long that it crackles constantly and visibly.

| Stat | Value |
|---|---|
| Health | 250 |
| Speed | 2/10 |
| Attack Damage | 25 + static pulse |
| Attack Cooldown | 3s |
| Essence Drop | 30–80 |

- **Attack:** Thunder Slam — overhead impact with small AoE static pulse on landing, 800ms wind-up
- **Shove:** Pushes player back 3 units after 2s proximity
- **Stagger threshold:** Heavy attack or 3× light hits

---

## Wave Composition

| Wave | Enemies | Notes |
|---|---|---|
| Wave 1 | 4 Surge Runners + 2 Storm Casters | High mobility and ranged from the start — spacing critical |
| Wave 2 | 3 Thunder Hulks | Endurance test before the climax |
| Wave 3 | 2 Thunder Hulks + 3 Storm Casters + 1 Surge Runner | Full pressure, all types simultaneously |
| Boss | THYXIS | Three phases, aerial, chain lightning in Phase 2, storm DoT zones in Phase 3 |

**4P adds:** +1 Surge Runner per wave, chain lightning always hits maximum players

---

## Visual Design

| Element | Detail |
|---|---|
| Tone | Ancient, elemental, sacred — a place that has always existed and was never meant to be climbed |
| Colours | Dark navy, electric blue, blinding white lightning, storm grey, pale crystal blue |
| Parallax — Background | Roiling storm clouds, constant lightning flashes in the distance, gate energy visible at cloud level |
| Parallax — Midground | Crumbling Spire sections, crystal outgrowths, exposed stone ridges |
| Parallax — Foreground | Wind-blown debris, electric sparks, crystal formations at lane edges |
| Hazards | Storm DoT zones in Phase 3 — floor lightning patches, 8s duration |
| Ambient lightning | Random full-scene brightness spike every 8–15s — instant and gone |
| Ambient particles | Electric sparks and static motes — 35 max sprites, faster than other zones |
| Ground | Fused stone and compressed gate crystal, blue-white charge lines running through |
| Lighting | Cold blue-white dominant. No warm light anywhere in this zone. Everything is storm. |
| Music mood | Climactic, fast electronic, intense percussion, arcane crescendo — the only zone where the music feels like it is building toward something that never fully releases until Thyxis falls |

---

## Zone Flow

```
Portal entry (players emerge at the base of the Spire — everything above them is storm)
→ Paw prints visible in the first section of floor
→ Wave 1 — fast and ranged simultaneously, players must move constantly
→ Wave 2 — Thunder Hulks, endurance
→ Wave 3 — all types, full pressure
→ One beat of silence — the ambient crackling stops
→ THYXIS intro — descends from above, the Spire surges with his arrival
→ Boss fight — three phases, storm escalates with each transition
→ THYXIS defeated — lightning fades, fur settles grey-brown, the wolf lies breathing
→ Essence magnet
→ Exit portal opens — the storm parts at the edge of the platform. A clear sky visible for the first time.
```

**Portal detail:** Players enter at the base looking up. The exit is the first time in the entire game the sky is visible without storm or smoke or void above it. One beat of open air. Then the portal takes them back to the hub.

---

## The Wolf After

The wolf does not use the exit portal.

When the hunters leave, it is still lying on the stone of the Spire platform. The storm has quieted to a low ambient crackle. The crystal formations are still lit but dimmer.

If a player stays at the exit portal without entering it, the wolf will eventually stand. It shakes the static out of its fur. It looks at where Thyxis was.

Then it walks to the scorched circle near the back of the platform — the place where it used to rest — and lies down again.

The Spire is still its home. It is just the wolf's home now.
