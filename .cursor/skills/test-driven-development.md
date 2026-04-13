---
name: test-driven-development
description: Write tests before implementing game features. Use for combat mechanics, collision detection, progression systems, and any pure logic functions in Huntix.
source: https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md
---

# Test-Driven Development

Write the test first, then write the code to make it pass.

## Cycle

1. **Red** — write a failing test that describes the desired behaviour
2. **Green** — write the minimum code to make the test pass
3. **Refactor** — clean up code while keeping tests green

## What to Test in Huntix

- **Combat logic**: damage calculation, combo multipliers, status effects (shadow/thunder/flame)
- **Progression**: XP thresholds, level-up triggers, essence shop economy
- **Collision**: hitbox overlap detection (pure math, no Three.js dependency)
- **AI state machine**: enemy state transitions (idle → chase → attack → stagger)
- **Input buffer**: action buffering for combos

## Example

```js
// test/combat.test.js
describe('damage calculation', () => {
  it('applies elemental bonus when status matches', () => {
    const base = 100;
    const result = calculateDamage(base, 'fire', { status: 'burning' });
    expect(result).toBeGreaterThan(base);
  });

  it('does not apply bonus when status does not match', () => {
    const base = 100;
    const result = calculateDamage(base, 'fire', { status: 'frozen' });
    expect(result).toBe(base);
  });
});
```

## Keep Tests Fast

- Test pure functions, not rendering
- Mock Three.js objects — never create a real WebGL context in tests
- Aim for <100ms total test suite runtime
