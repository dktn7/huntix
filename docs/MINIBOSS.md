# HUNTIX — Miniboss Design

> A spike of intensity between waves and the boss. Surprising, punchy, memorable.

*Last updated April 15, 2026*

---

## Overview

Two minibosses appear in the first two zones — one per zone, after all waves are cleared, before the portal to the hub unlocks. They are not previews of the zone boss. They are their own entities with their own identity — but the skills they demand from the player directly prepare for the boss fight that follows.

| Zone | Miniboss | Prepares for |
|------|----------|--------------|
| City Breach | The Stampede | VRAEL — dodge charges, read fire on the floor |
| Ruin Den | The Tomb Crawler | ZARTH — spacing, ground awareness, positional discipline |

> Thunder Spire and Shadow Core have no minibosses. Their Wave 3 enemy compositions are harder and serve the same pacing function.

---

## Miniboss Rules (Shared)

| Rule | Value |
|------|-------|
| Token system | Exempt — attacks on own schedule |
| Max on screen | 1 at a time — never paired |
| Entry | Enters from off-screen after wave clear banner |
| Music | Tempo stinger — intensity shift, no full track swap |
| HP bar | Dedicated bar appears top-centre, replaces wave counter |
| Arena boundary | Hard boundary — cannot be kited off screen |
| Phase shift | One transition at 50% HP — brief slow-mo + visual change |
| Essence drop | 150–250 on death |
| XP | 800 per player |
| Name card | Appears on entry — name + one line of flavour text (2.0s, then fades) |
| Solo-proof | All mechanics work in 1-player. No grab, no teammate-break, no shared mechanic. |

---

## Miniboss Entry Sequence

```
Wave 3 cleared
  → "Wave Complete" banner
  → 0.8s pause
  → Music stinger
  → Miniboss enters from off-screen edge
  → HP bar fades in top-centre
  → Name card appears:
       [NAME]
       [One line of flavour text]
     Fades after 2.0s
  → Combat begins
```

---

## Miniboss Death Sequence

```
HP reaches 0
  → Final hit plays to completion (hitstop 200ms)
  → Miniboss staggers back 1.0 unit
  → Collapse animation (0.8s)
  → Large death burst — 30 particles, gate energy colour
  → Essence orbs drop (150–250)
  → HP bar fades out
  → 1.5s pause
  → Hub portal unlocks
```

---

## Miniboss 1 — The Stampede

**Zone:** City Breach  
**Name card flavour:** *"The gate opened. It ran. It has not stopped."*

### Identity

A massive corrupted bull-like gate creature that has been rampaging through the city since the gate opened. Not intelligent — purely instinctual. It charges everything. It crashes into walls. It does not stop.

Visually: quadrupedal, low-slung, dense — built entirely for impact. Gate energy cracks run along its spine and horns, glowing deep orange. Phase 1 the glow is dull and contained. Phase 2 the cracks split open and the body catches fire.

| Stat | Value |
|------|-------|
| HP | 550 (solo) / ×1.5 per additional player |
| Move speed | 4.0 units/s (walking) / 18.0 units/s (charge) |
| Stagger | Yes (Phase 1, heavy attack only) / No (Phase 2) |
| Attack damage | 20–35 |

---

### Phase 1 (100–50% HP)

**Attack 1 — Charge**

| Stage | Duration | Detail |
|-------|----------|--------|
| Telegraph | 1.2s | Lowers head. Scrapes ground with front hoof twice. Camera shake 0.05 units. |
| Active | 0.5s | Full arena-width dash at 18 units/s. 30 damage on contact. |
| Wall impact | 0.4s | Crashes into far wall. Staggers. Wall cracks visually. Debris falls. |
| Recovery | 0.8s | Dazed — moves slowly, fully vulnerable. Best punish window. |
| Dodge counter | Dodge perpendicular — left or right. Charge passes through. |

**Attack 2 — Stomp**

| Stage | Duration | Detail |
|-------|----------|--------|
| Telegraph | 0.7s | Rears up on hind legs. Shadow grows beneath front hooves. |
| Active | 0.2s | Front hooves slam down. 2.0 unit radius AoE at impact point. 20 damage. |
| Recovery | 0.5s | Resets to stance. |
| Dodge counter | Dodge away from shadow indicator on ground. |

**Attack 3 — Sweep**

| Stage | Duration | Detail |
|-------|----------|--------|
| Telegraph | 0.5s | Head swings wide to one side. |
| Active | 0.3s | Horizontal horn sweep, 180° arc, 2.5 unit radius. 25 damage. |
| Recovery | 0.4s | |
| Dodge counter | Jump over (arc is horizontal) or back-dodge outside radius. |

---

### Phase 2 (50–0% HP)

**Transition:**
- Slow-mo 0.3s at 20% game speed
- The Stampede rears up — full roar animation (0.6s)
- Cracks along spine split open — body ignites
- Screen shake 0.20 units / 400ms
- Aura shifts from dull orange → full fire, constant flame particles rising from body
- Stagger immunity activates — cannot be staggered for rest of fight

**Attack 1 — Charge (modified)**  
- Now leaves a **burning trail** on the floor where it ran
- Trail persists for 4.0s — applies Burn debuff (4 DPS, 5s) on contact
- Trail width: 1.0 unit
- Forces players to read the floor and avoid standing where the charge just passed
- *This is the mechanic that prepares for VRAEL's fire pools*

**Attack 2 — Stomp (modified)**  
- Now erupts a **ring of fire** outward from impact point instead of just AoE
- Ring travels 2.0 units outward over 0.5s — jump or dodge before it reaches you
- 15 damage on ring contact

**Attack 3 — Sweep (modified)**  
- Unchanged mechanically — but now the horns are on fire
- Contact applies Burn debuff in addition to damage

**Iconic moment — Wall Break:**  
Once during Phase 2 (scripted, triggers between 45–35% HP), The Stampede charges through the arena boundary wall:
- Extended charge — travels off-screen, crashes through far wall
- Camera shakes hard (0.35 units / 600ms)
- Rubble falls across the arena (visual only — no damage)
- The Stampede re-enters from the newly broken wall 1.0s later
- The wall crack remains for the rest of the fight — environmental storytelling

---

## Miniboss 2 — The Tomb Crawler

**Zone:** Ruin Den  
**Name card flavour:** *"It was here long before the ruins. The ruins grew around it."*

### Identity

A massive stone centipede-like creature that lives inside the walls and floor of the ruins. It does not walk on the surface — it bursts through it, attacks, then dives back in. The arena IS its body. You are fighting the floor.

Visually: segmented stone body, 6–8 visible segments when surfaced, each segment fused with dungeon rock. Deep red gate energy pulses through the joints between segments. Head segment has no eyes — just a wide split maw lined with irregular stone teeth. Phase 2 the joints crack fully open, gate energy blazes between segments.

| Stat | Value |
|------|-------|
| HP | 650 (solo) / ×1.5 per additional player |
| Move speed | Irrelevant — moves underground |
| Stagger | Cannot be staggered — only vulnerable during surface windows |
| Attack damage | 20–40 |

---

### Core Mechanic — Emergence

The Tomb Crawler spends most of the fight underground. It surfaces to attack, then dives back down.

**Underground state:**
- Invisible. No target.
- Ground rumbles — camera micro-shake 0.03 units, continuous
- 1–3 ground crack indicators appear (red fissures on floor)
- Each crack indicator shows where it *might* emerge — only one is real
- Players read the cracks and reposition

**Emergence:**
- After 1.5s of crack indicators — one crack erupts
- Head and front 3 segments burst from ground
- Attacks during surface window (1.5–3.0s)
- Dives back underground after attack completes
- New crack indicators appear 0.8s after dive

> This cycle is the entire fight. The fun is reading fake-out cracks, repositioning, and punishing the surface window hard.

---

### Phase 1 (100–50% HP)

**Attack 1 — Surface Bite**

| Stage | Duration | Detail |
|-------|----------|--------|
| Emergence | 0.3s | Bursts from ground. |
| Telegraph | 0.4s | Maw opens wide. Visible wind-up. |
| Active | 0.3s | Lunges forward 2.0 units. 35 damage on contact. |
| Surface window | 1.0s | Retracting — vulnerable, take full damage. |
| Dive | 0.4s | Disappears underground. |
| Dodge counter | Dodge sideways during lunge. |

**Attack 2 — Tail Whip**

| Stage | Duration | Detail |
|-------|----------|--------|
| Emergence | 0.3s | Tail end erupts instead of head — surprise side. |
| Active | 0.4s | Tail sweeps 180° arc, 3.0 unit radius. 20 damage. |
| Surface window | 0.8s | Brief — smaller punish window than Surface Bite. |
| Dive | 0.3s | |
| Tell | Crack indicator is at the arena edge, not centre — distinguishes from Bite. |
| Dodge counter | Jump or dodge inward (away from arena edge). |

---

### Phase 2 (50–0% HP)

**Transition:**
- Slow-mo 0.3s
- Full body erupts from floor — all 8 segments visible simultaneously
- Roar — gate energy blazes between every joint
- Screen shake 0.25 units / 500ms
- Slams back underground hard — impact cracks the entire floor visually
- Crack pattern on floor remains for rest of fight

**Phase 2 changes:**

- **Multiple crack indicators:** Now shows 2–4 crack indicators simultaneously instead of 1–3. More noise, harder to read.
- **Faster cycle:** Underground time reduced from 1.5s to 1.0s — less reaction time
- **Segment slam:** New attack — after Surface Bite, doesn't fully retreat. Slams 2 body segments down on the surface one at a time (0.4s apart). Each segment is a 1.5 unit radius AoE, 20 damage. Must dodge or jump twice after the bite, not once.
- **Iconic moment — Full Surface:** Once during Phase 2 (scripted, triggers at ~30% HP), the entire body erupts and coils across the arena surface for 3.0s. The full length of the creature is visible — massive scale reveal. During this window it sweeps the arena with its body (horizontal sweep, 1.5s warning, jump to survive). Then dives back in. No other full-surface moment in the fight — makes it feel earned and memorable.

---

## Skill Transfer Summary

| Miniboss | Skill taught | Boss that tests it |
|----------|-------------|--------------------|
| The Stampede — Charge | Dodge lateral fast movement | VRAEL — Flame Charge |
| The Stampede — Burning trail | Read and avoid floor hazards | VRAEL — Fire Pools (Phase 2) |
| The Tomb Crawler — Emergence | Read floor indicators, reposition fast | ZARTH — Ground Slam telegraphs |
| The Tomb Crawler — Multiple cracks | Spatial awareness under pressure | ZARTH — Rubble spawns + wall pressure |

---

## Related Docs

| System | Doc |
|--------|-----|
| Full boss designs | [BOSSES.md](./BOSSES.md) |
| Enemy base types | [ENEMIES.md](./ENEMIES.md) |
| Debuffs applied (Burn) | [DEBUFFS.md](./DEBUFFS.md) |
| Zone layouts | [ZONES.md](./ZONES.md) |
| Run state on miniboss death | [RUNSTATE.md](./RUNSTATE.md) |
