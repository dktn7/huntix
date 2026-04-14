# Huntix Boss Design Plan

Four modular bosses for Three.js MVP — shared state machine, low-poly GLTF imports, co-op scaling (+50% HP/player), adds in 4P, and Nioh-inspired phases with telegraphs/juice. Each fight 1.5–3min, post-zone waves.

Each boss is designed as a **distorted reflection** of one of the four S-Rank hunters — same elemental energy, corrupted or taken to an extreme. The player is always fighting something familiar made wrong.

---

## Shared Tech

- **AI Base:** Finite state — idle → telegraph → action → recover; raycast target nearest player
- **Perf:** 5–10k tris, LOD, 500 particles max, baked AO
- **Juice:** 80ms hitstop, tiered shake, aura ramp, slow-mo kill
- **Rewards:** Boss XP 1500, essence 500 + high-score bonus

---

## Boss 1 — VRAEL (Fire Bruiser)
**Zone:** City Breach
**Hunter Echo:** Vesol — fire without precision. Where Vesol maps and controls every flame, Vrael is fire that never learned restraint.
**Theme:** Aggressive charger, intro to movement/dodge

| Phase | HP | Attacks | CD | Counter |
|---|---|---|---|---|
| 1 | 100–60% | Flame charge (line dash), Swipe (melee arc) | 7s, 4s | Side dodge |
| 2 | 60–0% | Fire pools (persistent DoT) | 10s | Benzu tank / Jump over pools |

- **Counter hint:** Vesol burn synergy
- **Visuals:** Hulking former gate-clearing soldier fused with fire gate energy mid-mission. Burnt tactical armour, cracked orange-red skin underneath, no helmet — face partially consumed by ember. His aura mirrors Vesol's cold-to-crimson shift but locked permanently at the violent end — deep orange with white-hot cracks, constant and uncontrolled. Eyes burning orange, no pupils.
- **Code note:** Tween charge velocity

---

## Boss 2 — ZARTH (Earth Tank)
**Zone:** Ruin Den
**Hunter Echo:** Benzu — strength without warmth. Benzu built things, Zarth is what building becomes when it has no humanity left inside it.
**Theme:** Spacing/timing, wall pressure

| Phase | HP | Attacks | CD | Counter |
|---|---|---|---|---|
| 1 | 100–60% | Slam (AoE quake), Arm wall (trap/pushback) | 8s, 6s | Range poke |
| 2 | 60–0% | Rubble spawn (2 grunts in 4P) | 12s | Stun breaks wall / Dabik backstab |

- **Counter hint:** Sereisa slow
- **Visuals:** Ancient gate entity that formed inside collapsed ruins over centuries. Not humanoid — architectural. Looks like a building that learned to stand up. Stone-carved face with no expression. Deep red-gold veins pulse through cracked rock body — same palette as Benzu's aura but dead and static, no warmth. Eyes are two deep red fissures that glow only when about to slam.
- **Code note:** Physics impulse on slam

---

## Boss 3 — KIBAD (Rogue Angel)
**Zone:** Shadow Core
**Hunter Echo:** Dabik — his direct celestial inversion. Same silhouette, same twin daggers, same build. Everything else is opposite.
**Theme:** Teamwork, anti-shadow mirror of hunter

| Phase | HP | Attacks | CD | Counter |
|---|---|---|---|---|
| 1 | 100–60% | Blink slash (tele behind), Dagger combo (4 hits) | 5s, 4s | Predict blink |
| 2 | 60–0% | 2× clones (taunt/decoy), AoE spells | 10s | Surge ult sync |

- **Counter hint:** Benzu shoulder charge
- **Visuals:** Where Dabik is dark skin / white spiky hair / shadow aura, Kibad is the exact inversion — pale luminous skin / short wild spiky BLACK hair / blinding white-gold aura. Same lean build, same twin curved daggers (polished bone-white with gold edge lines, pristine, never look used). Eyes are gold-white, flat, no pupils visible at full power — bright but not warm, unsettling because they don't read as human. His aura radiates outward wide and overwhelming — not controlled like Dabik's shadow, it bleeds. Feels like standing too close to something celestial. You recognise the silhouette instantly. Then the light hits and it's wrong.
- **Name note:** Kibad is Dabik in reverse — intentional.
- **Code note:** Clone instances share HP pool

---

## Boss 4 — THYXIS (Thunder Beast)
**Zone:** Thunder Spire
**Hunter Echo:** Sereisa — speed and lightning without control. Sereisa is lightning mastered by a human. Thyxis is lightning as a natural force that never learned to hold back.
**Theme:** Full synergies, aerial climax

| Phase | HP | Attacks | CD | Counter |
|---|---|---|---|---|
| 1 | 100–70% | Ground pound (shockwave), Claw combo (3 hits) | 8s, 5s | Dodge / Stun ground |
| 2 | 70–40% | Bolt dive (homing), Chain lightning (2–4 players) | 6s, 10s | Slow / Platforms |
| 3 | 40–0% | Storm DoT zones, Grunts (×2 in 4P) | 12s | Burn amp + Ultimates |

- **Visuals:** Fox-wolf yokai, blue-white crackle fur and horns. Sereisa's aura is bright yellow-white crackling — Thyxis mirrors that palette shifted colder, blue-white becoming blinding full white in Phase 3. Fur shifts from pale blue to blinding white at full storm. Horns arc lightning between them constantly. Eyes electric white-blue, pupils slit like a wolf's. Reads like a natural god — not manufactured, not corrupted. Just something that has always existed and was never meant to be faced.
- **Special:** Chain lightning hits multiple players in 4P — requires spacing
- **Code note:** Phase 3 storm zones are persistent floor patches

---

## Co-op Scaling

| Players | HP Multiplier | Enemy Adds | Boss Behaviour |
|---|---|---|---|
| 1 | ×1.0 | None | Base attacks |
| 2 | ×1.5 | — | — |
| 3 | ×2.0 | Kibad: 2× clones | — |
| 4 | ×2.5 | All bosses: extra adds | Extra fire pools, wall spawns, chain lightning |
