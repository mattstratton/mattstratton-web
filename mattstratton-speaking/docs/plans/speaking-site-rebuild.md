# Speaking Site Rebuild — Implementation Plan


## Context

`speaking.mattstratton.com` currently runs on Notist. Two problems: **lock-in** (every talk Matty's ever given lives in someone else's DB) and **rot** (video embeds are already breaking; slide decks live on Notist's CDN and vanish the day the account lapses). The goal is **ownership and durability** — a plain-content Astro site in Matty's own repo that keeps working for 15 years with no third-party dependency that can break or be switched off. This is the low-risk pilot proving out Astro before any future migration of the main `mattstratton.com` Hugo site (explicitly out of scope — Phase 2).

Full requirements: `prd.md`. This plan supersedes the PRD where live data investigation contradicted its assumptions (see next section).

## What the live-data investigation changed vs the PRD

I fetched and analyzed all 106 talks against live Notist (2026-06-17). Verified facts that **alter the build**:

1. **Videos are NOT in the JSON export.** The PRD assumed a `video` field per talk. There is none. Videos are embedded only in the rendered HTML as `<iframe class="embedded-video" src="https://notist.ninja/embed/{embedId}">`. The real provider/id is one hop further: fetching that proxy yields `youtube.com/embed/{id}` (or vimeo). **The ingest pipeline must scrape HTML + resolve the proxy** — confirmed working end to end.
2. **PDF is a direct field.** Each talk JSON has `attributes.download` = the full PDF URL. No `deck-{hash}` construction needed (PRD overcomplicated this).
3. **Notist pre-renders slide images** at `on.notist.cloud/slides/deck{N}/large-{i}.png`. Useful as the slide source for the 9 talks that have images but no PDF.

### Verified coverage (all 106 talks)

| Asset | Count | Notes |
|---|---|---|
| Notist PDF (`download`) | 84 | rasterize these at build |
| Pre-rendered images, no PDF | 9 | download images directly; commit them |
| **Talks with NO slides** | 13 | degrade gracefully |
| Videos (35 YouTube + 1 Vimeo) | 36 | resolve via HTML→proxy; 2 edge cases to log |
| Resources | 55 talks / 332 links | `resources.data[]` = `{title,url,desc.html}` |
| Thumbnails | 85 | `image` is sometimes literally `null` — guard for it |
| Date range | 2012-09 → 2026-05 | 106 deliveries, 93 unique events |

## Decisions (locked)

- **Host:** Netlify (separate project/repo from the Hugo site)
- **Slides/repo:** Commit the 84 PDFs (source of truth) + the 9 image-only sets; rasterize PDFs→**WebP** at build via `pdftoppm`. CI installs poppler. ~150MB repo.
- **Styling:** Tailwind (Astro integration)
- **Abstracts:** render `blurb.html` as sanitized HTML as-is (lossless, simplest)
- **Videos:** auto-resolve during ingest; store `youtube:{id}` / `vimeo:{id}` in frontmatter; render a click-to-load facade (`lite-youtube-embed` / equivalent for Vimeo). Zero third-party JS until the visitor clicks.
- **URLs:** mirror Notist exactly — `/{id}/{slug}`, no trailing slash, no `/username` segment. `trailingSlash: 'never'` in Astro config.
- **Rendering:** fully static, zero runtime JS by default.

## Data model (Astro content collections, `src/content.config.ts`)

**`talks`** (one per delivery, file `src/content/talks/{id}.md`):
`notistId`, `title`, `slug`, `presentedOn` (Date), `publishedOn`, `timezone`, `event` (reference→events), `abstractHtml`, `slidesPdf` (path|null), `slideImageCount` (int, build fills/uses), `slideSource` ('pdf'|'images'|'none'), `video` (`{provider,id}`|null), `resources` (`{title,url}[]`), `thumbnail` (path|null).

**`events`** (file `src/content/events/{eventId}.md`): `notistEventId`, `name`, `date`, `location`, `url`. Deduplicated (93 unique). *Verify event JSON shape during ingest step 1 — not yet inspected live.*

## Implementation phases

### Phase 0 — Scaffold
- `npm create astro@latest` (minimal, TS strict), add Tailwind integration, `@astrojs/sitemap`.
- `astro.config.mjs`: `site: 'https://speaking.mattstratton.com'`, `trailingSlash: 'never'`, `build.format: 'file'` (or `'directory'` + verify Netlify pretty-URL behavior matches Notist paths).
- Define both collections in `src/content.config.ts` with the schemas above.
- `netlify.toml` (build command, publish dir, poppler via build image/plugin), commit `mattstratton.json` (already in repo).
- Save this plan to `docs/plans/speaking-site-rebuild.md`.

### Phase 1 — Ingest tooling (`scripts/ingest.ts`, the real work)
Idempotent, re-runnable, caches raw responses to `scripts/.cache/`. Run via `npm run ingest`.
1. Parse `mattstratton.json` → `data[0].relationships.data[]` (106 records). Author bio lives at `data[0].attributes.bio.html` (reference only; `/bio` is authored separately).
2. Per talk: derive `id` (strip `pr_`), `slug` (last path segment of `links.self`). Fetch `noti.st/mattstratton/{id}.json` → `blurb.html`, `download` (PDF), `resources.data[]`, `slidedeck.data[0].slides[].image`.
3. Fetch linked event JSON (`links.event`); dedupe into events collection.
4. **Video resolution:** fetch the rendered talk HTML, regex the `notist.ninja/embed/{embedId}` from the `embedded-video` iframe, fetch that proxy, extract `youtube.com/embed/{id}` or `player.vimeo.com/video/{id}` → store `provider:id`. Skip cleanly if absent. Log the ~2 unresolved/non-video embeds (SpeakerDeck-era).
5. Download PDF (`download`) → `slides/{id}.pdf`; thumbnail → `public/thumbnails/{id}.{ext}` (guard `image == null`).
6. For the 9 PDF-less-but-imaged talks: download `large-{i}.png` set → `public/slides/{id}/` and set `slideSource: 'images'`.
7. Write `src/content/talks/{id}.md` + `src/content/events/{eventId}.md`. **Never clobber hand-edited frontmatter** on re-run (e.g. merge, or only write managed fields).
8. Degrade gracefully on every missing asset (13 no-slide, 21 no-thumb, etc.) — log, never throw.

### Phase 2 — Build-time slide rasterization
- Astro integration hook (or prebuild script) runs `pdftoppm -r 150 -webp slides/{id}.pdf public/slides/{id}/` → `public/slides/{id}/{n}.webp` for the 84 PDFs.
- Skip if output exists (incremental). The 9 image-only talks already have images from ingest.

### Phase 3 — Talk detail page (`src/pages/[id]/[slug].astro`)
- `getStaticPaths` from the talks collection. Renders: title, event + date, sanitized abstract HTML.
- **Slide browser** (`src/components/SlideBrowser.astro`): prev/next + thumbnail strip + fullscreen, fed by `public/slides/{id}/*.webp`. CSS-only/`:target` where possible; minimal progressive-enhancement JS only for keyboard/fullscreen. "Download PDF" button (hidden when no PDF). Hide entirely when `slideSource: 'none'`.
- **Video facade** (`src/components/VideoEmbed.astro`): lite-youtube/lite-vimeo, click-to-load. Rendered only when `video` present.
- **Resources** section from `resources[]` (only when non-empty).

### Phase 4 — Archive + homepage
- `src/pages/index.astro`: intro + recent/featured talks + links to archive and `/bio`.
- `src/pages/talks.astro` (or `/`): all talks reverse-chron, grouped/filterable by year. Each item: thumbnail (fallback for the 21), title, event, date. Client-side title/event filter = nice-to-have, not v1-blocking.

### Phase 5 — Bio / speaker kit (`src/pages/bio.astro`)
Authored, not migrated (needs Matty's bios + headshots). Headshots in a few crops (each downloadable); one-liner / short / long bios with copy-to-clipboard; pronouns, socials, role. Optional "download all" zip. **Blocked on Matty supplying assets** — build the template, stub content.

### Phase 6 — URL parity + cutover
- Verify a sample across 2012→2026 resolves at `/{id}/{slug}`, including no-thumb / no-video / no-slide / shared-event cases.
- `sitemap.xml` (integration), `robots.txt` allows indexing. Redirect/alias map for any path that can't be reproduced + `.json` endpoints if anything depends on them.
- Deploy to Netlify preview; spot-check slide browser + PDF download + video facades.
- **Only after all assets are archived locally + verified**, re-point the `speaking.mattstratton.com` CNAME from Notist to Netlify. Keep Notist alive until DNS propagates and the new site is confirmed serving — *then* cancel (cancelling early kills CDN assets mid-migration).

## Commands (target state)
```bash
npm run dev       # local dev
npm run ingest    # fetch/resolve/download from Notist → content + assets (idempotent)
npm run build     # rasterize PDFs + astro build
npm run preview   # preview production build
```

## Verification
- **Ingest:** after `npm run ingest`, assert 106 talk files, ~93 event files, 84 PDFs in `slides/`, 36 talks with a `video:` field, 0 references to `noti.st`/`on.notist.cloud`/`notist.ninja` remaining in generated content. Re-run ingest → confirm idempotent (no spurious diffs, hand-edits preserved).
- **Build:** `npm run build` succeeds; `public/slides/{id}/` populated for all 93 slide-bearing talks; no broken image refs.
- **Pages:** spot-check 6 talks (one per profile: full / no-thumb / no-video / no-slide / vimeo / shared-event). Slide browser navigates, PDF downloads, video facade loads real player on click.
- **URL parity:** `curl -I` a sample of `/{id}/{slug}` paths against the built site (and on Netlify preview) → 200, no redirects.
- **Cutover gate:** preview deploy green + asset archive verified before any DNS change.

## Open items to resolve during build
- Inspect event JSON shape live (only the index + per-talk JSON verified so far).
- 2 embed ids (`T76YVa`, `5k8xTs`) resolved to neither YT/Vimeo/SpeakerDeck — confirm during ingest, log if genuinely empty.
- Confirm Netlify build image provides `pdftoppm` (poppler) or add an install step/plugin.
- Bio page content + headshots from Matty (blocks Phase 5 content, not template).
