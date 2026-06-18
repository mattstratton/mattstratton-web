# speaking.mattstratton.com

A self-hosted archive of every talk [Matty Stratton](https://mattstratton.com) has given — slides, video, transcripts, and resources — built to outlast any platform. It replaces the previous [Notist](https://noti.st/mattstratton)-hosted site.

**Why:** a speaker's talk history shouldn't live in someone else's database with breakable embeds and a CDN that vanishes when an account lapses. This site keeps everything — slides, thumbnails, video references — in this repo, on Matty's own domain, with zero third-party runtime dependency that can be turned off.

- **106 talks** (2012–2026), **93 events**, **36 videos**, **3,684 slide images**
- Built with [Astro](https://astro.build) (static), [Tailwind CSS](https://tailwindcss.com)
- Deploys to Netlify; the deploy build is pure `astro build` (no external tools)

## Quick start

```bash
npm install
npm run dev        # local dev at http://localhost:4321
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

Requires **Node 20**. The asset pipeline below additionally needs `poppler` and `ghostscript` locally (`brew install poppler ghostscript`).

## How it works

Talk content lives in `src/content/talks/*.md` and `src/content/events/*.md` (Astro content collections). Slide and headshot assets are generated **locally, pre-commit** — never on the deploy host (static hosts can't run `pdftoppm`/`gs` without root). The committed output is plain static files, so deploys are fast and host-agnostic.

```
Notist ──ingest──▶ originals/{id}.pdf ──optimize──▶ public/slides/{id}.pdf ──rasterize──▶ public/slides/{id}/{n}.webp
        (one-time)   (full-res, gitignored)         (300dpi, committed)                    (1280px viewer, committed)
```

### Scripts

| Command | What it does |
|---|---|
| `npm run ingest` | One-time Notist migration: fetches talk/event JSON, resolves videos, downloads + optimizes assets, writes content files. Idempotent. |
| `npm run optimize` | Optimize `originals/*.pdf` → `public/slides/*.pdf` at 300dpi (for new decks). |
| `npm run rasterize` | Render slide PDFs → `public/slides/{id}/*.webp` viewer images. |
| `npm run transcripts` | Fetch video captions (`yt-dlp`) → committed `public/transcripts/{id}.txt` + manifest. |
| `npm run slide-text` | Extract slide text from PDFs → `public/slides/{id}.txt` (deep-search corpus). |
| `npm run headshots` | Generate the `/bio` headshot size ladder + manifest from `public/headshots/*.png`. |
| `npm test` | Run the helper unit tests (`node:test` via `tsx`). |

### Skills

Two Claude Code skills live in `.claude/skills/` to automate content chores:

- **`add-talk`** — scaffold a whole new talk (slides → optimize/rasterize, thumbnail, find-or-create event with geocoding, tags, content file) on a `/{year}/{slug}` URL.
- **`transcript-cleanup`** — turn a raw auto-caption transcript into a clean, faithful one. Raw is archived to `transcripts-raw/{id}.txt`; the cleaned text is served, with a fidelity gate guarding against over-trimming or invention.

### Add a new talk (post-Notist)

**Easiest path: the `add-talk` skill** (see Skills above) — it does everything below and
opens a PR. The manual steps are the fallback / what it automates.

A talk lives at `src/content/talks/{id}.md`; the `{id}` filename is the talk's identity
and asset key. **New talks** carry no `notistId` and get a clean `/{year}/{slug}` URL
(e.g. `/2027/my-new-talk-title`); the legacy 106 Notist talks keep their original
`/{notistId}/{notistSlug}`. Each talk optionally references an **event** in
`src/content/events/{eventId}.md` — events are deduplicated, so the same conference
shared by several talks is one event file.

1. **Slides:** drop the deck at `originals/{name}.pdf`, then `npm run optimize && npm run rasterize`
2. **Event:** if this talk is at a venue not already in `src/content/events/`, create it
   (or reuse an existing one — check first; omit the `event` field entirely if there's no event):

   ```yaml
   # src/content/events/devopsdays-chicago-2027.md
   ---
   notistEventId: devopsdays-chicago-2027
   name: DevOpsDays Chicago 2027
   date: 2027-09-15
   location: Chicago, IL, USA
   url: https://devopsdays.org/events/2027-chicago
   latitude: 41.8781    # geocode the venue; powers /map (add-talk does this for you)
   longitude: -87.6298
   # Online event? Use `location: Virtual` and omit lat/lng — it lists off-map.
   ---
   ```

3. **Talk:** author `src/content/talks/{name}.md`:

   The filename is the id, so for a 2027 talk name it e.g.
   `src/content/talks/2027-my-new-talk-title.md`:

   ```yaml
   ---
   # New talks omit notistId — the URL becomes /{year}/{notistSlug}.
   notistSlug: my-new-talk-title  # URL segment 2 (shared across deliveries)
   title: My New Talk Title
   presentedOn: 2027-09-15
   event: devopsdays-chicago-2027 # must match an events/ filename, or omit
   slideSource: pdf               # 'pdf' | 'images' | 'none'
   slidesPdf: /slides/2027-my-new-talk-title.pdf
   abstractHtml: "<p>What the talk is about.</p>"
   video: { provider: youtube, id: dQw4w9WgXcQ }   # or omit
   resources: []
   ---
   ```

4. Commit `public/slides/` and the content file(s)

> A `slug` field is intentionally **not** used — Astro's loader would treat it as the
> entry id and collide. The filename is the id; `notistSlug` is just the URL segment.
> Identity + asset keying is the filename (`talk.id`); `notistId` is a legacy-only
> marker that keeps the original Notist URL for the imported 106. See `src/lib/talk-url.ts`.

### Update the speaker kit (`/bio`)

- **Bios, role, socials:** edit `src/data/bio.ts`. Each bio is offered as Text / HTML / Markdown.
- **Headshots:** drop a full-res image at `public/headshots/{name}.png`, run `npm run headshots`, then list `{ name, label }` in `src/data/bio.ts`. Multiple download sizes are generated automatically.

## URLs

Legacy (imported) talks mirror Notist exactly — `/{notistId}/{notistSlug}` — so existing inbound links keep working; `public/_redirects` maps bare `/{id}` to the canonical page. New talks use `/{year}/{notistSlug}` (no Notist id). The URL for any talk comes from one place, `src/lib/talk-url.ts` — don't change the shape without a redirect plan.

## Repo layout

- `src/content/` — talk + event markdown (generated by ingest; safe to hand-edit, ingest preserves a `manual:` key)
- `src/pages/`, `src/components/`, `src/layouts/` — the site
- `src/data/` — bio content + generated manifests
- `scripts/` — the local asset pipeline
- `public/slides/`, `public/thumbnails/`, `public/headshots/`, `public/transcripts/` — committed, served assets
- `originals/` — full-res source archive (gitignored); `transcripts-raw/` — raw caption archive (committed, not served)
- `.claude/skills/` — the `add-talk` and `transcript-cleanup` skills
- `docs/plans/` — the original rebuild plan; `docs/superpowers/{specs,plans}/` — per-feature design specs + implementation plans

See [CLAUDE.md](./CLAUDE.md) for architecture notes and gotchas.
