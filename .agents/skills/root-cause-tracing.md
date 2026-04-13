---
name: root-cause-tracing
description: Find the fundamental root cause of bugs rather than patching symptoms. Use when a bug keeps reappearing.
---

# Root Cause Tracing

Fix the cause, not the symptom.

## The 5-Why Method

Ask "why" repeatedly until you reach a root cause that, if fixed, prevents the whole chain.

Example:
- Bug: enemy passes through wall
- Why? Collision check returned false
- Why? Positions were in different coordinate spaces
- Why? One was local, one was world
- Root cause: inconsistent use of `getWorldPosition()` vs `position`

## Signs You Are Patching Symptoms

- Adding a special-case `if` for one specific scenario
- The same bug reappears in a slightly different form
- You are adding a `setTimeout` to wait for something to be ready
- Your fix feels wrong even though it works

## Correct Approach

1. Map the full data flow from input to broken output
2. Find where the invariant first breaks
3. Fix at that point, not downstream
4. Add a test that would have caught this at root level
