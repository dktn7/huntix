# Huntix Co-op Design Rules

Supports 1–4 local players — flexible, no forced co-op.

---

## Scaling Rules

| Players | Enemy HP | Enemy Count | Boss Behaviour |
|---|---|---|---|
| 1 (Solo) | ×1.0 (100%) | Base waves | Base attacks |
| 2 (Duo) | ×1.5 (150%) | +1 grunt/ranged per 2 extra | — |
| 3 | ×2.0 (200%) | Waves ×1.5 | Rogue Dabik gets 2× clones |
| 4 | ×2.5 (250%) | Waves ×1.5 | All bosses get extra adds |

---

## Readability Rules

- Distinct player colours (aura overrides per player slot)
- Particle effects capped (max 5 particles/emitter)
- Friendly fire: **OFF** — hits between players are ignored
- Camera: shared action camera, keeps all players visible

---

## Technical Constraints (60fps on mid-laptop)

- Max 20 enemies simultaneously (instanced meshes)
- Max 500 particles/frame (GPU compute)
- LOD on bosses at 10m distance (switch to low-poly)
- No dynamic shadows (post-MVP) — baked AO only

---

## AI Companions

- Fill empty player slots in solo/duo (optional)
- Follow player, assist in combat
- Can revive downed players
- Simplified behaviour — follow/attack/ability usage

---

## Status Effect Synergies (Co-op)

| Combo | Players | Effect |
|---|---|---|
| Bleed + Slow | Dabik + Sereisa | Slowed targets take amplified bleed damage |
| Stun + Wall | Benzu + Vesol | Stunned enemies trapped inside flame wall |
| Slow + Blink | Sereisa + Dabik | Shocked target grants free backstab |
| Burn + Slam | Vesol + Benzu | Burning targets take bonus stagger on slam |
