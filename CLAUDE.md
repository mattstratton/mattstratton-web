# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal site + blog for mattstratton.com. **Astro 5 + Tailwind CSS v4**, deployed to Netlify. Migrated from Hugo (hugo-profile theme) in 2026; it's a deliberate sibling of the speaking site (`mattstratton-speaking`) — same warm-paper design system, differentiated by a teal/amber accent.

## Monorepo structure

This repository holds **three independent subprojects**, merged together (with full git history via `git subtree`) for a single place to manage the whole mattstratton.com stack. There is no shared tooling, no npm workspaces, and no shared package.json — each subproject is fully self-contained and needs its own `npm install` run from inside its own directory.

- **`/` (this directory)** — this site, mattstratton.com. See the rest of this file.
- **`mattstratton-speaking/`** — speaking.mattstratton.com, a separate Astro 5 + Tailwind v4 site with its own `netlify.toml`, `CLAUDE.md`, and Claude Code skills (`add-talk`, `resync-talk-memory`, `transcript-cleanup`). Deliberately different Astro config (`trailingSlash: 'never'`, `build.format: 'file'`) — do not try to unify it with this site's config.
- **`mattstratton-dev-to/`** — manages Matt's dev.to posts via a git-ownership-transfer model (see its own `CLAUDE.md`). Feeds the `crosspost-devto` script (see `scripts/`) that selectively republishes dev.to posts into this site's `/writing/` collection.

A design-system unification (the warm-paper CSS tokens are currently hand-copied between this site and the speaking site, not shared) is a deliberately deferred future project, not part of this merge.

**Claude Code skills note**: `mattstratton-speaking/.claude/skills/` (`add-talk`, `resync-talk-memory`, `transcript-cleanup`) are committed and are discovered correctly from a Claude Code session at this repo's root — confirmed working post-merge, no `cd` workaround needed.

**CLAUDE.md discovery**: this repo's root `CLAUDE.md` always loads for a Claude Code session started here; the nested `mattstratton-speaking/CLAUDE.md` and `mattstratton-dev-to/CLAUDE.md` are picked up automatically based on which subdirectory's files are being read or edited — no manual `cd` or extra config needed. Keeping three separate files is intentional, not an oversight: each subproject is a genuinely distinct, self-contained codebase (different stack details, URL rules, content models), so consolidating them into one file would just bloat it with irrelevant detail for whichever subproject a session isn't touching.

**GitHub Actions gotcha**: workflow files are ONLY discovered by GitHub at the true repo root's `.github/workflows/` — never in a subdirectory. `mattstratton-dev-to`'s workflows live at the root `.github/workflows/devto-import.yml` and `devto-publish.yml` (not nested under `mattstratton-dev-to/`), each scoped back to that subdirectory via `working-directory`/`files`/`paths` settings inside the workflow. If a future merged subproject brings its own `.github/workflows/`, they need the same treatment — move to root, rename to avoid collisions, keep the path scoping.

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
- `workouts` — workout history pulled from the Liftosaur REST API at build time (`src/lib/liftosaur.ts`), powering `/fitness/`. Liftosaur returns each workout as a compact Liftoscript-text blob rather than JSON, so `parseWorkoutText` extracts date/program/exercises/sets; PRs and trend sparklines are derived from that at render time (`computePersonalRecords`, `computeTrend`), not fetched separately.

**Homepage content** lives in `src/data/home.ts` (typed module, not a collection) — hero, about, experience, publications, featured talks, newsletter, contact. Section components are in `src/components/sections/`. The experience tabs are CSS-only (no JS).

**Layouts** (`src/layouts/`): `Base.astro` (root: head/OG meta, nav, footer), `PostLayout.astro` (archive posts), `WritingLayout.astro` (field guide), `Page.astro` (standalone markdown pages like hire-me, privacy-policy).

**OG cards**: generated at build by `src/lib/og-card.ts` (satori + sharp) via `src/pages/og/*` routes — for the homepage, sections, and per-writing-post only (legacy posts share `/og/default.png`).

**Redirects**: `public/_redirects` (Netlify) — vanity redirects, speaking→speaking.mattstratton.com, legacy pages→homepage anchors, old Hugo pagination, and a few edge-case taxonomy slugs.

**Static assets**: `public/` is served at the root path (img/, wp-content/, fav.png, CV PDF). `public/wp-content/` (76MB) holds legacy post images; ~760 are unreferenced WordPress variants and could be pruned after a careful srcset-aware audit.

## Environment variables

- `BUTTONDOWN_API_KEY` — used by `src/lib/buttondown.ts` to fetch the newsletter archive at build. Set it in Netlify's env vars and in a local `.env` (gitignored). If absent, the archive builds empty (no failure). Generate it in Buttondown → Settings → API. To refresh the archive when a new issue sends, point a Buttondown webhook at a Netlify build hook.
- `BUTTONDOWN_API_BASE` — optional override if Buttondown moves the API base off `api.buttondown.email/v1`.
- `LIFTOSAUR_API_KEY` — a Liftosaur premium API key (`lftsk_...`), used by `src/lib/liftosaur.ts` to fetch workout history for `/fitness/` at build. Set it in Netlify's env vars and in a local `.env` (gitignored). If absent, `/fitness` builds empty (no failure). The page rebuilds via `.github/workflows/fitness-rebuild.yml` (manual `workflow_dispatch` or a daily cron), which POSTs to a Netlify build hook stored as the `NETLIFY_BUILD_HOOK_FITNESS` GitHub Actions secret.
- `LIFTOSAUR_API_BASE` — optional override if Liftosaur moves the API base off `www.liftosaur.com/api/v1`.

The signup form is driven by `newsletter.buttondownUser` in `src/data/home.ts` (public username, not a secret).

## Migration history

The original Hugo source (`content/`, `config.yml`, `layouts/`, `themes/hugo-profile`, `bin/`, `static/`) was **removed** after the Astro site was confirmed in production. It lives in git history if ever needed — `scripts/migrate-posts.ts` still documents the legacy-post transformation, but re-running it would require restoring `content/post/` from history first. The migrated posts in `src/content/posts/` are now the source of truth.
