---
name: create-pr
description: Create well-structured pull requests for Huntix features. Use when pushing a completed feature branch or hotfix.
source: https://officialskills.sh/getsentry/skills/create-pr
---

# Create Pull Request

Every PR should be easy to review and easy to revert.

## PR Checklist

- [ ] Title is imperative: "Add Vesol flame aura particle system"
- [ ] Description explains WHAT changed and WHY
- [ ] Links to the relevant design doc or GDD section
- [ ] Screenshots or GIF for visual changes
- [ ] No unrelated changes in the diff
- [ ] Tests added or updated
- [ ] No `console.log` left in production code

## PR Description Template

```
## What
Brief description of the change.

## Why
Reason for the change — links to GDD / issue.

## How
Key implementation decisions made.

## Testing
How to manually verify this works.

## Screenshots
(attach if visual change)
```

## Branch Naming

- `feat/vesol-flame-aura`
- `fix/enemy-depth-sort`
- `chore/add-cursor-skills`
- `perf/instanced-enemies`
