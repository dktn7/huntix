# Huntix Character Art — AI Image Pipeline

This folder contains the prompt history, model learnings, and generation workflow for producing
game-ready character sprites for Huntix's four S-Rank hunters.

> ⚠️ **Phase gate:** Character art generation belongs to **Phase 3 (Days 7–9)**.
> Do not run these workflows until the engine, player controller, and combat system are in place.

---

## What This Folder Provides

- Prompt templates for each hunter: Dabik, Benzu, Sereisa, Vesol
- Proven fal.ai + GPT Image 1.5 + Nano Banana 2 pipeline from the `vibe-isometric-sprites` predecessor project
- Hard-won model learnings you do not need to rediscover
- Output path conventions aligned with `docs/TECHSTACK.md`

---

## Visual Identity — What Huntix Art Must Feel Like

Huntix is a **dark stylised action brawler**. Three tone references — use as anchors, not copies:

| Reference | What it gives Huntix |
|---|---|
| **Solo Leveling** | Dark urban arcane atmosphere, gate/breach world feel, aura as identity, dramatic power escalation |
| **Castle Crashers** | Co-op character distinction, bold readable shapes at small size, expressive idle personality, distinct per-character colour identity |
| **Dead Cells** | Tight snappy animation feel, weight on every hit, dodge timing, status effect synergies |

Key constraints:
- Dark urban base palette: deep navy, black, charcoal, steel, muted grey
- Each hunter defined by their aura colour — that is their brand
- Strong silhouettes above all else — profile clarity wins over surface detail
- Characters look like professionals who live in a world of breaches, not fantasy heroes
- Clothing is modern functional gear — designed, not found
- The Huntix H emblem appears on every hunter's gear as agency insignia — part of the world, not branding

---

## Target Perspective

The original `vibe-isometric-sprites` pipeline used **FF Tactics isometric** (30° diamond, down-right facing).
Huntix uses a **2.5D orthographic side-scroll camera** — which means:

| Axis | Isometric (old) | Huntix 2.5D (new) |
|---|---|---|
| Viewing angle | Down-right 30° isometric | Near-front, slight top-down Y elevation |
| Primary read | Four diagonal directions equally | Left/right facing + front/back secondary |
| Silhouette priority | Head-to-foot diamond | Head, shoulder, torso, weapon profile |
| Depth cue | Tile height | Y-sort (position.z = -worldY * 0.01) |

**Target frame:** Full body, front-facing 2.5D standing idle, slight 3/4 elevation,
clearly readable from a 16:9 browser window at 1280×720.

---

## Pipeline Overview

```
1. Mixboard design reference sheet (docs/VISUAL-DESIGN.md prompts)
        ↓ fal.ai GPT Image 1.5
2. Full-body standing idle (transparent background, 1024×1536)
        ↓ fal.ai Nano Banana 2 (edit)
3. Downscale-optimised game-ready master (chroma green #00FF00 background)
        ↓ fal.ai Nano Banana 2 (edit, 2-reference)
4. Direction sheet — L/R facing pair + front/back pair
        ↓ post-processing (height normalise, key out chroma)
5. Final frames → assets/textures/characters/<hunter-name>/
```

---

## Hard-Won Model Learnings (from vibe-isometric-sprites predecessor)

**fal.ai queue vs direct POST:**
- Queue polling returned 405 errors in some environments
- Direct POST to `https://fal.run/<endpoint-id>` worked reliably
- Use `https://fal.run/fal-ai/nano-banana-2/edit` and `https://fal.run/fal-ai/gpt-image-1.5/edit`

**Nano Banana 2 behaviour:**
- Ignores "exactly four" instructions — often returns 8-pose grids
- Treat that as a feature: curate the best frames from the larger output
- Cannot be trusted for clean transparent backgrounds — use chroma `#00FF00` always
- Background spec must be: *"exact flat chroma green #00FF00, no gradient, no shadow, no floor, no texture, no green spill on character"*
- Do not use magenta — it bleeds into warm skin tones and clothing

**GPT Image 1.5:**
- Best model for the initial full-body derivation from a text description or portrait
- Reliable for transparent background output (unlike Banana-family models)
- Use for the master reference before handing off to Banana for direction sheets

**Height drift:**
- Cardinal and diagonal sheets consistently produce frames at different heights
- Fix: shared-height + shared-bottom-anchor normalisation step after generation
- Do not skip this — it causes visible breathing/floating in the final sprite

**Reference discipline:**
- Pass only the minimum reference images the edit actually needs
- For direction sheets: anchor image (standing master) + identity reference (full-body)
- Do not stack extra references — it dilutes control and makes failure analysis harder

---

## Output Paths

```
assets/
  textures/
    characters/
      dabik/
        full-body-ref.png
        game-master-chroma.png
        direction-sheet-chroma.png
        frames/
      benzu/
      sereisa/
      vesol/
```

Experiment outputs:
```
experiments/
  fal-image/
    <timestamp>-<hunter>-<run-slug>/
```

---

## See Also

- `docs/VISUAL-DESIGN.md` — full art direction, Mixboard prompts, Grok animation prompts
- `docs/HUNTERS.md` — lore, stats, personality, weapon identity per hunter
- `docs/VISUAL-REFERENCE.md` — canonical design lock table, common mistakes
- `docs/ANIMATIONS.md` — frame budgets and states each sprite set must support
- `bonus/huntix-character-art/prompts/` — ready-to-run fal.ai prompt templates for all 4 hunters
