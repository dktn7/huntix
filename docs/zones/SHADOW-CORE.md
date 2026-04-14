# SHADOW CORE — Zone 3

**Boss:** KIBAD (Rogue Angel)  
**Unlock:** After Ruin Den cleared  
**Theme:** Deep arcane corruption zone. The void between worlds. The dark itself learned to move here.  
**Tone:** A banished angel trapped in absolute darkness, raging against it so hard that the shadows started worshipping the light.

---

## The Place

The Shadow Core is not a cave and not a constructed chamber. It is the leftover space between dimensional edges — the place the gates touch when they are not touching anything else.

When the gates opened, some energies slipped through cleanly. Some did not. The ones that failed to resolve into the world pooled here, in the black between worlds. For most of its existence the Shadow Core was only absence — a vacuum of shape and sound. It had no creatures. No memory. No motion.

Then Kibad arrived.

He did not arrive by choice. He was banished into this place from another world — an angel cast down into the one environment that could hurt him most. Light trapped in void. The pressure of that contradiction changed the zone. His celestial presence burned against the dark so continuously that the shadows began to react to it. First they moved. Then they clustered. Then they learned.

The dark developed awareness by standing too close to divine rage.

Now the Shadow Core is not empty. It is crowded with things that should not exist — shadows that orbit Kibad like a congregation, drawn to his radiance and his fury. They do not understand him. They do not control him. They simply cannot bear the idea of losing the light that fills their void.

Kibad hates it here.

That hatred is part of what keeps the Core alive. Every moment he spends resisting the dark gives it shape. Every flash of white-gold power teaches the shadows a new way to move. The zone is a feedback loop of banishment and worship, fear and devotion.

When hunters enter the Shadow Core they are not walking into a ruin. They are stepping into a prison where the prisoners learned to pray.

---

## Environmental Details

The Shadow Core should feel like a place with no horizon. The edges of the lane are swallowed by void, then given just enough detail to suggest depth without ever resolving into it.

- **Floating debris:** Rock shards, broken platform fragments, and gate-energy splinters suspended in the dark. They do not drift randomly — they subtly orient toward Kibad at all times.
- **Shadow tendrils:** Thin black shapes that move at the edge of vision. Not solid enough to block movement, but they react to light flashes and boss attacks — recoiling then returning.
- **Silver cracks:** Faint lines of light in the floor and distant walls, like the zone itself is trying to split open. They brighten when Kibad uses Radiant Burst.
- **Lost architecture:** Broken arches and platform remnants floating in the background — not functional, only symbolic. They make the void feel like it swallowed a world rather than simply being empty.
- **Light bloom:** Any strong aura in this zone is exaggerated by the darkness. Kibad’s presence feels almost too bright to look at. Player auras also pop harder here than in any other zone — every hunter feels more visible, more exposed.

---

## Enemies

The enemies in the Shadow Core are shadows that developed awareness — the dark itself learning to move. They were not always creatures. They became creatures because Kibad was here long enough for them to change.

They are not hostile in a simple sense. They are worshipful. They move toward light because that is the only thing in the void that tells them they still exist. When hunters bring their own light in, the shadows cannot distinguish between the light they worship and the light that threatens their congregation.

### Grunt — Shade Wisp
Fast, low-health shadow fragment. Drifts and lunges in short bursts. Barely humanoid — a suggestion of a body with a pale silver core that brightens near Kibad.

| Stat | Value |
|---|---|
| Health | 80 |
| Speed | 4/10 |
| Attack Damage | 10 |
| Attack Cooldown | 1.8s |
| Essence Drop | 5–20 |

- **Attack:** Swipe — short shadow lash, 400ms wind-up
- **Visual:** Black semi-transparent body with pale silver edges. Passively faces toward Kibad whenever he is on screen.

### Ranged Unit — Lumen Hound
A shadow that learned to throw light back. Fires compressed void shards that flare white on impact. Keeps at mid-range, circling the arena as if protecting something at its centre.

| Stat | Value |
|---|---|
| Health | 60 |
| Speed | 3/10 |
| Attack Damage | 8 per projectile |
| Attack Cooldown | 2.5s |
| Essence Drop | 10–30 |

- **Attack:** Void Shard — straight projectile that flashes white on impact
- **Behaviour:** Circles the arena laterally rather than retreating. Reorients toward the brightest target.

### Bruiser — Null Choir
Multiple shadows fused into one dense form. Not a single creature — a mass of them that agreed on a shape. Slow, enduring, difficult to stagger. Moves like a crowd of things trying to reach the same destination.

| Stat | Value |
|---|---|
| Health | 250 |
| Speed | 2/10 |
| Attack Damage | 25 |
| Attack Cooldown | 3s |
| Essence Drop | 30–80 |

- **Attack:** Crush — overhead impact, wide hit area, 800ms wind-up
- **Shove:** Pushes player back 3 units after 2s proximity, no damage
- **Stagger threshold:** Heavy attack or 3× light hits

---

## Wave Composition

| Wave | Enemies | Notes |
|---|---|---|
| Wave 1 | 5 Shade Wisps | The void fills with movement the moment light enters |
| Wave 2 | 3 Shade Wisps + 2 Lumen Hounds | Circling patterns, mid-range pressure |
| Wave 3 | 2 Null Choir + 2 Lumen Hounds | The congregation thickens before the boss |
| Boss | KIBAD | Phase 2 adds clones, Radiant Burst, full arena light bloom |

**4P adds:** +1 Shade Wisp per wave

---

## Visual Design

| Element | Detail |
|---|---|
| Tone | Pure void, arcane, watching — black until light touches it, then too much contrast |
| Colours | Black, deep purple, white energy cracks, faint silver, white-gold bloom from Kibad |
| Parallax — Background | Infinite void with fragmented geometry, barely visible distant structures |
| Parallax — Midground | Floating broken arches, shattered platforms, shadow tendril clusters |
| Parallax — Foreground | Silver cracks in the floor, drifting debris, shadows gathering and dispersing |
| Hazards | Shadow pools visual only in MVP — pulse when Kibad uses Radiant Burst |
| Ambient particles | Black motes with occasional silver flashes — 25 max sprites, very slow |
| Ground | Floating dark stone suspended over nothing, white-light cracks beneath |
| Lighting | Almost no ambient light. Kibad’s aura is the primary illumination source. High contrast is essential — everything either fully dark or fully lit. |
| Music mood | Dark, cinematic, electronic with arcane tones. No percussion during the ascension. |

---

## Zone Flow

```
Portal entry (players emerge from a dim rift that closes behind them immediately)
→ Wave 1 — shadows respond to light the moment it enters the void
→ Wave 2 — Lumen Hounds begin circling, enemies orient toward brightest target
→ Wave 3 — congregation thickens, the zone feels watched
→ KIBAD intro — the void flares white-gold as he rises in the distance, too bright to look at
→ Boss fight
→ KIBAD defeated — two seconds of total darkness, all lights out including UI
→ Kibad ascends — white-gold trail fading upward through the void
→ Essence magnet
→ Exit portal opens — a white-gold tear in the void, light returning to the lane edges first
```

**Portal detail:** The entry rift closes behind players immediately. There is no way back from the moment they arrive. The exit appears only after Kibad ascends — a tear of light in the void that was not possible before he left.

---

## Special Moment

When Kibad uses Radiant Burst at low health, the Shade Wisps at the edges of the lane angle toward him. Not an animation requirement — just a visual direction note. The feeling in that moment should be devotional. They are not attacking. They are witnessing.
