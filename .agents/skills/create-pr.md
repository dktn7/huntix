---
name: create-pr
description: Create well-structured pull requests for Huntix features.
---

# Create Pull Request

Every PR should be easy to review and easy to revert.

## Checklist

- [ ] Title is imperative: "Add Vesol flame aura particle system"
- [ ] Description explains WHAT changed and WHY
- [ ] Links to relevant GDD section or doc
- [ ] Screenshots or GIF for visual changes
- [ ] No unrelated changes in the diff
- [ ] Tests added or updated
- [ ] No `console.log` in production code

## PR Description Template

```
## What
Brief description of the change.

## Why
Reason — links to GDD / issue.

## How
Key implementation decisions.

## Testing
How to manually verify this works.
```

## Branch Naming

- `feat/vesol-flame-aura`
- `fix/enemy-depth-sort`
- `chore/add-codex-skills`
- `perf/instanced-enemies`
