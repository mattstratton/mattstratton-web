# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A self-hosted Astro static site replacing `speaking.mattstratton.com` (previously on Notist). The north star is **asset ownership and durability**: every slide, thumbnail, and video reference lives in this repo, the live site depends on nothing but static files + a static-site generator, and it should keep working for 15 years. Full background: `docs/plans/speaking-site-rebuild.md` and `prd.md`.

## Stack

Astro 6 (static), Tailwind 4 (via `@tailwindcss/postcss` — `@tailwindcss/vite` is incompatible with Astro 6's default rolldown-vite, see [withastro/astro#16542](https://github.com/withastro/astro/issues/16542)), TypeScript strict. **Node 24**. Deploys to Netlify.

Astro 7 was not adopted alongside Astro 6: it broke the root site's (mattstratton.com) dynamic `.png.ts` OG-image endpoints when combined with `trailingSlash: 'always'` there (an upstream Astro 7 bug in how dynamic file-extension endpoints handle trailing slashes). This site's `trailingSlash: 'never'`/`build.format: 'file'` config wasn't separately tested against Astro 7 — both sites were kept on the same Astro major for consistency. Revisit once the upstream bug is fixed, testing this site's config independently.

## Commands

```bash
npm run dev        # local dev server
npm run build      # astro build only (no asset generation — see pipeline below)
npm run preview    # preview production build

# Local, pre-commit asset pipeline (NOT run on the host — see "Why local"):
npm run ingest     # fetch from Notist → content files + download/optimize assets (idempotent)
npm run optimize   # optimize any originals/*.pdf → slides/*.pdf at 300dpi (new decks)
npm run rasterize  # render slides/ → public/slides/*.webp viewer images

npx astro check    # type-check
```

`ingest` flags: `--refresh` (bypass cache), `--limit=N` (sample first N talks). `optimize`/`rasterize`: `--force` (redo existing).

## The asset pipeline (the core architecture)

Slide assets are generated **locally, pre-commit** — never on the deploy host. Static hosts (Netlify/CF/Vercel) build without root, so they can't run `pdftoppm` (poppler) or `gs` (Ghostscript). Generating locally and committing the output keeps the deploy build a pure `astro build`: fast, host-agnostic, no external tools.

```
Notist ──ingest──▶ originals/{id}.pdf ──optimize(gs 300dpi)──▶ public/slides/{id}.pdf ──┐
        (gitignored, full-res archive)     (committed + served, download artifact)        │
                                                                          rasterize       │
                                              public/slides/{id}/{n}.webp ◀────────────────┘
                                              (committed + served, 1280px viewer images)
```

Everything **served** lives under `public/slides/` (Astro only deploys `public/`):

- **`originals/{id}.pdf`** — full-res Notist exports (bloated, up to 77MB). Gitignored durable archive, local only.
- **`public/slides/{id}.pdf`** — 300dpi web-optimized PDF, **committed + served**. The "Download PDF" artifact and the rasterize source for PDF talks.
- **`public/slides/{id}/{n}.webp`** — 1280px per-slide viewer images, **committed + served**.
- **`slides/{id}/*.png`** — committed PNG source for the 9 talks that have Notist images but no PDF (rasterize input; not served directly).
- **`public/thumbnails/{id}.{ext}`** — committed talk thumbnails.

Gotcha: optimized PDFs must live in `public/slides/` (served), not a repo-root `slides/` (which Astro does not deploy) — else "Download PDF" 404s in production.

Requires `pdftoppm` and `gs` installed **locally** (`brew install poppler ghostscript`). The fallback if a tool is missing is to copy the original through, so the pipeline never hard-fails — but install them for real output.

**Adding a future talk (post-Notist):** drop the deck at `originals/{name}.pdf` → `npm run optimize` (→ `public/slides/{name}.pdf`) → `npm run rasterize` (→ `public/slides/{name}/*.webp`) → author `src/content/talks/{name}.md` → commit `public/slides/`. (Issue #2 will add a skill to scaffold this.)

## Content model

Two collections in `src/content.config.ts`:

- **`talks`** — one entry per *delivery* (same abstract at 3 events = 3 records, matching Notist). File `src/content/talks/{notistId}.md`.
- **`events`** — deduplicated venues. File `src/content/events/{eventId}.md`. Carries `latitude`/`longitude`, which place the event on the `/map`. **Virtual convention:** online events use `location: "Virtual"` and carry no lat/lng — they render off-map in the map page's "Delivered virtually" list, never as a dot. "No coordinates" is the map's predicate for off-map, and today it's exactly the `location: "Virtual"` events.

### Critical gotchas (learned the hard way)

- **Never name a talk field `slug`.** Astro's glob loader uses a `slug` frontmatter field as the entry id, and the same talk at multiple events shares one Notist slug → collisions that silently overwrite talks. The field is `notistSlug`; entry ids come from filenames (= unique `notistId`).
- **Videos are not in the Notist JSON.** They're resolved at ingest by scraping the talk HTML for a `notist.ninja/embed/{id}` proxy, then fetching that to get the real `youtube`/`vimeo` id. Stored as `video: {provider, id}`.
- **Some Notist fields lie:** `download` is `"/"` (not a URL) when there's no PDF; `image` can be `null`. Guard both.
- **Idempotency:** ingest preserves a top-level `manual:` frontmatter key across re-runs; everything else is regenerated. Raw responses cache to `scripts/.cache/`.

## URLs

Mirror Notist exactly: `/{notistId}/{notistSlug}`, no trailing slash, no `/username` segment (`trailingSlash: 'never'`, `build.format: 'file'`). This is the hardest constraint — breaking it breaks every inbound link. `public/_redirects` (generated by ingest) maps bare `/{id}` → canonical. Don't change the URL shape without a redirect plan.

## Coverage (106 talks, 2012–2026)

76 PDF decks · 9 image-only decks · 21 no-slides · 36 videos (35 YouTube, 1 Vimeo) · 85 thumbnails · 93 events. Every missing-asset case must degrade gracefully — pages hide absent sections, never error.

## Accessibility (issue #4) — keep it this way

- Semantic headings (one `<h1>` per page), `alt` on meaningful images (`alt=""` + `aria-hidden` on decorative ones).
- Visible focus is enforced globally (`:focus-visible` in `global.css`); don't remove outlines.
- `prefers-reduced-motion` is respected globally; don't add unconditional smooth-scroll/animations.
- Skip-to-content link in `Base.astro`; keep `<main id="main">`.
- Body text must hit WCAG AA contrast — use `text-slate-500`/`600`+ on white, not `slate-400`.
- Run the `accessibility-checker` skill against the built site after UI changes.

## Mobile-first (issue #3)

Design/verify at narrow widths first. Nav wraps, slide browser and cards are responsive. Check tap targets and overflow when adding UI.

## Development workflow (how Matty wants non-trivial changes built)

For anything more than a trivial fix (new skills, features, refactors), run the full superpowers flow — every time, no shortcuts:

1. **brainstorming** — settle scope/approach one question at a time and surface unexamined assumptions *before* writing code.
2. **writing-plans** — a committed design spec (`docs/superpowers/specs/`), then a TDD implementation plan (`docs/superpowers/plans/`).
3. **executing-plans** — inline, TDD (failing test → implement → pass), one small commit per task.
4. **finishing-a-development-branch** — **always push + open a PR** (option 2) from a dedicated branch off `main`. Never merge straight to `main`; the PR is the review gate, and the brainstorm/spec/plan paper trail is the point.

Keep PRs scoped to one concern. End commit messages with the `Co-Authored-By` trailer.
