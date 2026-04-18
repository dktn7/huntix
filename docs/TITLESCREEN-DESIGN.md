# HUNTIX — Title Screen & Hunter Select Design Spec

> **Canonical reference for building the Title Screen and Hunter Select Screen.**
> Read this before writing any code. Do not source design decisions from conversation history.
> Cross-reference: `docs/TITLESCREEN.md` (flow/layout), `docs/VISUAL-REFERENCE.md` (hunter colours), `docs/HUNTERS.md` (stats/quotes), `docs/AUDIO.md` (sound).

*Last updated April 18, 2026*

---

## 1. Fonts

### Load via Google Fonts (CDN — no npm)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
```

### Usage Rules

| Role | Font | Weight | Size | Where |
|---|---|---|---|---|
| Logo / HUNTIX wordmark | Rajdhani | 700 Bold | `clamp(3.5rem, 8vw, 7rem)` | Title screen logo only |
| Screen title (e.g. SELECT YOUR HUNTER) | Rajdhani | 600 SemiBold | `clamp(1.2rem, 2.5vw, 1.8rem)` | Hunter Select heading |
| Hunter name on card | Rajdhani | 700 Bold | `1.3rem` | Hunter cards |
| Hunter title (e.g. Shadow Striker) | Inter | 500 Medium | `0.8rem` | Hunter cards, uppercase tracked |
| Menu items (Play, Co-op, Settings) | Inter | 500 Medium | `1.1rem` | Title menu |
| Stat labels | Inter | 400 Regular | `0.72rem` | Hunter cards |
| Flavour quote | Inter | 300 Light Italic | `0.75rem` | Bottom of hunter card |
| Element / Status badge | Inter | 500 Medium | `0.7rem` | Hunter cards, uppercase |

**Never use system fonts as the primary face.** Rajdhani carries the game identity. Inter handles all readable UI text.

---

## 2. Colour Tokens

```css
:root {
  /* Base surfaces */
  --color-void:         #08080f;   /* Screen background — near-black with blue tint */
  --color-surface-card: #10101a;   /* Hunter card background */
  --color-surface-card-hover: #16162a; /* Card hover lift */
  --color-border-faint: #1e1c2e;   /* Faint card border, dividers */
  --color-border-hover: #2e2a4a;   /* Unselected card hover border */

  /* Text */
  --color-text-primary:  #f0f0f5;  /* Main text, menu items */
  --color-text-muted:    #8a8aa0;  /* Secondary labels, stat text */
  --color-text-faint:    #5a5870;  /* Flavour quotes, tertiary */
  --color-text-inverse:  #08080f;  /* Text on bright aura backgrounds */

  /* Gate rift / background energy */
  --color-gate-core:    #6600cc;   /* Rift centre glow */
  --color-gate-edge:    #220044;   /* Rift outer fade */
  --color-gate-crack:   #aa44ff;   /* Rift crack lines */

  /* Hunter aura colours — canonical from VISUAL-REFERENCE.md */
  --aura-dabik:         #9b59b6;   /* Deep purple */
  --aura-dabik-dark:    #3d1560;   /* Glow shadow */
  --aura-benzu:         #e67e22;   /* Red-gold ember */
  --aura-benzu-dark:    #7a2e00;   /* Glow shadow */
  --aura-sereisa:       #f1c40f;   /* Bright yellow */
  --aura-sereisa-dark:  #7a5e00;   /* Glow shadow */
  --aura-vesol:         #2980b9;   /* Cold blue */
  --aura-vesol-dark:    #0d3a5c;   /* Glow shadow, bleeds to crimson */
  --aura-vesol-hot:     #e74c3c;   /* Crimson surge state */

  /* UI accents */
  --color-confirm:      #4a9eff;   /* Confirm button, active highlight */
  --color-confirm-glow: #1a4a7a;   /* Confirm glow */

  /* Stat bar colours */
  --color-stat-track:   #1e1c2e;   /* Empty bar track */
  --color-stat-hp:      #e74c3c;   /* Health red */
  --color-stat-speed:   #f1c40f;   /* Speed yellow */
  --color-stat-damage:  #e67e22;   /* Damage orange */
  --color-stat-defense: #3498db;   /* Defense blue */
}
```

---

## 3. Title Screen Layout

```
┌───────────────────────────────────────────────────────────┐
│  [gate crack — vertical rift, upper-centre, glowing]       │
│                                                           │
│                  H U N T I X                             │
│              [aura pulse — 4s colour cycle]               │
│                                                           │
│                    [tagline]                              │
│             Hunt. Enter. Survive.                         │
│                                                           │
│              ▶  Play                                       │
│              👥  Co-op                                      │
│              ⚙  Settings                                   │
│              📖  Credits                                     │
│                                                           │
│  [Dabik] [Benzu]         [Sereisa] [Vesol]                │
│  — silhouettes, auras glowing, spread across bottom 35% —  │
└───────────────────────────────────────────────────────────┘
```

- Background: `--color-void` base, gate crack in upper-centre third
- Logo sits in upper-centre at 30% down from top
- Tagline `Hunt. Enter. Survive.` in `--color-text-muted`, Inter 300, letter-spaced, sits beneath logo
- Menu items centred below tagline, `--color-text-primary`, Inter 500
- Hunter silhouettes sit bottom 35% — dark shapes, only aura colours visible
- No decorative borders, no UI chrome — pure negative space around menu

---

## 4. Visual Effects — Title Screen

### 4.1 Gate Rift (Canvas / CSS)

A vertical glowing crack sits behind the logo in the upper background:

```
Implementation: CSS + SVG filter or Canvas 2D layer beneath Three.js scene.
— Thin vertical line, centre-screen, height 40% of viewport
— Colour: --color-gate-crack (#aa44ff) core, bleeds to --color-gate-edge
— filter: blur(1px) on crack body, blur(12px) on outer glow layer
— Animation: slow pulse (scale X 0.8→1.2, opacity 0.6→1.0), 3s ease-in-out loop
— Random energy tendrils: short forking lines off main crack, opacity 0.3→0, 1.5–4s random intervals
```

### 4.2 Logo Aura Pulse

The HUNTIX wordmark pulses through all 4 hunter aura colours in a 4-second cycle:

```
Sequence (each 1s, crossfade 0.3s):
  1. --aura-dabik   (#9b59b6) — deep purple
  2. --aura-benzu   (#e67e22) — red-gold
  3. --aura-sereisa (#f1c40f) — bright yellow
  4. --aura-vesol   (#2980b9) — cold blue

Apply as: text-shadow + drop-shadow filter on the logo element
Not a colour change — the wordmark stays white/light, only the glow cycles
Loop seamlessly. Never flash — smooth CSS transition between colours.

CSS:
@keyframes auraCycle {
  0%   { filter: drop-shadow(0 0 18px var(--aura-dabik)) drop-shadow(0 0 40px var(--aura-dabik-dark)); }
  25%  { filter: drop-shadow(0 0 18px var(--aura-benzu)) drop-shadow(0 0 40px var(--aura-benzu-dark)); }
  50%  { filter: drop-shadow(0 0 18px var(--aura-sereisa)) drop-shadow(0 0 40px var(--aura-sereisa-dark)); }
  75%  { filter: drop-shadow(0 0 18px var(--aura-vesol)) drop-shadow(0 0 40px var(--aura-vesol-dark)); }
  100% { filter: drop-shadow(0 0 18px var(--aura-dabik)) drop-shadow(0 0 40px var(--aura-dabik-dark)); }
}
.logo { animation: auraCycle 4s ease-in-out infinite; }
```

### 4.3 Hunter Silhouettes

Until real sprites arrive (Phase 7), silhouettes are CSS-shaped divs:

```
— Each hunter: a dark shape (--color-void tinted slightly lighter)
— Aura glow: radial-gradient from hunter aura colour at feet, fading upward
— Slow idle float: translateY -6px → 0 → -6px, 3–4s ease-in-out, offset per hunter
— When sprites available (Phase 7): swap divs for sprite renders directly
```

### 4.4 Particle Drift

Subtle floating particles in background — implemented in Canvas or Three.js:

```
— 30–50 particles max (never exceed 500 particle cap rule)
— Small glowing dots, 1–3px, random aura colours at 0.2–0.4 opacity
— Drift upward slowly, random X drift, fade out at top
— Spawn from bottom, loop continuously
— Feels like gate energy leaking into the space
```

### 4.5 Menu Item Hover

```
— Selected item: colour shifts from --color-text-muted to --color-text-primary
— Small > chevron slides in from left on hover (translateX -8px → 0, 150ms)
— Faint text-shadow glow in --color-gate-crack on active item
— Keyboard: arrow keys navigate, Enter confirms
— transition: all 150ms ease
```

---

## 5. Audio — Title Screen

All audio per `docs/AUDIO.md`. Title screen implementation:

### 5.1 Music

```
Track: assets/audio/music/title-theme.mp3
Behaviour:
— Starts playing on first user interaction (browser autoplay policy)
— Fade in: 2s from silence to full volume
— Loop: seamless
— Mood: atmospheric, minimal — gate energy drone + low rumble building over 30s
— On Play/Co-op selected: fade out over 1.5s, hub ambient fades in on Hub scene load
— Volume: respects master volume + music volume settings

Implementation:
const titleMusic = new Audio('assets/audio/music/title-theme.mp3');
titleMusic.loop = true;
titleMusic.volume = 0;
document.addEventListener('click', () => {
  titleMusic.play();
  // fade in
}, { once: true });
```

### 5.2 UI SFX

```
All SFX via Howler.js (CDN) or Web Audio API — per docs/AUDIO.md.

Events:
— Menu navigate (up/down): assets/audio/sfx/ui-navigate.mp3 — soft click, short
— Menu confirm (Enter/click): assets/audio/sfx/ui-confirm.mp3 — clean positive tone
— Menu back: assets/audio/sfx/ui-back.mp3 — soft negative
— Hunter hover (Hunter Select): assets/audio/sfx/hunter-hover.mp3 — short aura whoosh
— Hunter confirm: assets/audio/sfx/hunter-confirm.mp3 — aura burst + confirm tone

Placeholder: if audio files not yet in assets/, implement silent fallback.
Do not throw errors for missing audio — wrap all audio calls in try/catch.
```

### 5.3 Placeholder Audio Sources

Until custom audio is generated, use free CC0 sources:

```
Freesound.org or Pixabay — search:
— Title music: "dark ambient drone" or "portal hum loop"
— UI click: "ui click soft"
— UI confirm: "ui confirm chime"
— Hunter hover: "whoosh short"
Export all as MP3, 44.1kHz, stereo.
Save to assets/audio/sfx/ and assets/audio/music/
```

---

## 6. Hunter Select Screen Layout

```
┌───────────────────────────────────────────────────────────┐
│           S E L E C T   Y O U R   H U N T E R           │
│                                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  DABIK  │ │  BENZU  │ │ SEREISA │ │  VESOL  │           │
│  │ [art]  │ │ [art]  │ │ [art]  │ │ [art]  │           │
│  │        │ │        │ │        │ │        │           │
│  │ Shadow │ │  Iron  │ │ Storm  │ │ Ember  │           │
│  │Striker │ │Breaker │ │Chaser  │ │ Mage   │           │
│  │ HP ██░ │ │ HP ███ │ │ HP ██░ │ │ HP ██░ │           │
│  │SPD ███ │ │SPD █░░ │ │SPD ███ │ │SPD ██░ │           │
│  │DMG █░░ │ │DMG ███ │ │DMG ██░ │ │DMG ██░ │           │
│  │DEF ░░░ │ │DEF ███ │ │DEF █░░ │ │DEF ░░░ │           │
│  │"quote" │ │"quote" │ │"quote" │ │"quote" │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                          │
│              [ ENTER THE GATE ]                          │
└───────────────────────────────────────────────────────────┘
```

---

## 7. Hunter Card Spec

### Card Dimensions
- Width: `min(220px, 22vw)` per card, `gap: clamp(12px, 2vw, 24px)`
- Art area: `160px` height (coloured gradient placeholder until Phase 7 sprites)
- Border-radius: `8px`
- Padding: `16px`

### Card States

| State | Border | Background | Shadow | Scale |
|---|---|---|---|---|
| Default | `1px solid var(--color-border-faint)` | `--color-surface-card` | none | `1.0` |
| Hover | `1px solid var(--color-border-hover)` | `--color-surface-card-hover` | `0 4px 24px [aura-dark] 0.4` | `1.02` |
| Selected | `2px solid [hunter-aura]` | `--color-surface-card-hover` | `0 0 32px [hunter-aura] 0.5` | `1.04` |

### Art Placeholder (until Phase 7)

```css
.hunter-art-dabik    { background: linear-gradient(180deg, #1a0a2e 0%, #3d1560 60%, #08080f 100%); }
.hunter-art-benzu    { background: linear-gradient(180deg, #2e0a00 0%, #7a2e00 60%, #08080f 100%); }
.hunter-art-sereisa  { background: linear-gradient(180deg, #2e2000 0%, #7a5e00 60%, #08080f 100%); }
.hunter-art-vesol    { background: linear-gradient(180deg, #001a2e 0%, #0d3a5c 60%, #08080f 100%); }
```

Swap for real sprite render in Phase 10 when `AnimationController` is live.

### Stat Bar Data (from HUNTERS.md — canonical)

| Hunter | HP | Speed | Damage | Defense |
|---|---|---|---|---|
| Dabik | 3/10 | 9/10 | 6/10 | 3/10 |
| Benzu | 10/10 | 4/10 | 10/10 | 9/10 |
| Sereisa | 6/10 | 8/10 | 7/10 | 5/10 |
| Vesol | 5/10 | 6/10 | 8/10 | 4/10 |

### Flavour Quotes (from HUNTERS.md — canonical)

| Hunter | Quote |
|---|---|
| Dabik | *“Silence is the last thing you hear.”* |
| Benzu | *“I don’t dodge. I don’t need to.”* |
| Sereisa | *“You blinked. That’s why you lost.”* |
| Vesol | *“The gate burns. So does everything in it.”* |

### Additional Card Info

| Field | Value source |
|---|---|
| Element | `docs/HUNTERS.md` — Shadow / Thunder-Earth / Lightning / Flame |
| Status effect | `docs/HUNTERS.md` — Bleed / Stun / Slow / Burn |
| Dodge name | `docs/HUNTERS.md` — Blink / Shoulder Charge / Electric Dash / Flame Scatter |
| Starting spell | `docs/HUNTERS.md` — Shadow Step / Shield Bash / Electric Dart / Flame Bolt |

---

## 8. Hunter Select Effects

### Card Hover
```
— Card scales to 1.02, border lifts to --color-border-hover
— Aura glow begins: box-shadow in hunter aura colour, 0.3s ease
— Play hunter-hover.mp3 SFX (see Section 5.2)
— Background tints very subtly toward hunter aura colour:
  background: linear-gradient(to bottom, [aura-dark 8%], --color-surface-card)
```

### Card Selected
```
— Card scales to 1.04, border becomes 2px solid [hunter-aura]
— Strong aura glow: box-shadow 0 0 32px [hunter-aura] 0.5
— Screen background tints subtly toward selected hunter aura colour
— Play hunter-confirm.mp3 SFX
— Aura particle burst: 12–16 particles emit from card, aura colour, fade out over 0.6s
— Confirm button text shifts to hunter aura colour
```

### Confirm Button
```
— Font: Rajdhani 700, 1.1rem, letter-spacing 0.2em, uppercase
— Default: --color-text-muted border + text, transparent bg
— Active (hunter selected): fills with selected hunter aura colour
— Hover: slight scale 1.03, glow in aura colour
— On click: short flash + play ui-confirm.mp3, then transition to Hub scene
```

---

## 9. Screen Transitions

```
Title → Hunter Select:
— Fade out: title screen opacity 1 → 0 over 400ms
— Hunter silhouettes scale up briefly (1.0 → 1.05) then fade
— Hunter Select fades in: opacity 0 → 1 over 300ms
— Gate rift crack pulses once brightly on transition

Hunter Select → Hub scene (after confirm):
— Selected hunter card expands full screen (scale 1.04 → full viewport, 400ms)
— Screen flashes white briefly (1 frame)
— SceneManager.transition('hub') fires
— Hub scene fades in over 500ms

Back navigation (Hunter Select → Title):
— Fade out Hunter Select over 300ms
— Title screen fades back in over 300ms
— Title music resumes if it was faded
```

---

## 10. Implementation Notes for Roo Code / Agents

### Files to Create

```
src/screens/TitleScreen.js       — Title screen class, menu, effects, audio
src/screens/HunterSelectScreen.js — Hunter select class, cards, co-op support
assets/audio/sfx/                — Create folder, add placeholder audio files
assets/audio/music/              — Create folder, add placeholder title-theme.mp3
```

### Integration Points

```
— SceneManager.js: register 'title' and 'hunterSelect' scenes
— main.js: boot into TitleScreen on load
— InputManager.js: route arrow keys + Enter to active screen
— RunState.js: store selected hunter(s) after confirm
```

### Hard Rules (from AGENTS.md)

```
— Widget must stay in index.html: <script async src="https://vibej.am/2026/widget.js"></script>
— No npm, no Vite — all fonts via Google Fonts CDN link in index.html
— Howler.js via CDN if used: https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js
— All audio gated behind user interaction (browser autoplay policy)
— Wrap all audio calls in try/catch — never throw for missing audio files
— No loading screens — title screen renders on first frame
— localStorage allowed for last-selected hunter memory (per TITLESCREEN.md)
— No 3D models, no GLTF, no AnimationMixer
```

### Phase 7 Handoff

When real hunter sprites are available (Phase 7), replace art placeholders:
```
— .hunter-art-[name] gradient → Three.js sprite render of hunter idle frame
— Silhouettes on title screen → real idle sprite renders at reduced opacity
— No other changes needed to screen logic
```

---

## 11. Responsive Behaviour

```
Desktop (1280px+): 4 cards in a row, full layout as above
Tablet (768–1279px): 4 cards in a row, reduced padding
Mobile (< 768px): 2×2 card grid, smaller art area, stacked confirm button

Font sizes use clamp() — scale gracefully across all breakpoints.
Touch targets: all interactive elements minimum 44×44px.
```
