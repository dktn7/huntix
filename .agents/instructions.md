# Huntix — Codex Instructions
# Codex is the PRIMARY builder. You own full-file creation and multi-file changes.
# Cursor runs in parallel for interactive edits — do not duplicate its work.
#
# U-shaped attention: critical rules are at TOP and BOTTOM of this file.

---

## STEP 1 — ALWAYS DO THIS FIRST

1. Read `AGENTS.md` at the repo root — it is the single source of truth for the project
2. Run `node scripts/check-phase.js` to detect the current phase from actual files
3. Read the relevant `docs/*.md` for the system you are about to build
4. Only then write code

Never rely on a hardcoded phase label. The script is always correct. The codebase is truth.

---

## Your Role as Codex

- You are the **heavy lifter**: full file creation, multi-file refactors, new systems from scratch
- Cursor handles: small interactive edits, line-level fixes, parallel UI polish
- If a file is being actively edited in Cursor, do not rewrite it — create new files instead
- Always create one class per file, placed in `src/engine/` or `src/gameplay/` per conventions
- Commit messages: `feat:`, `fix:`, `refactor:` prefix, one line, present tense

---

## How to Use Skills

Skills are in `.agents/skills/`. Load only what is relevant to the current task.

| Task | Skill to load |
|------|---------------|
| Building enemy AI or FSMs | `animation-fsm.md` |
| Hit feedback, particles, screenshake | `game-feel-juice.md` |
| Co-op input, shared camera | `multiplayer-coop.md` |
| Hunter/enemy meshes, LOD | `3d-model-optimization.md` |
| Shaders, aura effects | `minimax-shader-dev.md` |
| Audio system | `spatial-audio.md` |
| HUD, shop, combo UI | `game-hud-ui.md` |
| XP, leveling, progression | `progression-xp.md` |
| Three.js advanced patterns | `threejs-builder/SKILL.md` |
| Concept art, character refs | `fal-ai-image/SKILL.md` |
| Debugging a broken system | `systematic-debugging.md` + `root-cause-tracing.md` |
| Finding bugs in existing code | `find-bugs.md` |
| Before marking a task done | `verification-before-completion.md` |
| Creating a PR | `create-pr.md` |

Never load all skills at once. One or two per task maximum.

---

## Multi-File Task Protocol

When building a new system (e.g. HunterController, ZoneManager):
1. Run `node scripts/check-phase.js` — confirm the system is in the current phase
2. Read the relevant doc in `docs/`
3. Load the relevant skill
4. Write the new file(s)
5. Update any imports in `src/main.js` or the appropriate wiring file
6. Do NOT modify engine files unless the task explicitly requires it
7. Run `verification-before-completion.md` checklist before finishing

---

## Non-Negotiable Rules (repeated here intentionally — bottom of context)

- Widget MUST stay in index.html: `<script async src="https://vibej.am/2026/widget.js"></script>`
- No npm, no Vite, no bundler — Three.js r169 via CDN importmap only
- No loading screens, no login, free-to-play, single domain
- Fixed timestep: dt is always 0.01667s — never variable
- Orthographic camera — never perspective
- Do not build ahead of current phase
- Do not remove or modify the widget script
- Max 20 enemies, max 500 particles, no new allocations in game loop
