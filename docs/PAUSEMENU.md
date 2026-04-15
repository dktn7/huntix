# HUNTIX — Pause Menu & Settings

> *The world stops. You decide what comes next.*

*Last updated April 15, 2026*

---

## Overview

The pause menu is accessible during any non-combat moment. In co-op, full pause is restricted to between waves and in the hub — during active combat a minimal overlay is available instead. Settings are accessible from both the pause menu and the title screen — same panel, same spec.

---

## Pause Trigger

| Context | Trigger | Result |
|---|---|---|
| Solo — any moment | Escape | Full pause — game freezes |
| Co-op — in hub | Escape (any player) | Full pause for all |
| Co-op — between waves | Escape (any player) | Full pause for all |
| Co-op — active combat | Escape | Minimal overlay only — game does NOT freeze |

**Minimal overlay (co-op combat only):**
- Semi-transparent panel, does not obscure gameplay
- Contains only: Resume, Settings (audio/display only), Quit to Title
- No run stats, no keybinds — those require full pause

---

## Full Pause Menu Layout

```
╔══════════════════════════════════════════════════════════╗
║                        PAUSED                            ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║   ▶  Resume                                             ║
║   📊  Run Stats          → side panel slides in          ║
║   ⚙️  Settings           → settings panel opens          ║
║   ✖️  Abandon Run        → confirm prompt                 ║
║   🏠  Quit to Title      → confirm prompt                 ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  CONTROLS  (current bindings — updates with rebinds)     ║
║                                                          ║
║  Move          WASD        Light Attack    J             ║
║  Jump          Space       Heavy Attack    K             ║
║  Dodge         L-Shift     Minor Spell     E (tap)       ║
║  Pause         Escape      Advanced Spell  E (hold)      ║
║                            Ultimate        Q             ║
║                                                          ║
║  [Gamepad icons shown alongside keyboard bindings]       ║
╚══════════════════════════════════════════════════════════╝
```

### Menu Item Behaviour

| Item | Behaviour |
|---|---|
| Resume | Closes pause menu, resumes game immediately |
| Run Stats | Slides in a side panel (does not navigate away from pause menu) |
| Settings | Opens settings panel as an overlay on top of pause menu |
| Abandon Run | Confirm prompt: "End this run? All progress this run will be lost." Yes / No |
| Quit to Title | Confirm prompt: "Quit to title? Current run will be lost." Yes / No |

**Abandon Run vs Quit to Title:**
- Abandon Run — ends the run, returns to title screen, resets RunState. Use when you want to start over.
- Quit to Title — same effect in MVP (no persistent save). Labelled differently for clarity and future-proofing.

---

## Run Stats Side Panel

Slides in from the right when Run Stats is selected. Pause menu remains visible on the left.

| Stat | Detail |
|---|---|
| Zone | Current zone name + zone number |
| Wave | Current wave number within zone |
| Essence collected | Total Essence earned this run |
| Essence held | Current Essence in wallet |
| Highest combo | Peak combo count hit this run |
| Enemies killed | Total enemy kill count |
| Damage dealt | Total damage output this run |
| Damage taken | Total damage received this run |
| Deaths | Number of times downed (solo) |
| Revives | Number of times revived (co-op) |
| Time elapsed | Run clock — hours:minutes:seconds |

All stats update in real time — opening Run Stats mid-run shows current values.

---

## Controls Display

Always visible at the bottom of the pause menu. Not a separate screen — embedded in the pause layout.

- Shows **current bindings**, not hardcoded defaults
- If a key has been rebound, the new key is shown here
- Keyboard bindings shown left column, gamepad icons shown right column
- Gamepad icons adapt to detected controller type (Xbox layout / PS layout)
- If no gamepad detected, gamepad column is hidden

---

## Settings Panel

Accessible from pause menu and from title screen. Identical spec in both contexts.

### 🔊 Audio

| Setting | Type | Detail |
|---|---|---|
| Master volume | Slider 0–100 | Controls all audio output |
| Music volume | Slider 0–100 | Background music only |
| SFX volume | Slider 0–100 | Hit sounds, spells, UI sounds |
| Mono audio | Toggle | Collapses stereo to mono — accessibility |
| Visual audio cues | Toggle | Screen flash / icon on important audio events (boss telegraph, wave start, level-up) |

---

### 🖥️ Display

| Setting | Type | Detail |
|---|---|---|
| Brightness | Slider 0–100 | Adjusts overall scene brightness. Default: 50. |
| Contrast | Slider 0–100 | Adjusts scene contrast. Default: 50. |
| Colourblind mode | Dropdown | Off / Deuteranopia / Protanopia / Tritanopia. Shifts status effect colours, aura colours, and HUD indicators to colourblind-safe palette. |
| High contrast mode | Toggle | Thicker enemy outlines, stronger telegraph colour contrast, bolder HUD elements. |
| Reduce particle effects | Toggle | Caps particles at 100 instead of 500. Reduces visual noise for photosensitivity or performance. |
| Reduce screen shake | Toggle | Reduces all screen shake values by 70%. Does not remove shake entirely — preserves game feel at low intensity. |
| UI scale | Slider 75%–150% | Scales all HUD elements and menus. Default: 100%. |

---

### ♿ Accessibility

| Setting | Type | Detail |
|---|---|---|
| Screen reader | Toggle | Reads all menu items, card names, card descriptions, tooltips, and stat values aloud using Web Speech API (browser native). Activates on focus/hover. |
| Auto-pickup Essence | Toggle | Essence orbs auto-collect within 3 world units. Default: off (walk-over required). |
| Toggle vs Hold inputs | Toggle | Changes dodge and spell inputs from hold-to-activate to toggle. E.g. Tap E to activate Advanced Spell rather than hold E. |
| Slow co-op card timer | Toggle | Extends co-op level-up card screen timer from 15s to 30s. |
| Visual audio cues | Toggle | Duplicated here from Audio for discoverability. Same toggle. |
| One-handed preset | Button | Applies a preset keybind layout optimised for one-handed play. Confirm prompt before applying. |

---

### ⌨️ Keybinds

| Setting | Type | Detail |
|---|---|---|
| Keyboard bindings | Rebind per action | Click any action to rebind. Press new key to assign. |
| Conflict warning | Auto | If new key is already bound to another action: "[Key] is already bound to [Action] — reassign?" Yes replaces old binding. No cancels. |
| Gamepad bindings | Rebind per action | Separate from keyboard. Rebind gamepad buttons independently. |
| Reset to default | Button | Single confirm tap — resets ALL bindings (keyboard and gamepad) to defaults. |

**Default keyboard bindings:**

| Action | Default Key |
|---|---|
| Move | WASD |
| Jump | Space |
| Dodge | L-Shift |
| Light Attack | J |
| Heavy Attack | K |
| Minor Spell | E (tap) |
| Advanced Spell | E (hold) |
| Ultimate | Q |
| Pause | Escape |

---

### 🎮 Gamepad

| Setting | Type | Detail |
|---|---|---|
| Vibration | Toggle | Enables/disables controller rumble. Default: on. |
| Vibration intensity | Slider 0–100 | Controls rumble strength. Default: 70. |

---

### 📖 How to Play

Accessible from Settings. Single-page reference covering:
- Movement and dodge
- Attack chains (light, heavy, cancel windows)
- Spell system (Minor / Advanced / Ultimate)
- Surge bar
- Status effects (hunter-applied and enemy-applied)
- Co-op revive
- Shop and levelling overview

Keyboard navigable. Screen-reader compatible.

---

## Accessibility — Pause Menu Itself

| Feature | Detail |
|---|---|
| Screen reader | All pause menu items read aloud on focus |
| Keyboard navigation | Full tab/arrow key navigation throughout |
| Escape to close | Settings and Run Stats panels close on Escape, returns to pause menu root |
| High contrast | Pause menu background darkens further, text contrast increases |

---

## Related Docs

| System | Doc |
|---|---|
| RunState fields (for Run Stats data) | [RUNSTATE.md](./RUNSTATE.md) |
| HUD layout | [HUD.md](./HUD.md) |
| Audio system | [AUDIO.md](./AUDIO.md) |
| Title screen | [TITLESCREEN.md](./TITLESCREEN.md) |
| Card screen settings (timer) | [CARDSCREEN.md](./CARDSCREEN.md) |
