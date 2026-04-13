# Huntix Hunter Customization Spec

## Purpose
This system lets players personalize a chosen hunter without changing the hunter's identity, class role, or gameplay balance. Players can adjust colors and clothes so each version feels personal while still reading clearly as Dabik, Benzu, Sereisa, or Vesol.

## Design Goals
- Keep the game fast and instantly playable.
- Preserve each hunter's silhouette and role.
- Let players express style through color and outfit variation.
- Support co-op readability by allowing distinct player colors.
- Fit the modern arcane world and hunter registry tone.

## Scope
Customization is available after hunter selection through an Edit option. It is visual-only in the MVP and does not change stats, attacks, or elemental identity. The player can preview changes live before confirming.

## Entry Flow
1. Player enters Hunter Name.
2. Player selects a hunter.
3. Player presses Edit.
4. Player changes colors and clothes.
5. Player confirms and enters the portal.

---

## Customizable Categories

### Colors
- Primary accent color
- Secondary trim color
- Aura tint or brightness
- Cloth or armor dye accents
- Weapon glow tint if desired

### Clothes
- Jacket or coat variant
- Collar or hood option
- Armor plating style
- Glove style
- Boot style
- Cape or sash toggle if the silhouette remains readable

---

## Fixed Identity Elements
The following must never change in the MVP:
- Hunter body type
- Weapon class
- Core combat silhouette
- Rank and role
- Element and main aura behavior
- Signature stance and animation set

---

## Hunter-Specific Rules

### Dabik
Stay light and stealthy. Dark fabrics, subtle purple accents, slim coat or hood variants, minimal armor changes. Avoid heavy bulky clothing that would break his assassin silhouette.

### Benzu
Support heavy armor themes. Large plate variants, reinforced bracers, shoulder trims, bold red-gold color shifts. Clothes can be bulkier, but his shape must still read as a fortress.

### Sereisa
Feel sleek and athletic. Fitted jackets, fencing-inspired coats, streamlined armor panels, lightning color accents. Outfit changes should reinforce speed and precision.

### Vesol
Feel refined and arcane. Structured coats, layered robes, rune trims, wrist fittings, controlled flame-color variations. Clothing should look intelligent and deliberate.

---

## Color Palettes

| Hunter | Allowed Colors |
|---|---|
| Dabik | Black, purple, muted silver |
| Benzu | Deep red, gold, ember black |
| Sereisa | Bright yellow, white, pale steel |
| Vesol | Deep blue, crimson, dark charcoal |

Allow 1-2 accent slots per outfit rather than full unrestricted RGB, so the game stays coherent and stylish.

---

## UI Layout

- **Left:** hunter preview (idle pose, live updates)
- **Right:** color and clothing options
- **Bottom:** Confirm / Back / Randomize
- Optional small stat reminder so the player remembers the hunter role

---

## Preview Requirements
- Model rotation or small idle pose
- Real-time color changes
- Outfit toggle visibility
- Aura or glow preview
- Final confirmation state before leaving screen

---

## Control Rules
- Keyboard, mouse, and controller-friendly
- Keep navigation shallow — no nested submenus
- Confirm: one button press
- Back: returns instantly to class select
- Randomize: small optional button

---

## Co-op Readability
Customization must never reduce visual clarity in combat:
- Avoid colors that blend into the background
- Keep strong silhouette contrasts
- Reserve extreme glow effects for unlocks only, if readable
- Players must still tell hunters apart instantly in combat

---

## Data Model

Each hunter stores:
```js
{
  hunterId: string,
  primaryColor: hex,
  secondaryColor: hex,
  auraTint: hex,
  outfitVariantId: number,
  accessoryToggles: { hood: bool, cape: bool, bracers: bool },
  previewState: object
}
```

---

## Suggested Outfit Slots
- Base suit or armor set
- Outer layer: coat, jacket, robe, or cape
- Collar/hood toggle
- Bracers/gloves style
- Boots style
- Small chest or waist accent

---

## Suggested Limits (Per Hunter)
- 3-5 color slots
- 2-4 outfit variants
- 1-2 accessory toggles
- No gameplay-changing cosmetics in MVP

---

## Visual Tone
- **Materials:** matte cloth, leather, plated armor, crystal trim
- **Style:** clean, premium, tactical, magical
- **Mood:** dangerous, stylish, efficient
- Avoid cartoon clutter or random costume gags

---

## MVP Priority
If time is tight, implement in this order:
1. Primary and secondary colors
2. One outfit variant per hunter
3. Aura tint
4. Live preview
5. Confirm flow

---

## Final Rule
Customization should make the player feel like their version of the hunter is unique, but the hunter should still be instantly recognizable as part of Huntix.
