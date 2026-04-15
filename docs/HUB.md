# HUNTIX — Hunter Base (Hub Scene)

> This is where hunters prepare. The portals are waiting.

*Last updated April 15, 2026*

---

## Concept

The hub is the **Huntix Hunter Base** — the official headquarters of the Huntix hunter agency. It is a brutalist concrete operations facility built around 4 active gate portals. This is not a market or a lobby — it is a place of work, built by professionals who enter gates for a living.

The **HUNTIX logo is inlaid into the floor** at the centre of the base — architectural, permanent, lit from beneath with gate energy running through the grooves. It is not UI. It is part of the building.

The hub has no combat. It is the loop anchor — the place you return to between every zone, where you spend Essence, level up, and choose what's next.

---

## Scene Dimensions

| Property | Value |
|----------|-------|
| Width | 60 world units (X axis) — wider than combat zones |
| Height | 10 world units (Y axis) — same 2.5D plane |
| Camera | Fixed orthographic, same as combat zones |
| Camera height | Slightly higher angle than combat — reveals more floor |
| Scroll | None — full base visible in one frame |

---

## Environment Layout

```
[ LEFT ]                    [ CENTRE ]                   [ RIGHT ]

 Entrance                  HUNTIX logo (floor)           Portal bays 1–4
  ↓                              ↓                            ↓
Quartermaster            Open operations floor         Gate launch bays
 (shop desk)             Camera reveals this first      (portals in wall)
```

### Detailed Layout

| Zone | Position | Contents |
|------|----------|----------|
| Entrance | Far left | Where the hunter walks in on first arrival. Door frame with rune sensors. |
| Quartermaster | Centre-left | Supply desk — shop interaction point. Hunter agency branding above it. |
| Operations floor | Centre | Open space. **HUNTIX logo inlaid in floor**, lit from beneath. This is the hub's visual anchor. |
| Portal bays | Right side | 4 gate portals embedded in the wall in a row. Each is a contained glowing ring. |
| Back wall | Full width | Brutalist concrete. Gate activity monitors (screens showing gate data). Agency branding. |

---

## Visual Tone

| Element | Detail |
|---------|--------|
| Architecture | Brutalist concrete — raw, institutional, built to last |
| Lighting | Low ambient with rune-lit panels along walls. Gate portals cast coloured light across the floor. |
| Floor | Dark polished concrete. HUNTIX logo inlaid at centre — geometric, gate-crystal material, glows faintly at all times. Blazes during intro sequence. |
| Monitors | Wall-mounted screens showing gate activity maps, hunter rankings, alert levels — ambient world-building, not interactive in MVP |
| Parallax layers | Background: concrete wall with monitors. Mid: agency desk, equipment racks. Foreground: floor logo glow, subtle particle drift. |
| Colour palette | Dark charcoal base, cool blue-grey concrete, gate colours bleeding in from portal bays (orange Zone 1, green Zone 2, purple Zone 3, blue Zone 4) |
| Music | Low tension ambient electronic — slightly eerie, professional. Shifts slightly more energised after first zone clear. |

---

## Intro Sequence (First Load Only)

Plays once per session, before character select. Cannot be skipped in MVP.

```
1. BLACK SCREEN (0.5s)
   → Silence

2. CAMERA OPENS — looking straight down at the hub floor (1.2s)
   → The HUNTIX logo is centred in frame, unlit
   → Gate energy begins running through the logo grooves — slow pulse outward
   → Logo fully illuminates (0.8s)

3. CAMERA RISES AND TILTS UP (1.5s)
   → Smooth pull — reveals the base around the logo
   → Portal bays come into frame on the right, dark and inactive
   → Quartermaster desk visible centre-left
   → Back wall monitors glow on one by one as camera settles
   → Ambient hub music fades in

4. CAMERA SETTLES at standard hub position (full base in frame)
   → Brief hold (0.5s)

5. CHARACTER SELECT OVERLAY appears (see Character Select section below)
```

**Total intro duration: ~4.5s**

> The logo in the floor is the first thing the player ever sees. It is always there when they return. Every run starts and ends with that floor.

---

## Character Select

### Timing
Character select happens **once per session**, during the intro sequence. The chosen hunter is **locked for the full run**. Cannot be changed mid-run or between zones.

### Visual Presentation
The hub environment is fully visible behind the select UI. The character select is a **dark overlay panel** — semi-transparent, not a separate screen. The base is still visible underneath.

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   CHOOSE YOUR HUNTER                            │
│   ─────────────────                             │
│                                                 │
│  [ DABIK ]  [ BENZU ]  [ SEREISA ]  [ VESOL ]  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  [Selected hunter portrait / silhouette] │  │
│  │  Name — Role — Element                   │  │
│  │  Brief flavour line from HUNTERS.md      │  │
│  │  HP / Mana / Speed ratings (3 bars)      │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│              [ ENTER THE BASE ]                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Interaction Flow

1. 4 hunter names/icons shown in a row
2. Default highlight: Dabik (leftmost)
3. Navigate with **A/D or left/right arrow or left stick**
4. On highlight: portrait brightens, aura colour bleeds into the overlay border, flavour line updates
5. Confirm with **Enter / J / A button**
6. Overlay fades out (0.4s)
7. Hunter **walks into the base from the entrance** (left side) — short walk animation, 1.5s
8. Hunter stops at the floor logo, faces the portal bays
9. Hub is now live

### Hunter Quick Stats (shown on select screen)

| Hunter | Role | Element | HP bar | Mana bar | Speed bar |
|--------|------|---------|--------|----------|----------|
| Dabik | Assassin | Shadow | ██░░░ | ████░ | █████ |
| Benzu | Tank | Thunder/Earth | █████ | ██░░░ | █░░░░ |
| Sereisa | Dasher | Lightning | ███░░ | ████░ | ████░ |
| Vesol | Mage | Flame | ██░░░ | █████ | ███░░ |

---

## Hub State — Return Visits

Every time the player returns from a zone, the hub updates to reflect progression.

| After zone | Hub changes |
|------------|-------------|
| Zone 1 clear | Portal 2 (Ruin Den) unlocks — ring activates, green glow spreads from bay 2 |
| Zone 2 clear | Portal 3 (Shadow Core) unlocks — purple glow from bay 3 |
| Zone 3 clear | Portal 4 (Thunder Spire) unlocks — blue glow from bay 4 |
| Zone 4 clear | All portals dim — run complete, end screen triggers |
| Any return | Floor logo pulses once on arrival — brief blaze then settles |

### Portal Bay States

| State | Visual |
|-------|--------|
| **Locked** | Ring is dark, cracked texture, faint smoke. A dim padlock icon above it. |
| **Unlocked / available** | Ring glows at full intensity with zone's colour. Particle drift from the portal surface. Subtle hum audio. |
| **Completed** | Ring has a faint completed glow — dimmer than available but not dark. A small checkmark icon above it. |
| **Current target** | Pulses slightly faster than others — draws the eye without being distracting. |

---

## Shop — Quartermaster Station

### Interaction
- Hunter walks to the quartermaster desk (left side of base)
- Press **F / A button** within 1.5m of desk to open shop
- Shop UI overlays — same semi-transparent dark panel style as character select
- Hub environment visible behind it

### Shop UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  QUARTERMASTER                    Essence: [amount] 🟠   │
│  ──────────────────────────────────────────────────────  │
│                                                         │
│  [ ITEM 1 ]  [ ITEM 2 ]  [ ITEM 3 ]  [ ITEM 4 ]  [ ITEM 5 ] │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [Selected item name]           [Cost] 🟠        │   │
│  │  Category tag (Power / Survival / Spell etc.)   │   │
│  │  Effect description — one line, plain language  │   │
│  │  "Purchases this visit: X / 2"                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [ BUY — Cost 🟠 ]          [ REROLL — 30 🟠 ]          │
│                                                         │
│  [ CLOSE SHOP ]                                         │
└─────────────────────────────────────────────────────────┘
```

### Shop Rules (from PROGRESSION.md)

| Rule | Value |
|------|-------|
| Items shown | 5 random items from pool |
| Max purchases per visit | 2 |
| Reroll cost | 30 Essence |
| Spell items availability | Only appear after L3 (Advanced spell unlocked) |
| Path-weighted items | Surface after L7 (upgrade path locked) |
| Cosmetic | 1 free cosmetic on zone clear — shown in shop on return |

### Item Card Visual

Each of the 5 item slots shows:
- Item name (bold)
- Category icon (⚔️ Power / 🛡 Survival / 💨 Mobility / 🔮 Spell / 🔧 Utility / 🎨 Cosmetic)
- Cost in Essence
- Greyed out if player cannot afford or has hit 2-buy limit

---

## Level-Up Card Overlay

The card overlay appears **during combat** (not in the hub) when XP crosses a level threshold. It is documented here because it shares the same visual language as hub UI.

### Trigger
- XP threshold crossed mid-combat (see RUNSTATE.md for flow)
- Combat **freezes** — all enemies pause, all timers stop
- Card overlay fades in over 0.3s

### Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              ⚡ LEVEL [X] REACHED                        │
│                                                         │
│   ┌───────────┐   ┌───────────┐   ┌───────────┐        │
│   │           │   │           │   │           │        │
│   │  CARD 1   │   │  CARD 2   │   │  CARD 3   │        │
│   │           │   │           │   │           │        │
│   │ [Name]    │   │ [Name]    │   │ [Name]    │        │
│   │ [Type]    │   │ [Type]    │   │ [Type]    │        │
│   │ [Effect]  │   │ [Effect]  │   │ [Effect]  │        │
│   │           │   │           │   │           │        │
│   └───────────┘   └───────────┘   └───────────┘        │
│                                                         │
│         Navigate: A/D or ◄ ► — Confirm: J / A          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Card Data Structure

Each card carries:

```js
Card = {
  id:           String,   // e.g. 'double-blink'
  name:         String,   // Display name — e.g. 'Double Blink'
  type:         String,   // 'spell-mod' | 'stat' | 'passive' | 'path-lock' | 'capstone'
  category:     String,   // '⚔️ Power' | '🛡 Survival' | '💨 Mobility' | '✨ Style'
  description:  String,   // One line — plain language effect
  hunterId:     String,   // Which hunter this card belongs to
  level:        Number,   // Which level triggered this card
}
```

### Card Behaviour Per Level

| Level | Card type shown | Notes |
|-------|----------------|-------|
| L2 | Stat cards | Generic — damage / speed / HP bump |
| L4 | Minor spell mods | 3 hunter-specific spell modification cards |
| L5 | Stat or passive | Mix of stat cards and passive ability cards |
| L6 | Advanced spell mods | 3 hunter-specific spell modification cards |
| L7 | Path lock | 3 cards — one per path (Power / Survival / Mobility / Style). Picking one locks the path. |
| L8 | Path-specific | Cards drawn from locked path's upgrade pool |
| L10 | Capstone | 1 card only — the path capstone. No choice. Confirm to apply. |

> L10 capstone is shown as a single card centred on screen — no choice, just a confirmation moment. Feels like a reward, not a decision.

### Co-op Card Behaviour

- Each player levels independently
- Card screen pauses **only for the levelling player** — others continue fighting
- If 2 players level simultaneously, card screens **queue** — player 0 first, then player 1
- A small indicator shows on other players' HUDs: `[P1 LEVELLING UP...]`
- Card screen has **no time limit** — player can take as long as needed

### Visual Style
- Dark semi-transparent background — same language as hub overlays
- Cards use a dark panel with coloured top border matching category (red = Power, blue = Survival, yellow = Mobility, white = Style)
- Selected card has a bright border glow
- Hunter's aura colour bleeds into the overlay border — personalised per hunter
- Level number displayed with a brief flash of the hunter's aura colour on entry

---

## Hub Audio

| State | Music |
|-------|-------|
| First load / intro | Silence → ambient fade in as camera rises |
| Hub idle (pre-Zone 1) | Low tension ambient electronic — slightly eerie |
| Hub return (post-zone clear) | Same ambient + subtle added layer — slightly more weight |
| Shop open | Ambient continues — brief UI chime on open |
| Card screen | Combat audio fades — brief silence — card-reveal tone |
| Portal entry | Portal hum intensifies → zone music crossfades in |

---

## Hub Interaction Map

| Interaction point | Trigger | Action |
|------------------|---------|--------|
| Quartermaster desk | Walk within 1.5m + F / A | Opens shop overlay |
| Portal bay (unlocked) | Walk within 1.5m + F / A | Confirms zone entry — fade out → zone loads |
| Portal bay (locked) | Walk within 1.5m + F / A | Locked message: "Clear [Zone Name] first" |
| Portal bay (completed) | Walk within 1.5m + F / A | Re-entry prompt — "Re-enter [Zone Name]? (No rewards)" — disabled in MVP |
| Floor logo | Walk over | Logo pulses beneath hunter feet — ambient only, no interaction |

---

## Related Docs

| System | Doc |
|--------|-----|
| Run state passed into hub | [RUNSTATE.md](./RUNSTATE.md) |
| Shop item pool and economy | [PROGRESSION.md](./PROGRESSION.md) |
| Level-up card contents per level | [PROGRESSION.md](./PROGRESSION.md) |
| In-combat HUD (XP bar, spell slots) | [HUD.md](./HUD.md) |
| Zone scenes entered from hub | [ZONES.md](./ZONES.md) |
| Hunter stats shown on select screen | [HUNTERS.md](./HUNTERS.md) |
