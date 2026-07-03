# Design: `add-talk` skill (issue #2)

**Date:** 2026-06-18
**Status:** Approved (design); pending implementation plan
**Issue:** [#2 — add Claude skills for content updating](https://github.com/mattstratton/mattstratton-speaking/issues/2)

## Problem

Adding a talk after the Notist era is a fragile, multi-step manual dance
(per `CLAUDE.md`): stage a PDF in `originals/`, run `optimize`, run
`rasterize`, hand-author the talk markdown, find-or-create an event record,
generate a thumbnail, and commit `public/slides/`. Every step is easy to get
subtly wrong, and the content schema has sharp edges (the `notistSlug`-not-`slug`
trap, `slideSource` enum, event references). Issue #2 asks for a skill to make
this easy — and calls out the "non-friendly event slug naming" specifically.

This spec covers the **`add-talk`** skill, with event find-or-create folded in.
Two adjacent skills (`attach-video`, bulk import) are explicitly out of scope and
will get their own specs later.

## Decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| First skill to build | `add-talk`, with event find-or-create folded in |
| URL scheme for new talks | `/{year}/{slug}` (e.g. `/2026/escaping-iiot-pilot-purgatory`) |
| Identity model | **Decouple**: `talk.id` (filename) = identity + asset key; `notistId` optional (legacy URL marker only) |
| Interaction | Conversational interview, skipping anything front-loaded in the invocation |
| Geocoding | Nominatim (OSM) + confirm, with manual-paste fallback; runs once at authoring time, coords committed |
| Implementation approach | Thin `SKILL.md` orchestration + reuse `optimize`/`rasterize` + small new helpers |
| New-talk redirects | None — bare-id redirects existed only for legacy Notist short links |
| Video | `add-talk` may set the `video` field if a URL is given; transcript workflow deferred to a future `attach-video` skill |

## The core architectural change: decouple `notistId`

Today `notistId` does **triple duty**: the URL's first segment (lowercased),
the asset folder name (`public/slides/{notistId}/`, original case), and — for
the legacy 106 — the filename. This works only because Notist ids are unique
per delivery.

The `/{year}/{slug}` scheme breaks that: the year is **not** unique per talk
(every 2026 talk would collide on `public/slides/2026/`). So URL-segment and
asset-key must be separated.

**Resolution (Phase 0, prerequisite refactor):**

- **`talk.id`** (the filename, e.g. `2026-escaping-iiot-pilot-purgatory`) becomes
  the single **identity + asset key** everywhere assets are looked up.
- **`notistId`** becomes **optional** in the schema. Present → a legacy Notist
  delivery that keeps its `/{notistId}/{slug}` URL. Absent → a new talk.
- A new helper **`talkUrl(talk)`** in `src/lib/` is the single source of truth
  for a talk's URL:
  - legacy: `/{notistId.toLowerCase()}/{notistSlug}`
  - new: `/{year}/{notistSlug}` (year from `presentedOn`)

### Refactor sites (swap `d.notistId` → `talk.id` for asset lookups)

- `src/pages/[id]/[slug].astro` — `slideCounts[...]`, `readTranscript(...)`,
  `<SlideBrowser id=...>`, OG image path `/og/talks/{...}.png`, and
  `getStaticPaths` (compute `params.id` via `talkUrl` logic, not raw `notistId`).
- `src/lib/og-card.ts` and the OG endpoint — key cards by `talk.id`.
- `scripts/rasterize.ts` + `src/data/slide-counts.json` — keys become `talk.id`.
- Search-index generation and sitemap — URLs via `talkUrl()`.

### Why this is safe (backward compatibility)

For every legacy talk, the filename already equals `notistId` **in the same
case** (`13jkRV.md` ↔ `notistId: 13jkRV` ↔ `public/slides/13jkRV/`). So
`talk.id === notistId` for all 106 existing talks, and keying by `talk.id`
produces byte-identical output for them. The guardrail: a full `npm run build`
after the refactor, confirming the 268-page output and legacy URLs are
unchanged.

## Components

### 1. `SKILL.md` (`.claude/skills/add-talk/SKILL.md`)

Drives the conversational interview and orchestrates the helpers. Interview
steps (each **skipped if already supplied** in the invoking message):

1. **Title** → derive `notistSlug` (slugify) and `talk.id` = `{year}-{notistSlug}`;
   on collision, append `-2`, `-3`, …
2. **Date presented** (`presentedOn`).
3. **Event** → find-or-create (component 3).
4. **Slide source** → PDF path, image directory, or `none`.
5. **Abstract** → paste prose; wrapped into `abstractHtml` (`<p>` per paragraph).
6. **Video** (optional) → set `video: {provider, id}` if a URL is given.
7. **Tags** → suggest from the existing registry; confirm/extend (component 4).

Then: generate assets → write files → verify → show diff → commit/PR (component 5).

### 2. New helper scripts (small, focused, unit-testable)

- **`scripts/geocode.ts`** — `location string → {lat, lng, displayName}` via
  Nominatim. Sends a descriptive `User-Agent`, throttles to ≤1 req/s, returns the
  top hit for the user to confirm. Manual-paste fallback when the lookup misses
  or is wrong.
- **`scripts/thumbnail.ts`** — render/downscale slide 1 → `public/thumbnails/{talk.id}.webp`.
  Skipped when there are no slides (pages already degrade gracefully for the 21
  slide-less talks).
- **`scripts/scaffold-talk.ts`** — takes a validated input object and writes:
  `src/content/talks/{talk.id}.md`, the new `src/content/events/{eventId}.md`
  (if creating one), and the `src/data/tags.json` entry. Pure file I/O — the
  unit-test surface.

**Reused unchanged:** `npm run optimize` (PDF → `public/slides/{talk.id}.pdf`),
`npm run rasterize` (→ `public/slides/{talk.id}/*.webp`).

### 3. Event find-or-create + geocoding

- Search the existing ~93 events in `src/content/events/*.md` by name
  (case-insensitive fuzzy/substring). A match is referenced directly.
- A new event prompts for name / date / location / url, geocodes the location
  (confirm), mints a **friendly id** `{name-slug}-{year}` (e.g. `kubecon-eu-2026`),
  and writes `src/content/events/{id}.md` with `notistEventId` set to that same
  friendly id. No base62.

### 4. Tags

Tags live centrally in `src/data/tags.json`, keyed by `notistSlug`
(`{ topics: [], tech: [] }`), shared across all deliveries of an abstract. The
skill **suggests from the existing tag registry first** to avoid near-duplicate
tags, and only adds genuinely-new tags on explicit confirmation.

### 5. Verification + commit

- `npx astro check` and `npm run build` must pass.
- Confirm the new talk's URL renders, and that it appears on `/talks`, its event
  page, and the map (if a new event was created).
- Show `git status` + diff, then mirror the established PR workflow: branch →
  commit (with the required co-author trailer) → offer to open a PR. **Nothing is
  committed without the user's sign-off.**

## Data flow

```
invocation (maybe front-loaded facts)
        │
        ▼
  interview (fills gaps only)
        │
        ├─ event: find-or-create ──▶ geocode.ts (confirm) ──▶ events/{id}.md
        │
        ├─ slides: originals/{talk.id}.pdf ──optimize──▶ public/slides/{talk.id}.pdf
        │                                   ──rasterize─▶ public/slides/{talk.id}/*.webp
        │
        ├─ thumbnail.ts: slide-1 ──▶ public/thumbnails/{talk.id}.webp
        │
        ├─ tags: suggest from registry ──▶ data/tags.json[notistSlug]
        │
        └─ scaffold-talk.ts ──▶ talks/{talk.id}.md   (URL via talkUrl(): /{year}/{slug})
        │
        ▼
  astro check + build  ──▶  show diff  ──▶  branch + commit + offer PR
```

## Scope boundaries (YAGNI)

**In scope:** one talk delivery + its event + slides + thumbnail + tags +
optional `video` field; the Phase 0 `notistId` decouple.

**Out of scope (future, separate specs):**
- `attach-video` — YouTube/Vimeo URL parsing + transcript generation for an
  existing talk.
- Bulk import / multi-talk batches.
- Editing or re-slugging existing talks.
- Rich resources management beyond a simple `{title, url}` list.

## Testing

- **Helper unit tests:** `geocode.ts` (response parsing, no-result fallback),
  `talk.id`/`notistSlug` derivation + collision suffixing, `scaffold-talk.ts`
  output (frontmatter shape, event file, tags.json merge).
- **Refactor guardrail:** full `npm run build` after Phase 0, asserting the
  268-page output and legacy URLs are unchanged (legacy `talk.id === notistId`).
- **End-to-end smoke:** add one sample talk with a new event through the skill;
  confirm it renders, lands on `/talks` + event page + map, and `astro check`
  passes.

## Open questions

None outstanding. (New-talk redirects resolved: not needed.)
