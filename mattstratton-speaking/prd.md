# Speaking Site Rebuild — Requirements

**Project:** Replace the Notist-hosted speaking site at `speaking.mattstratton.com` with a self-owned static site built in Astro.

**Status:** Requirements / pre-build. Hand this to Claude Code to implement.

**Owner:** Matty Stratton
**Last updated:** 2026-06-17

---

## 1. Why we're doing this

The talks archive currently lives on [Notist](https://noti.st/mattstratton) and is served at `speaking.mattstratton.com`. Two problems:

1. **Lock-in.** A core part of a speaker's professional identity (every talk ever given) lives in someone else's database with a thin export.
2. **Rot.** Video embeds have already started breaking, and the slide decks are hosted on Notist's CDN (`on.notist.cloud`) — the day the account lapses, every deck image and PDF disappears.

The goal is **ownership and durability**: plain content in Matty's own repo, on Matty's own domain, that will keep working for the next 15 years with no third-party dependency that can break or be turned off.

This is *not* primarily a redesign or feature project. The win is portability. Optimize every decision for "this still works when Notist is gone."

---

## 2. Scope

### In scope (Phase 1 — this project)

A standalone Astro site that fully replaces the Notist speaking site:

- Talk archive (106 presentations, 2012–2026) with detail pages
- Self-hosted slides (committed PDFs + in-page slide browser)
- Durable video embeds
- Per-talk resource links
- A **bio / speaker-kit page** at `/bio`
- Deployed to the existing `speaking.mattstratton.com` subdomain, **URL-compatible with Notist** so existing inbound links keep working

### Explicitly out of scope

- **Rebuilding the main `mattstratton.com` Hugo site.** That site has ~2,600 posts going back to 2001 — a separate, much larger migration with its own URL-preservation and shortcode concerns. Folding it in here would turn a clean weekend project into a stalled big-bang rewrite. If a unified Astro site is desired later, it's **Phase 2**, decided separately. The speaking site is the low-risk pilot that proves out Astro and the tooling first.
- **Transcripts.** Notist has this feature; Matty doesn't use it.
- **The Twitter/X posts feature.** Old and busted, not migrating.

### Decision: subdomain, not subdirectory

Keep `speaking.mattstratton.com`. The subdirectory (`mattstratton.com/speaking`) SEO argument is real in theory but a rounding error in practice here — discovery is by name and talk title, both of which win regardless. Keeping the subdomain means we re-point DNS at the new site and, if we mirror Notist's URL paths, **every existing inbound link keeps resolving with zero redirects**. That link-preservation win outweighs any theoretical subdirectory consolidation benefit.

---

## 3. Tech stack

- **Framework:** Astro (latest stable). Content collections with typed frontmatter for talks and events.
- **Rendering:** Fully static (SSG). Zero runtime JavaScript as the default; JS only where genuinely needed (and see §6 for why the slide browser avoids it).
- **Styling:** Implementer's choice — Tailwind or plain CSS. Match Matty's existing visual identity loosely; not a redesign.
- **Slide rendering:** Poppler (`pdftoppm`) or pdf.js as a **build-time** step to rasterize PDFs to per-slide images.
- **Hosting:** Netlify recommended (Matty already uses it for the main site, so the muscle memory and DNS workflow carry over). Cloudflare Pages or Vercel are equally fine if preferred. Whichever host, it's a separate project/repo from the main site.
- **Repo:** New standalone Git repo (e.g. `speaking-mattstratton`). Do **not** add this into the `mattstratton-web` Hugo repo.

---

## 4. Content model

Two entities, mirroring how Notist structures the data.

### Talk (a.k.a. presentation / delivery)

One per *time a talk was given* (a delivery at a specific event on a specific date). This matches Notist's model, where the same abstract delivered at three conferences is three presentation records. Keep that — it's simpler and matches the source data.

Frontmatter fields per talk:

| Field | Source | Notes |
|---|---|---|
| `notistId` | export index | e.g. `pr_w7YksW` → slug id `w7YksW`. Drives the URL. |
| `title` | export index | |
| `slug` | export `links.self` | The path segment Notist uses, for URL compatibility. |
| `presentedOn` | export index | Date/time given. |
| `publishedOn` | export index | |
| `timezone` | export index | |
| `abstract` | per-talk `.json` | Talk description (HTML/markdown). |
| `event` | per-talk `.json` → event ref | Reference to the Event entity. |
| `slidesPdf` | downloaded | Path to the committed PDF. |
| `slideImages` | build-time render | Generated, not authored. |
| `video` | per-talk `.json` | Canonical provider + id (see §6). |
| `resources` | per-talk `.json` | List of `{title, url}`. |
| `thumbnail` | export index | 85 of 106 have one; handle the missing 21 gracefully. |

### Event

One per conference/event. Deduplicated (many talks map to one event).

| Field | Source |
|---|---|
| `notistEventId` | export `links.event` |
| `name` | event `.json` |
| `date` | event `.json` |
| `location` | event `.json` |
| `url` | event `.json` |

---

## 5. Migration pipeline (the real work)

This is the bulk of the effort. It's a one-time ingest script that produces the content collection. **All remote assets must be downloaded and committed** — nothing may remain pointing at `noti.st` or `on.notist.cloud` in the final site.

Confirmed working against live Notist as of 2026-06-17:
- The index export (`mattstratton.json`, included in this folder) lists all 106 presentations with title, dates, thumbnail, and `related` (`/id.json`) + `event` (`/events/id.json`) links.
- `speaking.mattstratton.com/{id}.json` and `/{id}/{slug}` resolve (Notist serves the subdomain at `/{id}/{slug}` — no `/username` segment), confirming the URL shape to mirror.
- PDF decks are pullable at `https://on.notist.cloud/pdf/deck-{hash}.pdf` and serve the real file. **Validated** by pulling the IIoT deck.

### Steps

1. **Read the index** (`mattstratton.json`) → 106 presentation records.
2. **For each presentation**, fetch `https://speaking.mattstratton.com/{id}.json` (or `noti.st/mattstratton/{id}.json`) → abstract, video, resources, and the **slide deck PDF hash** (note: the thumbnail uses a numeric `deckNNNNN` id; the PDF uses a `deck-{hex}` hash — they are different identifiers, get the PDF hash from this JSON).
3. **Fetch the linked event** `.json` → event metadata. Cache/dedupe events.
4. **Download the slide PDF** from `on.notist.cloud/pdf/deck-{hash}.pdf` → commit to repo (`/slides/{id}.pdf`). This is also the visitor-facing "Download slides" file.
5. **Download the thumbnail** image → commit locally.
6. **Render slides to images** at build time: `pdftoppm` each PDF → `/slides/{id}/{n}.webp` (or PNG). These feed the in-page slide browser.
7. **Generate one content file** per talk with the frontmatter from §4.
8. **Handle gaps gracefully:** 21 talks have no thumbnail; some old talks may have no PDF, no video, or no resources. Missing assets should degrade cleanly, not error.

The ingest script should be **idempotent and re-runnable** (so the May 2026 IIoT talk and any future talks can be pulled again without clobbering hand-edits). Consider caching raw Notist JSON responses to disk so the import can be re-run offline.

---

## 6. Features

### 6.1 Slide viewer — PDF as source of truth, browsable in-page

**Requirement:** The committed PDF is the canonical artifact. Visitors browse the slides *inline on the talk page* (like Notist), and can download the PDF. **No third-party embeds** (no SpeakerDeck, no Google Slides) — Matty makes a PDF, that PDF is the site's slides.

**Implementation:** At build time, rasterize each PDF page to an image. The talk page renders those images as a slide browser (prev/next, thumbnail strip, fullscreen) plus a "Download PDF" button.

- This ships **zero runtime JavaScript** for the basic view, works on every device, and can't break.
- Live pdf.js rendering in the browser is the alternative; only worth it if text-selectable/searchable slides are wanted, which for decks they aren't. Default to the build-time image approach.

### 6.2 Video embeds — done right (this is the core bug we're fixing)

The breaking Notist video embeds are the main pain point. **Do not reproduce Notist's embed approach.**

**Requirement:** Store the canonical video reference (provider + video id, e.g. `youtube:abc123`) in frontmatter, and render a lightweight embed facade (e.g. `lite-youtube-embed`) that loads the real player only on click. This is durable, fast, privacy-friendlier, and doesn't depend on a brittle proxy. Support YouTube and Vimeo at minimum.

### 6.3 Resource links

Per-talk list of `{title, url}` rendered as a "Resources" section on the talk page. Pulled from the per-talk JSON.

### 6.4 Bio / speaker-kit page (`/bio`)

A self-contained speaker kit at the existing `/bio` URL:

- Multiple **headshots** in a few crops/resolutions, each individually downloadable.
- Multiple **bio formats**: one-liner, short (~50 words), long (~150 words) — copy-to-clipboard friendly.
- Pronouns, social links, current role/affiliation.
- Optional "download everything" zip (headshots + bios).

This is authored content (not migrated from the JSON) — Matty will supply the bios and headshots.

### 6.5 Talk listing / archive

- All talks, reverse-chronological, grouped or filterable by year (distribution: heaviest 2018–2021, tapering after).
- Each item: thumbnail, title, event, date.
- Client-side search/filter by title or event is a nice-to-have, not required for v1.

### 6.6 Homepage

Landing page with intro + recent/featured talks + link into the full archive and `/bio`.

### 6.7 Nice-to-haves (not required for v1)

- RSS feed for talks.
- Tags/topics.
- Per-talk Open Graph images (the thumbnails are a decent default).

---

## 7. URLs, redirects, and DNS

- **Mirror Notist's path structure.** Talk pages must resolve at the same paths they do today on `speaking.mattstratton.com` (the `/{id}/{slug}` form). This is the single most important constraint for not breaking the web — conference sites, old posts, and other people's resource pages link to these.
- Keep `/bio` at `/bio`.
- Build a **redirect/alias map** for any path that can't be perfectly reproduced, and for the `.json` endpoints if anything depends on them.
- **DNS:** Re-point the `speaking.mattstratton.com` CNAME from Notist to the new host once the build is verified on a preview deploy. Coordinate so there's no downtime window.
- Add a `sitemap.xml` and confirm `robots.txt` allows indexing.
- Decide on trailing-slash behavior and lock it in (Astro config) to avoid duplicate-URL issues.

---

## 8. Cutover plan

1. Build the site and verify it on a preview URL (host-provided, e.g. Netlify deploy preview).
2. Spot-check a sample of talks across the full date range (2012 → 2026), including ones with: no thumbnail, no video, no resources, and multiple talks sharing one event.
3. Confirm slide browser + PDF download work, and video facades load correctly.
4. **Only after assets are fully archived locally and verified**, re-point DNS.
5. Keep the Notist account alive until DNS has propagated and the new site is confirmed serving — *then* cancel. (Cancelling early kills the CDN assets mid-migration.)

---

## 9. Phasing / milestones

1. **Scaffold** — Astro project, content collection schemas, deploy pipeline to a preview URL.
2. **Ingest tooling** — the Notist fetch/download/render script; produce the full content collection + committed assets.
3. **Talk pages** — detail template with slide browser, video facade, resources, event info.
4. **Archive + homepage** — listing, grouping, navigation.
5. **Bio / speaker kit** — `/bio` page (needs Matty's bios + headshots).
6. **URL parity + cutover** — verify paths, set up redirects, re-point DNS, decommission Notist.

---

## 10. Open decisions for the build

- **Host:** Netlify (recommended) vs Cloudflare Pages vs Vercel.
- **Slide image format:** WebP (smaller) vs PNG (max compatibility); resolution/quality vs repo size.
- **Repo size:** 106 PDFs + rasterized slide images for ~100 decks could be sizeable. Decide whether assets live in Git directly or in Git LFS / object storage. (Leaning: PDFs + images in-repo for true portability unless size becomes painful.)
- **Abstract format:** per-talk JSON abstracts may be HTML — decide whether to convert to markdown on ingest or render the HTML.
