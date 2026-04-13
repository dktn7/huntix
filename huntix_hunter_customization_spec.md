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

## Customizable Categories
### Colors
- Primary accent color.
- Secondary trim color.
- Aura tint or brightness.
- Cloth or armor dye accents.
- Weapon glow tint if desired.

### Clothes
- Jacket or coat variant.
- Collar or hood option.
- Armor plating style.
- Glove style.
- Boot style.
- Cape or sash toggle if the silhouette remains readable.

## Fixed Identity Elements
The following must never change in the MVP:
- Hunter body type.
- Weapon class.
- Core combat silhouette.
- Rank and role.
- Element and main aura behavior.
- Signature stance and animation set.

## Hunter-Specific Rules
### Dabik
Dabik customization should stay light and stealthy. Use dark fabrics, subtle purple accents, slim coat or hood variants, and minimal armor changes. Avoid heavy bulky clothing that would break his assassin silhouette.

### Benzu
Benzu customization should support heavy armor themes. Use large plate variants, reinforced bracers, shoulder trims, and bold red-gold color shifts. His clothes can be bulkier, but his shape must still read as a fortress.

### Sereisa
Sereisa customization should feel sleek and athletic. Use fitted jackets, fencing-inspired coats, streamlined armor panels, and lightning color accents. Her outfit changes should reinforce speed and precision.

### Vesol
Vesol customization should feel refined and arcane. Use structured coats, layered robes, rune trims, wrist fittings, and controlled flame-color variations. Her clothing should look intelligent and deliberate.

## Color System
Each hunter should have a default color identity, but the player may swap within a limited palette.
- Dabik: black, purple, muted silver.
- Benzu: deep red, gold, ember black.
- Sereisa: bright yellow, white, pale steel.
- Vesol: deep blue, crimson, dark charcoal.

The color system should allow one or two accent slots per outfit rather than full unrestricted RGB chaos, so the game stays coherent and stylish.

## UI Layout
The Edit screen should be compact and easy to read.
- Left side: hunter preview.
- Right side: color and clothing options.
- Bottom: confirm, back, randomize.
- Optional small stat reminder so the player remembers the hunter role.

## Preview Requirements
The preview must update live as the player changes options.
- Model rotation or small idle pose.
- Real-time color changes.
- Outfit toggle visibility.
- Aura or glow preview.
- Final confirmation state before leaving the screen.

## Control Rules
- Use keyboard, mouse, and controller-friendly inputs.
- Keep navigation shallow, no nested submenus if possible.
- Confirm should be one button press.
- Back should return instantly to class select.
- Randomize may be a small optional button.

## Co-op Readability
Each player needs a clear on-field identity, so customization should never reduce visual clarity.
- Avoid colors that blend into the background too much.
- Keep strong silhouette contrasts.
- Reserve extreme glow or special effects for unlocks or cosmetics only if they remain readable.
- Make sure players can still tell the hunters apart instantly in combat.

## Data Model
Each hunter can store:
- Selected hunter id.
- Primary color.
- Secondary color.
- Aura tint.
- Outfit variant id.
- Accessory toggle states.
- Saved preview state.

## Suggested Outfit Slots
- Base suit or armor set.
- Outer layer: coat, jacket, robe, or cape.
- Collar/hood toggle.
- Bracers/gloves style.
- Boots style.
- Small chest or waist accent.

## Suggested Limits
To keep production manageable, each hunter should have:
- 3 to 5 color slots.
- 2 to 4 outfit variants.
- 1 to 2 accessory toggles.
- No gameplay-changing cosmetics in the MVP.

## Visual Tone
The overall customization should still feel like elite hunter gear in a modern arcane world.
- Materials: matte cloth, leather, plated armor, crystal trim.
- Style: clean, premium, tactical, magical.
- Mood: dangerous, stylish, efficient.
- Avoid cartoon clutter or random costume gags.

## MVP Priority
If time is tight, prioritize:
1. Primary and secondary colors.
2. One outfit variant per hunter.
3. Aura tint.
4. Live preview.
5. Confirm flow.

## Final Rule
Customization should make the player feel like their version of the hunter is unique, but the hunter should still be instantly recognizable as part of Huntix.
