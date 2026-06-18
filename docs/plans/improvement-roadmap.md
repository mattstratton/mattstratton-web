# speaking.mattstratton.com — improvement roadmap

## Context

The site has hit its v1 goal: it does everything Notist did (106 talk deliveries, 93 events,
36 videos, client-side fuzzy search, dynamic OG cards, slide browser, privacy video facade,
multi-format bio export) with no runtime dependency on any external service. This roadmap is
the "now make it better" pass. It is a **prioritized menu, not a commitment** — each initiative
is independently shippable. We pick what to build, when.

### Guiding principles (inherited from the project's north star)

1. **Durability over cleverness.** Every feature must keep working as a pile of static files for
   ~15 years. Own the asset.
2. **No new *runtime* external dependencies.** Build-time/local tools (yt-dlp, poppler) are fine —
   they generate committed artifacts. The *deployed* site stays pure `astro build`. Any exception
   gets discussed first.
3. **Graceful degradation.** Missing transcript / no lat-long / image-only deck → section hides,
   never errors. (Already the house style.)
4. **Accessibility + mobile-first stay non-negotiable.** Run the `accessibility-checker` skill
   after any UI work; verify at narrow widths first.
5. **Ship via PR.** Each initiative lands as its own branch + pull request off `main` — never
   committed straight to `main`. One initiative ≈ one reviewable PR.

### The structural insight that shapes everything

`notistSlug` is the **abstract / talk-identity** key, already present in every file and shared
across re-deliveries. Verified: 106 deliveries collapse to **41 distinct abstracts**, 23 of which
were delivered more than once (one 17×). So "the same talk at many events" is free to model — no
new data, just grouping. This unlocks aggregation, dedups search, and is the natural home for tags.
It's listed as Initiative A because several later items build on it.

---

## Tier 1 — Foundational, highest payoff

### A. Talk aggregation (canonical talks vs. deliveries)

**What:** Introduce a "canonical talk" concept keyed on `notistSlug`. A new page `/talk/{notistSlug}`
shows the abstract once, the best available video + slides, and a "Delivered N times" timeline
linking each delivery (event, date, location). Existing per-delivery pages `/{id}/{slug}` stay
(URL contract is sacred) but gain a "part of this talk, also delivered at…" cross-link.

**Why it fits:** Pure information architecture win from data we already have. Turns 106 flat
records into 41 richer stories. "Fight, Flight, or Freeze ×17" becomes a feature, not noise.

**Approach:**
- Build a derived map at build time: `groupBy(talks, notistSlug)` → pick a "representative" delivery
  (e.g. most recent with video+slides) for hero content; collect all deliveries for the timeline.
- New route `src/pages/talk/[slug].astro`. Reuse `TalkCard.astro` for the delivery list and the
  existing `VideoEmbed` / `SlideBrowser` for hero media.
- Add `/talk/{slug}` to the sitemap; consider linking it from `talks.astro` (toggle: "by talk" vs
  "by delivery").
- No schema change required; grouping is computed, not stored.

**Effort:** Medium. **Payoff:** High. **Depends on:** nothing.
**Open question:** does `talks.astro` become abstract-first, or do we add a parallel `/talks/by-topic`
view and leave the chronological archive alone? (Recommend: keep chronological archive, add canonical
talk pages + cross-links first, decide on a browse-by-talk view after seeing it.)

### B. Transcripts — display + search (the durability headline)

**What:** A committed transcript sidecar per video talk. Rendered as a readable, collapsible section
on the talk page, and its text fed into search. This is the **archival record that survives the video
dying** — currently videos are the one asset class we own nothing of.

**Approach:**
- **Generation (local, pre-commit):** new `scripts/transcripts.ts` (`npm run transcripts`) that runs
  `yt-dlp --write-auto-sub --write-sub --sub-format vtt --skip-download` for each talk with a
  `video.provider === 'youtube'`, then cleans the VTT → readable text. yt-dlp is a *local* tool;
  output is committed. Mirrors the optimize/rasterize pattern exactly.
- **Storage:** `public/transcripts/{notistId}.vtt` (durable, timestamped, served for download) plus a
  cleaned `{notistId}.txt`/`.md` for display + indexing. Follows the existing per-`{id}` sidecar
  convention. Manual transcripts (Vimeo, corrections) drop in the same place and are never overwritten.
- **Idempotency:** record transcript presence so ingest's `manual:`-preservation model isn't disturbed;
  transcript files live outside frontmatter, so re-ingest can't clobber them.
- **Display:** new `Transcript.astro` (collapsible `<details>`, reduced-motion-safe, AA contrast),
  added to `src/pages/[id]/[slug].astro` after the video. "Download .vtt" link for durability.
- **Schema:** add `hasTranscript: boolean` (or `transcript: string | null` path) to
  `src/content.config.ts`, populated by the generation script.

**Search architecture decision (applies to B + C):** transcripts are big — ~35KB plain text per
45-min talk × 36 ≈ **1.3MB raw**, vs. today's tiny index. Do **not** stuff full text into the existing
`search-index.json` (it's lazy-loaded whole on first search-open). Instead:
- Keep the current lightweight index for instant title/facet search.
- Add a **separate `deep-index.json`** (transcript + slide text, see C) loaded on demand — e.g. when
  the user actually types a query, or behind a "search inside talks" toggle. Fuse.js can search a second
  collection; results merge/dedup by canonical talk (ties into A).
- Add a `hasTranscript` facet to `Search.astro` alongside the existing video/slides facets.

**Effort:** Medium-High (generation script + search re-architecture). **Payoff:** High (durability +
search). **Depends on:** search-index split is shared with C; nice to land A first so search dedups by talk.
**Open question:** auto-subs are messy (no punctuation/speaker labels). Ship raw auto-subs as v1 and
allow manual replacement, or invest in light cleanup (sentence segmentation)? (Recommend: raw + manual
override path; cleanup is a later polish.)

---

## Tier 2 — Durability + search synergy

### C. Slide-text extraction

**What:** Pull the text layer out of the 76 PDF decks so slide content is searchable *and* survives as
text. Same durability play as transcripts, for decks.

**Why it's cheap:** `pdftotext` ships with **poppler, which is already a local dependency** (we use
`pdftoppm` to rasterize). No new tool.

**Approach:** extend `scripts/rasterize.ts` (or a sibling) to also emit `public/slides/{id}.txt` from the
optimized PDF. Feed into the same `deep-index.json` from B. Caveat to surface in UI/docs: the 9
image-only decks have no text layer (would need OCR/tesseract — explicitly out of scope unless wanted).

**Effort:** Low-Medium (rides existing pipeline + the B search split). **Payoff:** Medium-High.
**Depends on:** the deep-index split from B.

### D. Topic / tag taxonomy

**What:** A small controlled vocabulary of topics (DevOps, incident response, psychology/teams, chaos
engineering, culture…) attached to talks. Powers topic browse and "related talks."

**Why it pairs with A:** tag the **41 abstracts, not 106 deliveries** — tagging effort drops ~60%, and
tags naturally live on the canonical talk. Store in the `manual:` frontmatter key so ingest preserves
them across re-runs (existing mechanism — `scripts/ingest.ts` already round-trips `manual:`).

**Approach:** add `tags: string[]` under `manual:` in talk frontmatter (applied per abstract); render as
chips on talk/canonical pages; new `/topic/{tag}` index pages; add tags to search records + a tag facet.
Optional: LLM-assisted first-pass tagging from abstracts, human-reviewed.

**Effort:** Medium (the manual tagging is the real cost; code is light). **Payoff:** Medium-High.
**Depends on:** A (so tags attach to abstracts). **Open question:** hand-curate the vocabulary up front,
or LLM-suggest then prune? (Recommend: LLM-suggest from the 41 abstracts, you prune to a tight set.)

---

## Tier 3 — Navigation & presence

### E. Per-event pages

**What:** `/event/{notistEventId}` listing every delivery at that venue. Events are already a full
collection (93 records) with names, dates, locations, URLs — currently rendered nowhere as pages.

**Approach:** new `src/pages/event/[id].astro`, reuse `TalkCard`; link event names (currently plain text
on talk pages) to these. Add to sitemap + OG card generator (reuse `renderOgCard` with an "EVENT" badge).

**Effort:** Low-Medium. **Payoff:** Medium. **Depends on:** nothing (complements A).

### F. Events map (issue #1)

**What:** Render the already-captured `latitude`/`longitude` as a "where I've spoken" map.

**Durability caveat (discuss):** real slippy maps pull tiles from an external server (Mapbox/OSM) —
violates the no-runtime-external-dependency principle. **Recommend a static SVG world/dot map** (e.g.
project committed GeoJSON country outlines + plot dots), zero external calls, fully owned. A real
interactive tile map is possible but would be the explicit exception the principles call out.

**Approach:** build-time component that reads event coords, projects to an SVG, plots clickable dots
linking to event pages (E) or filtered talk lists. Reduced-motion-safe, with an accessible text-list
fallback of locations.

**Effort:** Medium. **Payoff:** Medium (delight/portfolio). **Depends on:** E for the dot links.

---

## Noted but not prioritized this round

- **RSS / JSON feed** of talks — zero-dep, easy, natural for an archive. Park it; trivial to add when wanted.
- **OCR for image-only decks** — only if slide-text (C) proves valuable and the 9 gaps annoy us.
- **Auto-tagging quality / transcript cleanup** — polish passes on D and B respectively.

---

## Suggested sequencing

1. **A** (aggregation) — foundational, no data cost, makes search + tags better.
2. **B** (transcripts) — the durability headline; establishes the deep-index search split.
3. **C** (slide text) — rides B's search split, near-free given poppler.
4. **E** (per-event pages) — small, complements A.
5. **D** (tags) — once A exists so tags attach to abstracts.
6. **F** (map) — last; depends on E and needs the static-vs-tiles decision.

## Verification (per initiative, when built)

- **A/E:** `npm run build` then `npm run preview`; spot-check a high-count talk (Fight/Flight/Freeze →
  expect 17 deliveries listed) and an event page; confirm `/{id}/{slug}` URLs unchanged; check sitemap
  includes new routes. Run `accessibility-checker`.
- **B/C:** run the generation script with `--limit`; confirm sidecar files land in `public/transcripts/`
  & `public/slides/{id}.txt`; build; open a video talk page, expand transcript, confirm "Download .vtt";
  open search, toggle "search inside talks", query a phrase that only appears in a transcript/slide and
  confirm a hit; verify the lightweight index still loads instantly.
- **D:** confirm tags survive a re-run of `npm run ingest` (the `manual:` round-trip); `/topic/{tag}`
  lists correct talks; tag facet filters search.
- **F:** confirm zero network requests to map-tile hosts in devtools; dots link correctly; text fallback
  present.
- Always: `npx astro check` clean, narrow-width pass, `accessibility-checker` after UI changes.
