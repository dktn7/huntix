---
name: verification-before-completion
description: Validate work is fully complete before marking a task done. Use before closing any feature or declaring a mechanic finished.
---

# Verification Before Completion

Do not say something is done until it is verified.

## Checklist Before Marking Complete

- [ ] Feature works in the browser at the public URL
- [ ] No console errors or warnings
- [ ] Tested at 60fps under normal game conditions
- [ ] Tested with multiple players if co-op feature
- [ ] Edge cases handled (empty state, max enemies, death, respawn)
- [ ] No memory leaks (Three.js objects disposed on removal)
- [ ] Total asset payload still < 3MB

## Vibe Jam Specific

- [ ] Game loads in < 3 seconds on clean browser
- [ ] `<script async src="https://vibej.am/2026/widget.js"></script>` present in `index.html`
- [ ] Game accessible at public URL without login
- [ ] Runs on single domain
