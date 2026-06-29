# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal site + blog for mattstratton.com. **Astro 5 + Tailwind CSS v4**, deployed to Netlify. Migrated from Hugo (hugo-profile theme) in 2026; it's a deliberate sibling of the speaking site (`mattstratton-speaking`) — same warm-paper design system, differentiated by a teal/amber accent.

## Commands

```bash
npm run dev        # local dev server (http://localhost:4321)
npm run build      # production build → dist/
npm run preview    # preview the built site
npm run migrate    # re-run the legacy-post converter (content/post → src/content/posts)
npm test           # run script + lib unit tests
```

Node **20** (see `netlify.toml`). Netlify builds via `npm run build`, publishes `dist/`.

## Architecture

**URL preservation is the prime directive.** `astro.config.mjs` sets `trailingSlash: 'always'` + `build.format: 'directory'` to reproduce the old Hugo directory-style URLs byte-for-byte. Do not change those without re-running the URL diff (below).

**Content collections** (`src/content.config.ts`):
- `posts` — the 2,630-post legacy archive (2001–2020), bulk-converted from Hugo. The load-bearing `permalink` field carries each post's exact old URL and drives `src/pages/[...permalink].astro` (a catch-all that reproduces every legacy URL). Never add a `slug` field (the glob loader treats it as the entry id).
- `writing` — the evergreen Postgres "field guide" authored going forward. Clean `/writing/<slug>` URLs, grouped by `part` on the index.

**Homepage content** lives in `src/data/home.ts` (typed module, not a collection) — hero, about, experience, publications, featured talks, newsletter, contact. Section components are in `src/components/sections/`. The experience tabs are CSS-only (no JS).

**Layouts** (`src/layouts/`): `Base.astro` (root: head/OG meta, nav, footer), `PostLayout.astro` (archive posts), `WritingLayout.astro` (field guide), `Page.astro` (standalone markdown pages like hire-me, privacy-policy).

**OG cards**: generated at build by `src/lib/og-card.ts` (satori + sharp) via `src/pages/og/*` routes — for the homepage, sections, and per-writing-post only (legacy posts share `/og/default.png`).

**Redirects**: `public/_redirects` (Netlify) — vanity redirects, speaking→speaking.mattstratton.com, legacy pages→homepage anchors, old Hugo pagination, and a few edge-case taxonomy slugs.

**Static assets**: `public/` is served at the root path (img/, wp-content/, fav.png, CV PDF). `public/wp-content/` (76MB) holds legacy post images; ~760 are unreferenced WordPress variants and could be pruned after a careful srcset-aware audit.

## Environment variables

- `BUTTONDOWN_API_KEY` — used by `src/lib/buttondown.ts` to fetch the newsletter archive at build. Set it in Netlify's env vars and in a local `.env` (gitignored). If absent, the archive builds empty (no failure). Generate it in Buttondown → Settings → API. To refresh the archive when a new issue sends, point a Buttondown webhook at a Netlify build hook.
- `BUTTONDOWN_API_BASE` — optional override if Buttondown moves the API base off `api.buttondown.email/v1`.

The signup form is driven by `newsletter.buttondownUser` in `src/data/home.ts` (public username, not a secret).

## Migration history

The original Hugo source (`content/`, `config.yml`, `layouts/`, `themes/hugo-profile`, `bin/`, `static/`) was **removed** after the Astro site was confirmed in production. It lives in git history if ever needed — `scripts/migrate-posts.ts` still documents the legacy-post transformation, but re-running it would require restoring `content/post/` from history first. The migrated posts in `src/content/posts/` are now the source of truth.
