# HUNTIX — Visual Reference & Source of Truth

*Last updated: April 14, 2026*

> **Rule: This document is the canonical design lock for all four hunters.**
> Before writing any character prompt, description, or asset spec — read this first.
> Do not reference previous conversation context. Do not assume. Read here.

---

## Design Lock Table

| Hunter | Build | Skin | Hair | Eyes | Weapon | Palette | Core Read |
|---|---|---|---|---|---|---|---|
| **Dabik** | Muscular agile, compact power | Dark brown | Short wild spiky **WHITE** | **Purple** (faint glow in power states) | Twin curved daggers | Black, purple, muted silver | Silent predator |
| **Benzu** | Massive, built like architecture | **Bronze-orange** | Long **dirty-blonde mane** | Dark | Stone-forged gauntlets | Deep red, gold, ember black | Living wall |
| **Sereisa** | Tall lean speed-first | Pale Nordic | Platinum undercut | Light | **Twin** electro-blades (short curved, both hands) | Bright yellow, white, pale steel | Speed duelist |
| **Vesol** | Defined, poised, refined | Warm tan | Dark controlled bun | Dark | Gate crystal focus at left wrist | Deep blue, crimson, dark charcoal | Arcane controller |

---

## Common Mistakes to Avoid

| Hunter | Wrong | Correct |
|---|---|---|
| Dabik | Close-cut black hair, dark eyes | **Short wild spiky WHITE hair, purple eyes** |
| Dabik | Lean build | **Muscular and agile — compact power** |
| Benzu | Dark brown skin, shaved head | **Bronze-orange skin, long dirty-blonde mane** |
| Sereisa | Single rapier | **Twin electro-blades — one in each hand** |
| Vesol | Generic dark hair bun | **Architectural bun, jade pins, 2-3 crimson streaks** |

---

## Hair Reference (Full)

### 🌑 DABIK
```
Short wild spiky WHITE hair — natural supernatural colouring, not dyed.
Tight coil texture at roots, spikes upward and outward at crown.
No product. Irregular shape. Deep purple sheen visible under
shadow aura light at full power state.
```

### 🔴 BENZU
```
Long dirty-blonde mane — thick, heavy natural texture.
Worn loose past the shoulders or roughly tied back.
No product. Slightly dishevelled. Dark roots.
At full Surge: faint gold-orange gate ore light catches in strands near face.
```

### ⚡ SEREISA
```
Platinum white — natural Nordic near-white, not dyed.
Disconnected undercut — skin fade sides, top 6-8cm swept back to one side.
Moves with her — reacts to speed.
At full Storm Surge: individual strands visibly charged,
lift slightly at tips with static. Lightning threads through hair.
```

### 🔥 VESOL
```
Dark near-black — structured high bun, architectural and deliberate.
Tight cylinder shape. Two jade pins crossed through the bun.
2-3 deep crimson streaks, visible from front and side.
One short strand escapes at the temple — the only imprecision she allows.
At full Surge/Inferno: crimson streaks glow faintly at the tips.
```

---

## Aura Reference

| Hunter | Rest State | Full Power State |
|---|---|---|
| **Dabik** | Black, purple edges, stays close to body | Deep purple spreads wide, white hair gets purple sheen |
| **Benzu** | Deep red with gold fracture pulses at fists/boots | Full gold-red blaze, cracks radiate from feet |
| **Sereisa** | Yellow-white crackle at hands/feet | Full yellow-white storm, lightning threads everywhere |
| **Vesol** | Cold blue particles drifting upward | Full crimson — blue vanishes entirely |

---

## Weapon Reference

| Hunter | Weapon | Notes |
|---|---|---|
| **Dabik** | Twin curved daggers | One at side, one reverse-grip at back hip. No markings, no grip tape. |
| **Benzu** | Stone-forged gauntlets | Both fists/forearms to elbow. Gate ore vein glow (gold-orange). |
| **Sereisa** | Twin electro-blades | Short curved blades, ONE IN EACH HAND. Both always active. |
| **Vesol** | Gate crystal focus rod | Left wrist, flush to forearm. ~20cm. No blade. Cold blue glow. |

---

## Art Direction

```
Overall style:   Solo Leveling — dark hunter fantasy, aura as identity,
                 dramatic power escalation, S-rank elite presence
Camera/pose:     Castle Crashers — 2.5D angled 3/4 isometric view,
                 clean readable silhouettes, bold outlines
Animation feel:  Dead Cells — snappy, tight, no floaty motion,
                 every hit has weight, every dodge is intentional
NOT:             Chibi. Western cartoon. Anime generic. Tribal markings.
```

---

## Asset Pipeline

```
Mixboard (design sheet)
  → Kling AI or Grok (animation — image-to-video)
      → Blender (green screen key → PNG sequence)
          → TexturePacker (atlas sheets)
              → Three.js (assets/hunters/{name}/)
```

### Asset Folder Structure
```
assets/
  hunters/
    dabik/
      sheet.png        ← Mixboard reference (do not use in-game)
      idle/            ← PNG frames from Blender
      run/
      attack_light/
      attack_heavy/
      dodge/
      ultimate/
    benzu/
    sereisa/
    vesol/
```
