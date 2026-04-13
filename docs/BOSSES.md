# Huntix Boss Design Plan

Four modular bosses for Three.js MVP — shared state machine, low-poly GLTF imports, co-op scaling (+50% HP/player), adds in 4P, and Nioh-inspired phases with telegraphs/juice. Each fight 1.5–3min, post-zone waves.

---

## Shared Tech

- **AI Base:** Finite state — idle → telegraph → action → recover; raycast target nearest player
- **Perf:** 5–10k tris, LOD, 500 particles max, baked AO
- **Juice:** 80ms hitstop, tiered shake, aura ramp, slow-mo kill
- **Rewards:** Boss XP 1500, essence 500 + high-score bonus

---

## Boss 1 — Fire Bruiser
**Zone:** City Breach
**Theme:** Aggressive charger, intro to movement/dodge

| Phase | HP | Attacks | CD | Counter |
|---|---|---|---|---|
| 1 | 100–60% | Flame charge (line dash), Swipe (melee arc) | 7s, 4s | Side dodge |
| 2 | 60–0% | Fire pools (persistent DoT) | 10s | Benzu tank / Jump over pools |

- **Counter hint:** Vesol burn synergy
- **Visuals:** Bulky fiery brute, orange cracks/glow
- **Code note:** Tween charge velocity

---

## Boss 2 — Earth Tank
**Zone:** Ruin Den
**Theme:** Spacing/timing, wall pressure

| Phase | HP | Attacks | CD | Counter |
|---|---|---|---|---|
| 1 | 100–60% | Slam (AoE quake), Arm wall (trap/pushback) | 8s, 6s | Range poke |
| 2 | 60–0% | Rubble spawn (2 grunts in 4P) | 12s | Stun breaks wall / Dabik backstab |

- **Counter hint:** Sereisa slow
- **Visuals:** Cracked stone golem, red-gold pulse
- **Code note:** Physics impulse on slam

---

## Boss 3 — Rogue Dabik
**Zone:** Shadow Core
**Theme:** Teamwork, anti-shadow mirror of hunter

| Phase | HP | Attacks | CD | Counter |
|---|---|---|---|---|
| 1 | 100–60% | Blink slash (tele behind), Dagger combo (4 hits) | 5s, 4s | Predict blink |
| 2 | 60–0% | 2× clones (taunt/decoy), AoE spells | 10s | Surge ult sync |

- **Counter hint:** Benzu shoulder charge
- **Visuals:** Lean shadowy hunter clone, black-purple aura spread
- **Code note:** Clone instances share HP pool

---

## Boss 4 — Raiju
**Zone:** Thunder Spire
**Theme:** Full synergies, aerial climax

| Phase | HP | Attacks | CD | Counter |
|---|---|---|---|---|
| 1 | 100–70% | Ground pound (shockwave), Claw combo (3 hits) | 8s, 5s | Dodge / Stun ground |
| 2 | 70–40% | Bolt dive (homing), Chain lightning (2–4 players) | 6s, 10s | Slow / Platforms |
| 3 | 40–0% | Storm DoT zones, Grunts (×2 in 4P) | 12s | Burn amp + Ultimates |

- **Visuals:** Fox-wolf yokai, blue-white crackle fur/horns
- **Special:** Chain lightning hits multiple players in 4P — requires spacing

---

## Co-op Scaling

| Players | HP Multiplier | Enemy Adds | Boss Behaviour |
|---|---|---|---|
| 1 | ×1.0 | None | Base attacks |
| 2 | ×1.5 | — | — |
| 3 | ×2.0 | Rogue Dabik: 2× clones | — |
| 4 | ×2.5 | All bosses: extra adds | Extra fire pools, wall spawns, chain lightning |
