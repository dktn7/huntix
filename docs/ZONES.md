# Huntix Zone Design

Four combat zones plus the Hunter Hub. All zones are flat 2.5D horizontal arenas rendered on the X/Y plane with parallax background layers for depth.

---

## Zone Architecture

Every zone follows the same structure:
1. **Entry** — player spawns from portal, brief safe moment
2. **Wave 1** — introductory enemy set
3. **Wave 2** — escalation
4. **Wave 3** — pressure peak
5. **Boss** - zone finale
6. **Exit portal** — opens after boss defeated, returns to hub

**Lane dimensions:**
- Width: 40 world units (X axis)
- Height: 10 world units (Y axis, compressed 2.5D)
- Camera: fixed orthographic, zoom adjusts when players spread apart
- Scroll: none — arena is fixed. Camera centres on player group centroid.

---

## Hunter Hub

**Purpose:** Safe area between runs. No combat.

| Element | Details |
|---|---|
| Layout | Wide open space, 4 portal gates visible, shop stall centre-left |
| Tone | Modern arcane safe zone — concrete, rune lighting, hunter agency branding |
| Interactions | Character select, shop, customization, portal entry |
| Parallax | City skyline background, agency signage mid-layer, rune floor foreground |
| Music mood | Low tension, ambient electronic, slightly eerie |

**Portal layout:**
- Portal 1 (left): City Breach — always unlocked
- Portal 2 (centre-left): Ruin Den — unlocked after City Breach cleared
- Portal 3 (centre-right): Shadow Core — unlocked after Ruin Den cleared
- Portal 4 (right): Thunder Spire — unlocked after Shadow Core cleared

---

## Zone 1 — City Breach

**Boss:** VRAEL (Fire Bruiser)
**Theme:** Ruined urban street. Entry zone. Teaches movement and dodging.

| Element | Details |
|---|---|
| Tone | Broken city — cracked asphalt, collapsed building facades, active gate energy |
| Colours | Dark charcoal, orange fire glow, neon fragments, hazy gate light |
| Parallax layers | Background: ruined skyline. Mid: cracked building shells. Foreground: debris piles, broken barriers |
| Hazards | None (MVP) — fire pools added by boss in Stage 2 |
| Enemy intro | Grunts only in Wave 1 — player learns basic combat |
| Lane width | 40 units — open, forgiving |
| Music mood | Urban tension, rising energy, punchy drums |

**Visual notes:**
- Orange/red fire glow dominates right side of screen (gate source)
- Broken streetlights and neon signage as mid-layer props
- Ground: cracked concrete with glowing gate fissures

---

## Zone 2 — Ruin Den

**Boss:** ZARTH (Earth Tank)
**Theme:** Underground utility zone. Tighter, more dangerous. Teaches spacing and item use.

| Element | Details |
|---|---|
| Tone | Collapsed tunnels, industrial ruin, gate energy seeping through cracks |
| Colours | Dark grey, deep brown, faint green gate glow, dust haze |
| Parallax layers | Background: tunnel void. Mid: crumbled support columns, pipe sections. Foreground: rubble mounds |
| Hazards | Narrower effective combat space — rubble columns reduce movement at edges |
| Enemy intro | Ranged units introduced in Wave 1 |
| Lane width | 40 units — but foreground obstacles reduce clear space to ~28 at edges |
| Music mood | Heavy, grinding industrial, building pressure |

**Visual notes:**
- Green/grey tones — oppressive, enclosed feel
- Dust particle layer (ambient, no perf cost — 20 slow-moving sprites)
- Boss slam creates screen shake + rubble particle burst

---

## Zone 3 — Shadow Core

**Boss:** KIBAD (Rogue Angel)
**Theme:** Deep arcane corruption zone. Most dramatic magic. Teaches teamwork and synergies.

| Element | Details |
|---|---|
| Tone | Pure gate energy corruption — space between worlds, shadow and void |
| Colours | Black, deep purple, white energy cracks, faint silver light sources |
| Parallax layers | Background: void with floating debris. Mid: dark crumbling platforms (visual only). Foreground: shadow tendrils |
| Hazards | Shadow pools (visual only in MVP) |
| Enemy intro | Bruisers introduced in Wave 1 |
| Lane width | 40 units — visually tighter due to parallax density |
| Music mood | Dark, cinematic, electronic with arcane tones |

**Visual notes:**
- Most visually dramatic zone
- Aura effects intensify — player auras glow brighter against the dark world
- Boss (Kibad) enters with a blinding white-gold radiance that temporarily overwhelms the dark scene — stark contrast against the void

---

## Zone 4 — Thunder Spire

**Boss:** THYXIS (Thunder Beast)
**Theme:** Elevated storm zone. Final zone. Full hunter synergies required.

| Element | Details |
|---|---|
| Tone | Storm-struck tower peak — wind, lightning, gate energy at its most raw |
| Colours | Dark navy, electric blue, white lightning, storm grey |
| Parallax layers | Background: storm clouds and lightning flashes. Mid: crumbling tower sections. Foreground: wind-blown debris |
| Hazards | Storm DoT zones in boss Stage 3 (floor lightning patches) |
| Enemy intro | High ranged unit density — spacing critical |
| Lane width | 40 units |
| Music mood | Climactic, fast electronic, intense percussion, arcane crescendo |

**Visual notes:**
- Lightning flash events (random ambient, every 8–15s) — quick full-scene brightness spike
- Blue/white colour palette — clean contrast for final boss readability
- Boss Thyxis fur crackles with active lightning — most visually complex enemy in game. Shifts from pale blue to blinding white in Stage 3.

---

## Zone Transition Flow

```
Hub → Portal entry → Zone title flash (0.2s) → Wave 1 starts
→ Wave 2 → Wave 3 → Boss intro cutscene (skip-able) → Boss fight
→ Boss defeated → Essence magnet → Exit portal opens → Hub
```

**Transition tech:**
- No loading screen — scene swap in <1 frame using Three.js SceneManager
- Zone title: CSS overlay, fades in/out over 200ms
- Portal entry/exit: glowing ring effect, player scale-to-zero then scale-from-zero in new scene

---

## Parallax System

Each zone has 3 depth layers rendered as flat planes at different Z positions:

| Layer | Z position | Scroll speed | Content |
|---|---|---|---|
| Background | -20 | 0.05× camera X | Skyline / void / storm clouds |
| Midground | -8 | 0.3× camera X | Buildings / columns / tower sections |
| Foreground | -1 | 0.8× camera X | Debris / tendrils / barriers |

Camera tracks player group centroid. Parallax layers move at fractional rates to simulate depth.

