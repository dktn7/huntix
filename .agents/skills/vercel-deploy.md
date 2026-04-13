---
name: vercel-deploy
description: Deploy Huntix to Vercel for Vibe Jam 2026. Use when deploying to production or creating preview URLs.
---

# Vercel Deploy

## Setup

```bash
npm i -g vercel
vercel login
vercel --prod
```

## Key Settings

- **Framework**: None (vanilla static, no bundler)
- **Build command**: leave empty or `echo ok`
- **Output directory**: `.` (root, since index.html is at root)

## Vibe Jam Requirements Checklist

- [ ] Public URL, no login required (rule 05)
- [ ] `<script async src="https://vibej.am/2026/widget.js"></script>` in `index.html` (rule 02 — REQUIRED)
- [ ] No loading screens or heavy asset downloads (rule 08)
- [ ] Game runs on single domain (widget tracking requirement)

## Environment Variables

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
```

## Preview Deploys

Every branch push creates a preview URL automatically — share for playtesting before merging to main.
