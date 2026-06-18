---
name: add-talk
description: Scaffold a new (post-Notist) talk delivery end to end — slides, thumbnail, event, tags, content file — on a clean /{year}/{slug} URL. Use when the user says "add a talk", "I gave a talk", "new talk", or provides a deck + talk details to publish on the speaking site.
---

# add-talk

Add one new talk delivery to this site. New talks use `/{year}/{slug}` URLs and
carry **no** `notistId` (identity is the filename `talk.id`). Reuse the existing
asset pipeline; never hand-roll `pdftoppm`/`gs`.

## Interview (skip anything already supplied)

Ask only for what the user hasn't given, one point at a time:

1. **Title** — derive `notistSlug = slugify(title)` (from `scripts/lib/ids.ts`)
   and `talk.id = uniqueTalkId(year, notistSlug, existingIds)` where
   `existingIds` = filenames in `src/content/talks/` and `year` is the year of #2.
2. **Date presented** (`presentedOn`, e.g. `2026-05-12T08:00:00`).
3. **Event** — list `src/content/events/*.md` and fuzzy-match by `name`. If a
   match exists, reference it (`eventId` = its filename, without `.md`). Otherwise
   create one: prompt name / date / location / url; `geocode(location)` (from
   `scripts/geocode.ts`); show the hit and **confirm**, falling back to a pasted
   `lat,lng`; mint `eventId(name, year)`; that id is both the filename and
   `notistEventId`.
4. **Slides** — PDF path, image dir, or `none`.
5. **Abstract** — paste prose; wrap each paragraph in `<p>…</p>` for `abstractHtml`.
6. **Video** (optional) — if a YouTube/Vimeo URL is given, set
   `video: { provider, id }`. (Transcript generation is a separate future skill.)
7. **Tags** — read `src/data/tags.json`, show the existing topic/tech vocabulary,
   and have the user pick from it; only add new tags on explicit confirmation.

## Generate

- **PDF slides:** copy the deck to `originals/{talk.id}.pdf`, then
  `npm run optimize` (→ `public/slides/{talk.id}.pdf`) and `npm run rasterize`
  (→ `public/slides/{talk.id}/*.webp`). Set `slideSource: 'pdf'`,
  `slidesPdf: '/slides/{talk.id}.pdf'`.
- **Image slides:** place PNGs in `slides/{talk.id}/`, then `npm run rasterize`.
  Set `slideSource: 'images'`, `slidesPdf: null`,
  `slideImageCount` = the rasterized count.
- **No slides:** `slideSource: 'none'`, `slidesPdf: null`, `slideImageCount: 0`.
- **Thumbnail:** `makeThumbnail(talk.id)` (from `scripts/thumbnail.ts`); use its
  return value (or `null`) for `thumbnail`.

Run helpers with `tsx` (e.g. `node --import tsx -e "import('./scripts/<helper>.ts').then(...)"`) —
do not reimplement them.

## Write + verify + commit

1. Call `scaffold(talk, eventOrNull, process.cwd())` from
   `scripts/scaffold-talk.ts` to write the talk md, optional event md, and the
   tags entry.
2. `npm test` (helpers), `npx astro check`, then `npm run build` — all must pass.
3. Confirm the new `/{year}/{slug}` page rendered in `dist/`, and that the talk
   shows on `/talks`, its event page, and (if a new event) the map.
4. Show `git status` + diff. Then branch → commit (with the co-author trailer) →
   offer to open a PR. **Never commit without the user's sign-off.**

## Out of scope

`attach-video` (URL parsing + transcript generation for an existing talk), bulk
import, and editing/re-slugging existing talks are separate skills.
