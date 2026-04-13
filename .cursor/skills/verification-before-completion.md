---
name: verification-before-completion
description: Validate that work is fully complete before marking a task done. Use before closing any feature branch or declaring a game mechanic finished.
source: https://github.com/obra/superpowers/blob/main/skills/verification-before-completion/SKILL.md
---

# Verification Before Completion

Do not say something is done until it is actually done and verified.

## Checklist Before Marking Complete

- [ ] The feature works in the browser (not just locally compiled)
- [ ] No console errors or warnings
- [ ] Tested at 60fps under normal game conditions
- [ ] Tested with 2-4 players if multiplayer feature
- [ ] Edge cases handled (empty state, max enemies, death, respawn)
- [ ] No memory leaks (Three.js objects disposed on removal)
- [ ] Mobile/low-end GPU fallback checked if applicable
- [ ] Vibe Jam widget script still present in `index.html`

## For Vibe Jam Specifically

- Verify game loads in <3 seconds on a clean browser (no heavy downloads)
- Verify the `<script async src="https://vibej.am/2026/widget.js"></script>` tag is in `index.html`
- Verify game is accessible at the public URL without login
