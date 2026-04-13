---
name: vercel-deploy
description: Deploy Huntix to Vercel for Vibe Jam 2026. Use when deploying to production or creating preview URLs for testing.
source: https://officialskills.sh/openai/skills/vercel-deploy
---

# Vercel Deploy

Deploy Huntix to Vercel — keeps the game on a clean public URL (Vibe Jam rule 05).

## Setup

```bash
npm i -g vercel
vercel login
vercel --prod
```

## Key Settings for Huntix

- **Framework**: Vite (or vanilla static if no bundler)
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **No server-side rendering** — static export only

## Vibe Jam Requirements Checklist

- [ ] Game is accessible at public URL without login (rule 05)
- [ ] `<script async src="https://vibej.am/2026/widget.js"></script>` is in `index.html` (rule 02 — REQUIRED)
- [ ] No loading screens or heavy asset downloads on first visit (rule 08)
- [ ] Game runs on a single domain (required for widget tracking)

## Environment Variables

Set via Vercel dashboard or CLI — never commit secrets to the repo:

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

## Preview Deploys

Every branch push creates a preview URL automatically — share these for co-op playtesting before merging to main.
