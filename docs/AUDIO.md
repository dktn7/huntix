# Huntix Audio Design

Punchy, modern, arcane. Every hit, ability, and boss moment must sound premium. Audio is Phase 6 but this doc defines what needs to be sourced or generated.

---

## Audio Direction

- **Tone:** Action anime meets premium browser game. Not generic fantasy — modern arcane.
- **Hits:** Sharp, satisfying, layered. Light attack feels quick and crisp. Heavy feels impactful.
- **Abilities:** Each hunter has a distinct elemental sound identity.
- **Boss moments:** Dramatic stings, phase transitions, death sequences.
- **Music:** Driving electronic with arcane/orchestral elements. Zone-specific mood.
- **UI:** Clean, minimal, modern click/confirm sounds.

---

## SFX List

### Combat — Shared

| Event | Description | Notes |
|---|---|---|
| Light attack hit | Short crisp impact, slight punch | Varies by hunter weapon |
| Heavy attack hit | Deep thud with impact resonance | Longer tail |
| Dodge | Quick whoosh — directional | Unique per hunter (see below) |
| Hit taken | Short sting + brief rumble | Player feedback |
| Death | Descending tone + impact | Player and enemy |
| Combo increment | Subtle rising tick each hit | Quiet — not intrusive |
| Combo break | Soft negative click | |
| Kill slow-mo | Audio pitch shift down 20% for 500ms | Ties to visual slow-mo |

### Hunter-Specific Dodge SFX

| Hunter | Dodge Sound |
|---|---|
| Dabik | Shadow blink — silent in, soft impact out |
| Benzu | Shoulder charge — heavy impact thud |
| Sereisa | Electric dash — crackle-whoosh |
| Vesol | Flame scatter — burst of embers, pop |

### Hunter Spells

| Hunter | Spell | Sound |
|---|---|---|
| Dabik | Shadow Step | Near-silent blink, soft landing |
| Dabik | Shadow Clone | Echo shimmer, ghostly split |
| Dabik | Monarch's Domain (ult) | Deep silence → rapid strike flurry → release |
| Benzu | Shield Bash | Heavy clang |
| Benzu | Seismic Slam | Wind-up grunt → massive ground crack |
| Benzu | Titan's Wrath (ult) | Earth-shattering low-frequency burst |
| Sereisa | Electric Dart | Sharp zap |
| Sereisa | Chain Shock | Chain crackle across enemies |
| Sereisa | Storm Surge (ult) | Lightning surge loop while active |
| Vesol | Flame Bolt | Soft launch → impact sizzle |
| Vesol | Flame Wall | Rising flame crackle loop |
| Vesol | Inferno (ult) | Deep ignition roar → sustained fire ambience |

### Enemies

| Event | Sound |
|---|---|
| Grunt attack | Short grunt + swipe |
| Grunt death | Short collapse |
| Ranged unit charge | Rising energy hum |
| Ranged unit fire | Energy bolt launch |
| Bruiser slam wind-up | Heavy inhale, footstep |
| Bruiser slam impact | Massive thud + screen shake stinger |
| Bruiser death | Long collapse crash |

### Boss Events

| Event | Sound |
|---|---|
| Boss intro | Dramatic sting — unique per boss |
| Boss phase transition | Pulse + brief silence + roar |
| Fire Bruiser charge | Rushing fire whoosh |
| Earth Tank slam | Seismic ground crack |
| Rogue Dabik blink | Rapid shadow split |
| Raiju chain lightning | Electric arc chain — multiple hits |
| Boss death | Long unique death sequence per boss |

### UI

| Event | Sound |
|---|---|
| Menu navigation | Soft click |
| Confirm | Clean positive tone |
| Back | Soft negative |
| Shop purchase | Coin shimmer |
| Level up | Rising chime |
| Portal entry | Portal hum → rush → arrival |
| Essence collect | Soft chime per drop, louder on mass magnet |

---

## Music

| Location | Mood | Style |
|---|---|---|
| Hunter Hub | Low tension, ambient electronic | Understated, eerie calm |
| City Breach | Urban tension → rising energy | Punchy drums, synth lead |
| Ruin Den | Heavy, grinding | Industrial bass, pressure building |
| Shadow Core | Dark, cinematic | Electronic + arcane, deep bass |
| Thunder Spire | Climactic, intense | Fast electronic, orchestral crescendo |
| Boss fight | Layer on top of zone music | Additional percussion, bass boost |
| Victory | Short triumphant sting | 3–5 seconds |

**Music system:** Separate zone track + boss layer. Boss music fades in over 2s when boss spawns, fades back to zone track after defeat.

---

## Implementation Notes (Phase 6)

- Use Web Audio API or Howler.js (CDN, no npm)
- Preload SFX as short MP3s in `assets/audio/`
- Music: loop via `<audio>` element with JS volume control
- Hitstop: briefly lower music volume 30% for 80ms on heavy hit
- All audio gated behind user interaction (browser autoplay policy)
- Volume controls in pause menu: master, music, SFX sliders
- If time-constrained in Phase 6: prioritise hit SFX, dodge SFX, boss sting, level-up chime
