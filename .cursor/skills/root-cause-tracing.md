---
name: root-cause-tracing
description: Identify the fundamental root cause of bugs rather than patching symptoms. Use when a bug keeps reappearing or a fix causes other breakages.
source: https://github.com/obra/superpowers/blob/main/skills/root-cause-tracing/SKILL.md
---

# Root Cause Tracing

Fix the cause, not the symptom.

## The 5-Why Method

Ask "why" repeatedly until you reach a root cause that, if fixed, prevents the whole chain:

- Bug: enemy passes through wall
- Why? Collision check returned false
- Why? Positions were in different coordinate spaces
- Why? One position was local, one was world
- Root cause: inconsistent use of `getWorldPosition()` vs `position`

## Signs You Are Patching Symptoms

- Adding a special-case `if` to handle one specific scenario
- The same bug appears in a slightly different form after your fix
- Your fix makes sense "for now" but feels wrong
- You are adding a `setTimeout` to wait for something to be ready

## Correct Approach

1. Map the full data/execution flow from input to broken output
2. Find where the invariant first breaks
3. Fix at that point, not downstream
4. Add a test that would have caught this at the root level
