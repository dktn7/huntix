---
name: test-driven-development
description: Write tests before implementing game features. Use for combat mechanics, collision detection, progression systems, and any pure logic in Huntix.
---

# Test-Driven Development

Write the test first, then write the code to make it pass.

## Cycle: Red → Green → Refactor

1. **Red** — write a failing test describing desired behaviour
2. **Green** — write minimum code to make it pass
3. **Refactor** — clean up while keeping tests green

## What to Test in Huntix

- **Combat**: damage calculation, combo multipliers, status effects
- **Progression**: XP thresholds, level-up triggers, essence economy
- **Collision**: AABB overlap detection (pure math, no Three.js)
- **AI FSM**: enemy state transitions (idle → chase → attack → stagger)
- **Input buffer**: combo action buffering

## Example

```js
describe('damage calculation', () => {
  it('applies elemental bonus when status matches', () => {
    const result = calculateDamage(100, 'fire', { status: 'burning' });
    expect(result).toBeGreaterThan(100);
  });
});
```

## Keep Tests Fast

- Test pure functions only — never rendering
- Mock Three.js objects — never create a real WebGL context in tests
- Target < 100ms total test suite runtime
