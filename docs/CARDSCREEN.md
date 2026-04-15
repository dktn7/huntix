# HUNTIX — Card Screen

> *The game reads how you play. The cards reflect it.*

*Last updated April 15, 2026*

---

## Overview

The card screen fires between waves whenever a level-up threshold is crossed during that wave. It is the primary moment of build expression in Huntix — the game pauses, 3 cards are presented, and the player shapes their hunter for the rest of the run.

Cards are **playstyle-weighted** — the pool is not random. The game tracks how you played the last wave and surfaces cards that match your behaviour. You can still receive any card type, but the weighting nudges the pool toward what fits.

---

## When It Fires

- **Trigger:** XP threshold crossed during a wave
- **Timing:** Card screen queues and fires **after the wave is fully cleared** — never mid-combat
- **Multiple level-ups:** If a player levels up twice in one wave, they see one card screen per level — sequentially, after wave clear
- **Multiple players levelling:** If multiple players levelled up in the same wave, all card screens fire simultaneously — each player sees their own screen

---

## Solo Behaviour

- Game fully pauses
- No timer — pick at your own pace
- Full build panel visible alongside cards
- Escape does not close the card screen — must pick a card

---

## Co-op Behaviour

- Game fully pauses for all players
- Each player who levelled up sees their own card screen simultaneously
- Players who did not level up see a "waiting for picks" overlay with other players' card screens visible (read-only, spectate mode)
- **15 second timer** — auto-selects highest-rarity card on expiry
- Timer extendable to 30s via Accessibility settings (Slow co-op card timer toggle)
- All players must confirm their pick (or timer expires) before the next wave begins

---

## Playstyle-Weighted Draw

The game tracks behaviour per wave and weights the card pool accordingly. Weighting is soft — any card type can still appear, but the pool tilts toward what fits.

| If you played like this... | Card pool tilts toward... |
|---|---|
| High combo count, frequent heavy attacks | Power cards |
| Took multiple hits, low HP moments | Survival cards |
| High dodge count, frequent repositioning | Mobility cards |
| Spell casts frequent, mana spent heavily | Spell / Style cards |
| Mixed — no clear pattern | Balanced draw, no strong tilt |

Weighting resets each wave — it reads the wave just completed, not your entire run history.

---

## Card Presentation

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    LEVEL UP — LEVEL 4                        │
│                                                              │
│    ┌──────────┐      ┌──────────┐      ┌──────────┐        │
│    │  [IMAGE] │      │  [IMAGE] │      │  [IMAGE] │        │
│    │          │      │          │      │          │        │
│    │  Name    │      │  Name    │      │  Name    │        │
│    │  ──────  │      │  ──────  │      │  ──────  │        │
│    │  Desc    │      │  Desc    │      │  Desc    │        │
│    └──────────┘      └──────────┘      └──────────┘        │
│                                                              │
│    ┌──────────────────────────────────────────────────┐    │
│    │ YOUR BUILD                                        │    │
│    │ Cards earned:   Phantom Trail  |  Iron Skin       │    │
│    │ Shop items:     Swift Soles    |  Spell Echo       │    │
│    │ Current stats:  HP 80  Mana 120  DMG 6  SPD 9    │    │
│    └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Card Anatomy

Each card contains:
- **Image** — illustration of the card's effect or item
- **Name** — card name (e.g. *Phantom Trail*, *Iron Skin*)
- **Description** — full effect text, always visible on the card itself
- **Rarity indicator** — subtle corner glow (Common = none, Rare = silver, Legendary = gold)
- **Hunter-coloured border** — Dabik = deep purple, Benzu = red/gold, Sereisa = bright yellow, Vesol = deep blue

### Hover Tooltip

Hovering a card (mouse) surfaces an extended tooltip above the card with:
- Full effect numbers
- Synergy note if the card interacts with something already in your build (e.g. "Pairs with Spell Echo you already own")
- Path alignment tag if applicable (e.g. ⚔️ Power path)

---

## Card Animation Sequence

```
Wave clear signal
  → 1.5s wave clear celebration (fanfare, score flash)
  → Screen dims slightly (background blur)
  → "LEVEL UP" text appears centre screen (0.3s scale-in)
  → Card 1 slides up from bottom (0ms delay)
  → Card 2 slides up (80ms delay)
  → Card 3 slides up (160ms delay)
  → Cards settle into arc layout
  → Build panel fades in below cards (0.2s)
  → Player selects card
  → Unchosen cards flip face-down (100ms flip) then fade out
  → Chosen card scales up briefly (0.1s) then flies to hunter portrait in HUD corner
  → 0.5s pause
  → Next wave begins
```

Total card screen entry animation: ~400ms. Feels weighted, not instant.

---

## Build Panel (Read-Only)

A compact read-only summary of the player's current run state, visible at the bottom of the card screen to inform the pick.

| Section | Content |
|---|---|
| Cards earned | All level-up cards picked this run, listed by name |
| Shop items | All shop purchases active this run |
| Current stats | HP, Mana, Damage modifier, Speed modifier |
| Path | Shows locked path if L7+ (e.g. ⚔️ Power Path active) |

**Read-only** — nothing in this panel is interactive. It is context only.

---

## Card Pool Rules

- No duplicate cards in the same pick (3 cards shown are always distinct)
- No card can appear twice in the same run once picked
- Cards already owned are removed from the pool
- At L4 and L6: pool is restricted to spell modification cards for that hunter only
- At L7: pool is restricted to the 4 upgrade path choices only (no other cards shown)
- At L8: pool is restricted to path-specific upgrade cards (based on L7 path choice)
- At L10: pool shows only the path capstone card (single card, no choice — automatic)

---

## Co-op Spectate Mode

Players who did not level up during a wave see a spectate overlay:
- Their screen shows their own HUD in the background
- Other players' card screens visible as smaller panels in a row
- Cannot interact with other players' cards
- See a "Waiting for [Player Name]" timer bar if others are still picking
- Can open their own Run Stats panel while waiting

---

## Accessibility

| Setting | Effect |
|---|---|
| Screen reader on | Card name and description read aloud when hovered or focused |
| Slow co-op card timer | Timer extends from 15s to 30s |
| High contrast mode | Card borders thicker, rarity glow more pronounced |
| Colourblind mode | Hunter border colours shift to colourblind-safe palette |
| UI scale | Card size scales with UI scale slider |

---

## Related Docs

| System | Doc |
|---|---|
| Level-up thresholds and card pool contents | [PROGRESSION.md](./PROGRESSION.md) |
| XP sources that trigger level-up | [PROGRESSION.md](./PROGRESSION.md) |
| HUD hunter portrait (card flies to here) | [HUD.md](./HUD.md) |
| Wave clear sequence | [WAVEMANAGER.md](./WAVEMANAGER.md) |
| Upgrade path lock at L7 | [UPGRADEPATH.md](./UPGRADEPATH.md) |
