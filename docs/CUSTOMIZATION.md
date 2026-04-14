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
- Hair style and color
- Eye color

---

## Hunter-Specific Rules

### Dabik
- **Build:** Muscular agile — compact power, fast and controlled. Never bulky or heavy.
- **Hair:** Short wild spiky white — must not change.
- **Eyes:** Purple — must not change. Faint glow in power states.
- **Clothing rules:** Stay light and stealthy. Dark fabrics, subtle purple accents, slim coat or hood variants, minimal armor changes. Avoid heavy bulky clothing that would break his assassin silhouette.
- **No tribal markings or decorative motifs** — his identity is carried by movement, hair, and eyes only.
- **Allowed customization:** Dark hood variants, coat length, armor trim style, aura glow intensity, weapon glow tint.

### Benzu
- **Build:** Massive fortress — huge, broad, immovable. Always the biggest silhouette.
- **Hair:** Long dirty-blonde mane — must not change.
- **Skin:** Bronze-orange — must not change.
- **Clothing rules:** Support heavy armor themes. Large plate variants, reinforced bracers, shoulder trims, bold red-gold color shifts. Clothes can be bulkier, but his shape must still read as a fortress.
- **Allowed customization:** Armor plate variants, shoulder guard styles, color shifts within red-gold-black palette, aura intensity.

### Sereisa
- **Build:** Sleek athletic — speed-first, narrow and precise.
- **Hair:** Platinum undercut — must not change.
- **Weapon:** Single lightning rapier — must remain a single precision weapon. No dual weapons.
- **Clothing rules:** Feel sleek and athletic. Fitted jackets, fencing-inspired coats, streamlined armor panels, lightning color accents. Outfit changes should reinforce speed and precision.
- **Allowed customization:** Jacket fit, collar or hood toggle, armor panel style, lightning color tint, aura crackle intensity, rapier glow color.

### Vesol
- **Build:** Defined, poised, refined — not bulky.
- **Hair:** Dark controlled bun — must not change.
- **Clothing rules:** Feel refined and arcane. Structured coats, layered robes, rune trims, wrist fittings, controlled flame-color variations. Clothing should look intelligent and deliberate.
- **Allowed customization:** Coat structure, robe layering, wrist fitting style, aura color shift range (blue to crimson), flame glow intensity.

---

## Color Palettes

| Hunter | Fixed Elements | Allowed Color Slots |
|---|---|---|
| Dabik | Black base, white hair, purple eyes | Purple accent, silver trim, aura glow |
| Benzu | Bronze-orange skin, dirty-blonde hair | Red-gold trim, ember black, armor color |
| Sereisa | Pale skin, platinum hair | Yellow-white lightning, pale steel, rapier glow |
| Vesol | Warm tan skin, dark hair | Blue-crimson aura range, charcoal layers |

Allow 1–2 accent slots per outfit rather than full unrestricted RGB, so the game stays coherent and stylish.

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
- 3–5 color slots
- 2–4 outfit variants
- 1–2 accessory toggles
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
