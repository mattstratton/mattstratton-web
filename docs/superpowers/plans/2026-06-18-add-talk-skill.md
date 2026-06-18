# add-talk Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A conversational `add-talk` Claude skill that scaffolds a new (post-Notist) talk — assets, content files, event, tags — end to end, on clean `/{year}/{slug}` URLs.

**Architecture:** A prerequisite refactor (Phase 0) decouples the overloaded `notistId` into `talk.id` (filename = identity + asset key) and a `talkUrl()` helper (URL only). Then small, unit-tested helper scripts (`ids`, `geocode`, `thumbnail`, `scaffold-talk`) do the genuinely-new work, and a thin `SKILL.md` orchestrates the interview + the existing `optimize`/`rasterize` scripts.

**Tech Stack:** Astro 5, TypeScript (strict), Node 20, `tsx` for running scripts, `sharp` for images, `yaml` for frontmatter, `node:test` (built-in) for tests. Local tools: `pdftoppm` (poppler), `gs` (ghostscript) — already required.

## Global Constraints

- **Node 20** — stay on Astro 5 (Astro 6 needs Node 22). Do not upgrade.
- **Never name a talk field `slug`** — the glob loader treats `slug` frontmatter as the entry id. The URL slug field is `notistSlug`.
- **Existing 106 talk URLs must not change** — legacy talks keep `/{notistId.toLowerCase()}/{notistSlug}`. This is the hardest constraint; the build output for legacy pages must be byte-identical after Phase 0.
- **Legacy invariant that makes Phase 0 safe:** for every existing talk, `talk.id === notistId` (same case), and asset folders are named by that value.
- **URLs end with no trailing slash; `build.format: 'file'`** — do not change URL shape without a redirect plan. New talks get **no** bare-id redirect.
- **All served assets live under `public/`** (Astro deploys only `public/`). Optimized PDFs go to `public/slides/`, never repo-root `slides/`.
- **No new runtime/CDN dependencies** — geocoding runs once at authoring time; coords are committed.
- **Add commit co-author trailer** to every commit: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Phase 0 — decouple (modify):**
- `src/content.config.ts` — make `notistId` optional.
- `src/lib/talk-url.ts` *(create)* — `talkRouteParams()` + `talkUrl()`, the single source of truth for a talk's URL.
- `src/pages/[id]/[slug].astro` — route params + asset lookups via `talk.id`/`talkUrl`.
- `src/pages/talk/[slug].astro` — asset lookups + delivery hrefs.
- `src/components/TalkCard.astro` — href via `talkUrl`.
- `src/pages/videos.astro` — href via `talkUrl`.
- `src/pages/search-index.json.ts` — url via `talkUrl`, presence via `talk.id`.
- `src/pages/deep-index.json.ts` — url via `talkUrl`, text via `talk.id`.
- `src/pages/og/talks/[id].png.ts` — param keyed by `talk.id`.

**Phase 1 — helpers (create):**
- `scripts/lib/ids.ts` — `slugify`, `uniqueTalkId`, `eventId`.
- `scripts/geocode.ts` — Nominatim lookup (DI fetch for tests).
- `scripts/thumbnail.ts` — slide-1 → `public/thumbnails/{id}.webp`.
- `scripts/scaffold-talk.ts` — write talk/event md + tags.json entry.
- `scripts/lib/ids.test.ts`, `scripts/geocode.test.ts`, `scripts/thumbnail.test.ts`, `scripts/scaffold-talk.test.ts`, `src/lib/talk-url.test.ts` — unit tests.

**Phase 2 — skill (create):**
- `.claude/skills/add-talk/SKILL.md` — interview + orchestration.

**Config (modify):**
- `package.json` — add `"test"` script.

---

## Task 1: `talkUrl()` helper, optional `notistId`, test runner

**Files:**
- Create: `src/lib/talk-url.ts`
- Create: `src/lib/talk-url.test.ts`
- Modify: `src/content.config.ts` (line 15: `notistId: z.string()` → optional)
- Modify: `package.json` (scripts block)

**Interfaces:**
- Produces: `talkRouteParams(talk: TalkLike): { id: string; slug: string }` and `talkUrl(talk: TalkLike): string`, where `TalkLike = { id: string; data: { notistId?: string; notistSlug: string; presentedOn: Date } }`. Legacy (has `notistId`) → `{ id: notistId.toLowerCase(), slug: notistSlug }`; new → `{ id: String(presentedOn.getFullYear()), slug: notistSlug }`. `CollectionEntry<'talks'>` is structurally assignable to `TalkLike`.

> **Why a structural `TalkLike` and not `CollectionEntry`:** importing `astro:content` (a build-only virtual module) would make the unit test unrunnable under `tsx`. The helper stays import-free so it tests in isolation.

- [ ] **Step 1: Add the `test` script to `package.json`**

In the `"scripts"` block (after the existing `"headshots"` line), add:

```json
    "test": "find scripts src/lib -name '*.test.ts' -exec node --import tsx --test {} +"
```

(`find … -exec … {} +` passes every `*.test.ts` to one `node --test` run — POSIX-`sh` safe, no shell-glob dependency.)

- [ ] **Step 2: Write the failing test**

Create `src/lib/talk-url.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { talkRouteParams, talkUrl } from './talk-url.ts';

const legacy = {
  id: '13jkRV',
  data: { notistId: '13jkRV', notistSlug: 'hot-takes', presentedOn: new Date('2019-05-30') },
};
const fresh = {
  id: '2026-escaping-iiot',
  data: { notistSlug: 'escaping-iiot', presentedOn: new Date('2026-05-12') },
};

test('legacy talk: lowercased notistId is the URL id segment', () => {
  assert.deepEqual(talkRouteParams(legacy), { id: '13jkrv', slug: 'hot-takes' });
  assert.equal(talkUrl(legacy), '/13jkrv/hot-takes');
});

test('new talk: presentedOn year is the URL id segment', () => {
  assert.deepEqual(talkRouteParams(fresh), { id: '2026', slug: 'escaping-iiot' });
  assert.equal(talkUrl(fresh), '/2026/escaping-iiot');
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './talk-url.ts'`.

- [ ] **Step 4: Write minimal implementation**

Create `src/lib/talk-url.ts`:

```ts
// Single source of truth for a talk *delivery* URL. Legacy Notist talks keep
// their /{notistId}/{slug}; new talks (no notistId) get /{year}/{slug}.
// Structural input type — no `astro:content` import, so it unit-tests in isolation.
export interface TalkLike {
  id: string;
  data: { notistId?: string; notistSlug: string; presentedOn: Date };
}

export function talkRouteParams(talk: TalkLike): { id: string; slug: string } {
  const { notistId, notistSlug, presentedOn } = talk.data;
  const id = notistId ? notistId.toLowerCase() : String(presentedOn.getFullYear());
  return { id, slug: notistSlug };
}

export function talkUrl(talk: TalkLike): string {
  const { id, slug } = talkRouteParams(talk);
  return `/${id}/${slug}`;
}
```

- [ ] **Step 5: Make `notistId` optional in the schema**

In `src/content.config.ts`, change line 15 from:

```ts
    notistId: z.string(), // e.g. "w7YksW" — drives the URL
```

to:

```ts
    // Legacy Notist URL marker: present => /{notistId}/{slug}; absent (new talks)
    // => /{year}/{slug} (see src/lib/talk-url.ts). Identity/asset key is the
    // filename (talk.id), NOT this field.
    notistId: z.string().optional(),
```

- [ ] **Step 6: Run tests + type-check**

Run: `npm test && npx astro check`
Expected: tests PASS; `astro check` reports 0 errors (existing talks still have `notistId`, so nothing breaks yet).

- [ ] **Step 7: Commit**

```bash
git add src/lib/talk-url.ts src/lib/talk-url.test.ts src/content.config.ts package.json
git commit -m "feat: add talkUrl() helper + optional notistId + test runner

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Phase 0 cutover — route all URLs/assets through `talkUrl` + `talk.id`

This is one task on purpose: URL construction and asset keying must change together or the build breaks. The gate is a full build that leaves legacy pages byte-identical.

**Files:**
- Modify: `src/pages/[id]/[slug].astro` (lines 23, 37, 40, 57, 92, 115)
- Modify: `src/pages/talk/[slug].astro` (lines 31, 42–43, 82, 106, 125)
- Modify: `src/components/TalkCard.astro` (line 13)
- Modify: `src/pages/videos.astro` (line ~20)
- Modify: `src/pages/search-index.json.ts` (lines 25, 35)
- Modify: `src/pages/deep-index.json.ts` (lines 19, 24)
- Modify: `src/pages/og/talks/[id].png.ts` (line 14)

**Interfaces:**
- Consumes: `talkUrl`, `talkRouteParams` from Task 1.
- Rule applied everywhere: **asset key = `talk.id`** (was `talk.data.notistId`); **URL = `talkUrl(talk)`** or **route params = `talkRouteParams(talk)`**. The lib functions `readTranscript`/`hasTranscript`/`readSlideText`/`slideCounts[...]` take an id string — pass `talk.id`, not `talk.data.notistId`.

- [ ] **Step 1: Capture the pre-refactor legacy baseline**

Run:
```bash
npm run build >/dev/null 2>&1
ls dist | grep -c '' ; node -e "console.log(require('fs').existsSync('dist/13jkrv'))"
find dist/13jkrv -name '*.html' | head -1
```
Expected: note the page count and that `dist/13jkrv/…html` exists. This is the byte-identical target for legacy URLs.

- [ ] **Step 2: `[id]/[slug].astro` — params + asset keys**

Add to the import block (after line 11):
```ts
import { talkRouteParams } from '../../lib/talk-url';
```
Change line 23 (inside `getStaticPaths` `return talks.map(...)`):
```ts
    params: talkRouteParams(talk),
```
Change lines 37, 40, 57, 92, 115 to key by `talk.id` (note: line 30 already destructures `const { talk } = Astro.props`):
```ts
const slideCount = (slideCounts as Record<string, number>)[talk.id] ?? d.slideImageCount ?? 0;
```
```ts
const transcript = readTranscript(talk.id);
```
```ts
image={`/og/talks/${talk.id.toLowerCase()}.png`}
```
```ts
<SlideBrowser id={talk.id} slideCount={slideCount} title={d.title} slidesPdf={d.slidesPdf} />
```
```ts
<Transcript text={transcript} words={transcriptWords(talk.id)} downloadHref={`/transcripts/${talk.id}.txt`} />
```

- [ ] **Step 3: `talk/[slug].astro` — asset keys + delivery hrefs**

Add import:
```ts
import { talkUrl } from '../../lib/talk-url';
```
Change line 31 `slideCounts[t.data.notistId]` → `slideCounts[t.id]`.
Change lines 42–43 `readTranscript(t.data.notistId)` / `videoDelivery?.data.notistId` → use `t.id` / `videoDelivery.id` consistently (the variable used as the transcript+OG+slide key downstream becomes a `talk.id`).
Change line 82 `${rep.data.notistId.toLowerCase()}` → `${rep.id.toLowerCase()}`.
Change line 106 `id={slideDelivery.data.notistId}` → `id={slideDelivery.id}`.
Change line 125 `href={`/${talk.data.notistId.toLowerCase()}/${talk.data.notistSlug}`}` → `href={talkUrl(talk)}`.

> If lines 42–43 bind an intermediate `const repId = …notistId`, rename its source to the entry id (`.id`) so OG path, transcript read, and slide id on this page all key off the same `talk.id`.

- [ ] **Step 4: `TalkCard.astro` — href via helper**

Add to frontmatter imports:
```ts
import { talkUrl } from '../lib/talk-url';
```
Change line 13:
```ts
const href = hrefOverride ?? talkUrl(talk);
```

- [ ] **Step 5: `videos.astro` — href via helper**

Add import `import { talkUrl } from '../lib/talk-url';` and change the `href:` line from `` `/${t.data.notistId.toLowerCase()}/${t.data.notistSlug}` `` to:
```ts
      href: talkUrl(t),
```

- [ ] **Step 6: `search-index.json.ts` — url + presence**

Add `import { talkUrl } from '../lib/talk-url';`. Change the record's `url:` to `talkUrl(talk)` (use the talk entry in scope; if the loop variable is destructured as `d = talk.data`, keep `talk` available) and `hasTranscript(d.notistId)` → `hasTranscript(talk.id)`. Leave `slug: d.notistSlug` and `tagsFor(d.notistSlug)` unchanged.

- [ ] **Step 7: `deep-index.json.ts` — url + text**

Add `import { talkUrl } from '../lib/talk-url';`. Change lines 19/24:
```ts
const parts = [readTranscript(talk.id), readSlideText(talk.id)].filter(Boolean);
```
```ts
  url: talkUrl(talk),
```

- [ ] **Step 8: `og/talks/[id].png.ts` — param keyed by talk.id**

Change line 14:
```ts
      params: { id: talk.id.toLowerCase() },
```

- [ ] **Step 9: Build and verify legacy is unchanged**

Run:
```bash
npm run build 2>&1 | tail -3
test -f "$(find dist/13jkrv -name '*.html' | head -1)" && echo "legacy URL OK"
test -d dist/13jkRV || test -d public/slides/13jkRV && echo "legacy slide dir OK"
node -e "const m=require('./src/data/slide-counts.json'); process.exit(m['13jkRV']?0:1)" && echo "slide-counts key OK"
```
Expected: build completes with the **same page count** as Step 1 (268); `legacy URL OK`; `slide-counts key OK`. The legacy `/13jkrv/…` page, its `/og/talks/13jkrv.png`, and `/slides/13jkRV/*.webp` are all unchanged because `talk.id === notistId` for legacy talks.

- [ ] **Step 10: Type-check + commit**

```bash
npx astro check
git add src/pages src/components
git commit -m "refactor: decouple notistId into talk.id (asset key) + talkUrl (URL)

Route all talk URLs through talkUrl() and all asset lookups through talk.id.
Backward-compatible: legacy talk.id === notistId, so legacy pages, OG cards,
and slide/transcript paths are byte-identical. Unblocks /{year}/{slug} URLs
for new talks.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `scripts/lib/ids.ts` — slug + id minting

**Files:**
- Create: `scripts/lib/ids.ts`
- Create: `scripts/lib/ids.test.ts`

**Interfaces:**
- Consumes: `tagSlug` from `src/lib/tags.ts` (re-exported as `slugify`).
- Produces: `slugify(name: string): string`; `uniqueTalkId(year: number, slug: string, existing: Set<string>): string` (base `{year}-{slug}`, `-2`/`-3` on collision); `eventId(name: string, year: number): string` → `{slugify(name)}-{year}`.

- [ ] **Step 1: Write the failing test**

Create `scripts/lib/ids.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, uniqueTalkId, eventId } from './ids.ts';

test('slugify lowercases and dashes', () => {
  assert.equal(slugify('Cloud Native & Kubernetes!'), 'cloud-native-kubernetes');
});

test('uniqueTalkId uses year-slug, suffixes on collision', () => {
  assert.equal(uniqueTalkId(2026, 'escaping-iiot', new Set()), '2026-escaping-iiot');
  assert.equal(
    uniqueTalkId(2026, 'escaping-iiot', new Set(['2026-escaping-iiot'])),
    '2026-escaping-iiot-2',
  );
  assert.equal(
    uniqueTalkId(2026, 'escaping-iiot', new Set(['2026-escaping-iiot', '2026-escaping-iiot-2'])),
    '2026-escaping-iiot-3',
  );
});

test('eventId is name-slug + year', () => {
  assert.equal(eventId('KubeCon EU', 2026), 'kubecon-eu-2026');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './ids.ts'`.

- [ ] **Step 3: Write minimal implementation**

Create `scripts/lib/ids.ts`:

```ts
import { tagSlug } from '../../src/lib/tags';

/** URL-safe slug: "Cloud Native & Kubernetes" → "cloud-native-kubernetes". */
export const slugify = tagSlug;

/** Unique talk entry id: {year}-{slug}, suffixed -2/-3… against existing ids. */
export function uniqueTalkId(year: number, slug: string, existing: Set<string>): string {
  const base = `${year}-${slug}`;
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/** Friendly event id: "KubeCon EU" + 2026 → "kubecon-eu-2026". */
export function eventId(name: string, year: number): string {
  return `${slugify(name)}-${year}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (all three tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/ids.ts scripts/lib/ids.test.ts
git commit -m "feat: id/slug minting helpers for new talks + events

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `scripts/geocode.ts` — Nominatim lookup

**Files:**
- Create: `scripts/geocode.ts`
- Create: `scripts/geocode.test.ts`

**Interfaces:**
- Produces: `interface GeoResult { lat: number; lng: number; displayName: string }`; `geocode(location: string, fetchImpl?: typeof fetch): Promise<GeoResult | null>`. Returns the top Nominatim hit, or `null` on no-result / non-OK response. `fetchImpl` defaults to global `fetch` and is injected in tests.

- [ ] **Step 1: Write the failing test**

Create `scripts/geocode.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { geocode } from './geocode.ts';

const fakeFetch = (body: unknown, ok = true): typeof fetch =>
  (async () => ({ ok, json: async () => body })) as unknown as typeof fetch;

test('geocode returns the top hit', async () => {
  const f = fakeFetch([{ lat: '-37.8136', lon: '144.9631', display_name: 'Melbourne VIC, Australia' }]);
  assert.deepEqual(await geocode('Melbourne', f), {
    lat: -37.8136, lng: 144.9631, displayName: 'Melbourne VIC, Australia',
  });
});

test('geocode returns null on empty results', async () => {
  assert.equal(await geocode('nowhere', fakeFetch([])), null);
});

test('geocode returns null on non-OK response', async () => {
  assert.equal(await geocode('x', fakeFetch([], false)), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './geocode.ts'`.

- [ ] **Step 3: Write minimal implementation**

Create `scripts/geocode.ts`:

```ts
export interface GeoResult {
  lat: number;
  lng: number;
  displayName: string;
}

interface NominatimHit {
  lat: string;
  lon: string;
  display_name: string;
}

// One-shot geocode via OpenStreetMap Nominatim. No API key; runs once at
// authoring time and the result is committed, so the live site never calls it.
// Nominatim's usage policy requires a descriptive User-Agent.
export async function geocode(
  location: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GeoResult | null> {
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=' +
    encodeURIComponent(location);
  const res = await fetchImpl(url, {
    headers: { 'User-Agent': 'mattstratton-speaking add-talk (https://speaking.mattstratton.com)' },
  });
  if (!res.ok) return null;
  const hits = (await res.json()) as NominatimHit[];
  if (!hits.length) return null;
  const h = hits[0];
  return { lat: Number(h.lat), lng: Number(h.lon), displayName: h.display_name };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (all three tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/geocode.ts scripts/geocode.test.ts
git commit -m "feat: Nominatim geocode helper (DI fetch, committed coords)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: `scripts/thumbnail.ts` — slide-1 → thumbnail

**Files:**
- Create: `scripts/thumbnail.ts`
- Create: `scripts/thumbnail.test.ts`

**Interfaces:**
- Produces: `slideOnePath(talkId: string): string`; `thumbnailPath(talkId: string): string`; `makeThumbnail(talkId: string): Promise<string | null>` — resizes `public/slides/{talkId}/1.webp` to a 640×360 webp at `public/thumbnails/{talkId}.webp`, returns the served path `/thumbnails/{talkId}.webp`, or `null` if slide 1 doesn't exist.

- [ ] **Step 1: Write the failing test**

Create `scripts/thumbnail.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slideOnePath, thumbnailPath, makeThumbnail } from './thumbnail.ts';

test('path helpers resolve under public/', () => {
  assert.ok(slideOnePath('2026-foo').endsWith('public/slides/2026-foo/1.webp'));
  assert.ok(thumbnailPath('2026-foo').endsWith('public/thumbnails/2026-foo.webp'));
});

test('makeThumbnail returns null when slide 1 is absent', async () => {
  assert.equal(await makeThumbnail('does-not-exist-xyz'), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './thumbnail.ts'`.

- [ ] **Step 3: Write minimal implementation**

Create `scripts/thumbnail.ts`:

```ts
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function slideOnePath(talkId: string): string {
  return resolve(ROOT, 'public/slides', talkId, '1.webp');
}

export function thumbnailPath(talkId: string): string {
  return resolve(ROOT, 'public/thumbnails', `${talkId}.webp`);
}

// Derive a 16:9 thumbnail from the first rasterized slide. Returns the served
// path to store in frontmatter, or null when the talk has no slides (the page
// already degrades gracefully — 21 legacy talks have no thumbnail).
export async function makeThumbnail(talkId: string): Promise<string | null> {
  const src = slideOnePath(talkId);
  if (!existsSync(src)) return null;
  await sharp(src).resize(640, 360, { fit: 'cover' }).webp({ quality: 80 }).toFile(thumbnailPath(talkId));
  return `/thumbnails/${talkId}.webp`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (both tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/thumbnail.ts scripts/thumbnail.test.ts
git commit -m "feat: thumbnail-from-slide-1 helper

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: `scripts/scaffold-talk.ts` — write content files + tags

**Files:**
- Create: `scripts/scaffold-talk.ts`
- Create: `scripts/scaffold-talk.test.ts`

**Interfaces:**
- Consumes: `yaml` (already a dependency).
- Produces:
  - `interface NewEvent { id: string; notistEventId: string; name: string; date?: string; location?: string; url?: string; latitude?: number; longitude?: number }`
  - `interface NewTalk { id: string; title: string; notistSlug: string; presentedOn: string; eventId: string; abstractHtml?: string; slideSource: 'pdf' | 'images' | 'none'; slidesPdf: string | null; slideImageCount: number; video: { provider: 'youtube' | 'vimeo'; id: string } | null; thumbnail: string | null; topics: string[]; tech: string[] }`
  - `talkMarkdown(t: NewTalk): string`, `eventMarkdown(e: NewEvent): string` — frontmatter strings (no `notistId` for new talks).
  - `scaffold(talk: NewTalk, event: NewEvent | null, root: string): Promise<{ talkFile: string; eventFile?: string }>` — writes `{root}/src/content/talks/{talk.id}.md`, optionally `{root}/src/content/events/{event.id}.md`, and merges `{topics,tech}` into `{root}/src/data/tags.json` under `talk.notistSlug` (keys written sorted, for stable diffs).

> **YAML safety:** serialize frontmatter with `yaml.stringify` (handles colons in titles, multiline `abstractHtml`). The `event:` value is the referenced event entry id (filename) — for a new event that's `event.id`.

- [ ] **Step 1: Write the failing test**

Create `scripts/scaffold-talk.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { parse } from 'yaml';
import { scaffold, type NewTalk, type NewEvent } from './scaffold-talk.ts';

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'scaffold-'));
  await mkdir(resolve(root, 'src/content/talks'), { recursive: true });
  await mkdir(resolve(root, 'src/content/events'), { recursive: true });
  await mkdir(resolve(root, 'src/data'), { recursive: true });
  await writeFile(resolve(root, 'src/data/tags.json'), '{\n  "existing-talk": { "topics": ["X"], "tech": [] }\n}\n');
  return root;
}

const talk: NewTalk = {
  id: '2026-escaping-iiot', title: 'Escaping: IIoT Pilot Purgatory', notistSlug: 'escaping-iiot',
  presentedOn: '2026-05-12T08:00:00', eventId: 'kubecon-eu-2026',
  abstractHtml: '<p>One.</p>\n<p>Two.</p>', slideSource: 'pdf', slidesPdf: '/slides/2026-escaping-iiot.pdf',
  slideImageCount: 0, video: null, thumbnail: '/thumbnails/2026-escaping-iiot.webp',
  topics: ['DevOps'], tech: ['Kubernetes'],
};
const event: NewEvent = {
  id: 'kubecon-eu-2026', notistEventId: 'kubecon-eu-2026', name: 'KubeCon EU 2026',
  date: '2026-05-12T08:00:00', location: 'London, United Kingdom', latitude: 51.5072, longitude: -0.1276,
};

test('scaffold writes talk + event files and merges tags', async () => {
  const root = await fixture();
  const out = await scaffold(talk, event, root);

  const talkMd = await readFile(out.talkFile, 'utf8');
  const fm = parse(talkMd.split('---')[1]);
  assert.equal(fm.notistId, undefined, 'new talks carry no notistId');
  assert.equal(fm.notistSlug, 'escaping-iiot');
  assert.equal(fm.event, 'kubecon-eu-2026');
  assert.equal(fm.slidesPdf, '/slides/2026-escaping-iiot.pdf');

  assert.ok(out.eventFile && (await readFile(out.eventFile, 'utf8')).includes('KubeCon EU 2026'));

  const tags = JSON.parse(await readFile(resolve(root, 'src/data/tags.json'), 'utf8'));
  assert.deepEqual(tags['escaping-iiot'], { topics: ['DevOps'], tech: ['Kubernetes'] });
  assert.ok('existing-talk' in tags, 'existing tag entries preserved');
});

test('scaffold skips event file when referencing an existing event', async () => {
  const root = await fixture();
  const out = await scaffold(talk, null, root);
  assert.equal(out.eventFile, undefined);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './scaffold-talk.ts'`.

- [ ] **Step 3: Write minimal implementation**

Create `scripts/scaffold-talk.ts`:

```ts
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { stringify } from 'yaml';

export interface NewEvent {
  id: string;
  notistEventId: string;
  name: string;
  date?: string;
  location?: string;
  url?: string;
  latitude?: number;
  longitude?: number;
}

export interface NewTalk {
  id: string;
  title: string;
  notistSlug: string;
  presentedOn: string;
  eventId: string;
  abstractHtml?: string;
  slideSource: 'pdf' | 'images' | 'none';
  slidesPdf: string | null;
  slideImageCount: number;
  video: { provider: 'youtube' | 'vimeo'; id: string } | null;
  thumbnail: string | null;
  topics: string[];
  tech: string[];
}

const frontmatter = (obj: Record<string, unknown>): string => `---\n${stringify(obj)}---\n`;

export function talkMarkdown(t: NewTalk): string {
  // No notistId for new talks (identity is the filename). Field order mirrors
  // the ingest-written legacy files for readable diffs.
  return frontmatter({
    title: t.title,
    notistSlug: t.notistSlug,
    presentedOn: t.presentedOn,
    event: t.eventId,
    ...(t.abstractHtml ? { abstractHtml: t.abstractHtml } : {}),
    slideSource: t.slideSource,
    slidesPdf: t.slidesPdf,
    slideImageCount: t.slideImageCount,
    video: t.video,
    resources: [],
    thumbnail: t.thumbnail,
  });
}

export function eventMarkdown(e: NewEvent): string {
  return frontmatter({
    notistEventId: e.notistEventId,
    name: e.name,
    ...(e.date ? { date: e.date } : {}),
    ...(e.location ? { location: e.location } : {}),
    ...(e.url ? { url: e.url } : {}),
    ...(e.latitude != null ? { latitude: e.latitude } : {}),
    ...(e.longitude != null ? { longitude: e.longitude } : {}),
  });
}

export async function scaffold(
  talk: NewTalk,
  event: NewEvent | null,
  root: string,
): Promise<{ talkFile: string; eventFile?: string }> {
  const talkFile = resolve(root, 'src/content/talks', `${talk.id}.md`);
  await writeFile(talkFile, talkMarkdown(talk));

  let eventFile: string | undefined;
  if (event) {
    eventFile = resolve(root, 'src/content/events', `${event.id}.md`);
    await writeFile(eventFile, eventMarkdown(event));
  }

  // Merge the tag entry (keyed by notistSlug), keep keys sorted for stable diffs.
  const tagsPath = resolve(root, 'src/data/tags.json');
  const tags = JSON.parse(await readFile(tagsPath, 'utf8')) as Record<
    string,
    { topics: string[]; tech: string[] }
  >;
  tags[talk.notistSlug] = { topics: talk.topics, tech: talk.tech };
  const sorted = Object.fromEntries(Object.keys(tags).sort().map((k) => [k, tags[k]]));
  await writeFile(tagsPath, JSON.stringify(sorted, null, 2) + '\n');

  return { talkFile, ...(eventFile ? { eventFile } : {}) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (both tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/scaffold-talk.ts scripts/scaffold-talk.test.ts
git commit -m "feat: scaffold-talk writer (talk + event md, tags.json merge)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: `.claude/skills/add-talk/SKILL.md` — interview + orchestration

**Files:**
- Create: `.claude/skills/add-talk/SKILL.md`

**Interfaces:**
- Consumes: `scripts/lib/ids.ts`, `scripts/geocode.ts`, `scripts/thumbnail.ts`, `scripts/scaffold-talk.ts`, and `npm run optimize` / `npm run rasterize`.

- [ ] **Step 1: Write the skill document**

Create `.claude/skills/add-talk/SKILL.md`:

````markdown
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
   match exists, reference it (`eventId` = its filename). Otherwise create one:
   prompt name / date / location / url; `geocode(location)` (from
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

Run helpers with `tsx` (e.g. a short inline `tsx -e` script, or a `tsx` REPL
call) — do not reimplement them.

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
````

- [ ] **Step 2: Smoke-test end to end (throwaway talk, then revert)**

Create a temp deck and run the flow's mechanical core to prove the pieces wire up:

```bash
mkdir -p /tmp/add-talk-smoke
# minimal 2-page PDF for the pipeline:
gs -sDEVICE=pdfwrite -o /tmp/add-talk-smoke/deck.pdf \
   -c "showpage showpage" 2>/dev/null || printf '%%PDF-1.4\n' > /tmp/add-talk-smoke/deck.pdf
cp /tmp/add-talk-smoke/deck.pdf originals/2099-smoke-test.pdf
npm run optimize && npm run rasterize
node --import tsx -e "import('./scripts/thumbnail.ts').then(async m => console.log(await m.makeThumbnail('2099-smoke-test')))"
node --import tsx -e "import('./scripts/scaffold-talk.ts').then(m => m.scaffold({id:'2099-smoke-test',title:'Smoke Test',notistSlug:'smoke-test',presentedOn:'2099-01-01T08:00:00',eventId:'smoke-event-2099',abstractHtml:'<p>x</p>',slideSource:'pdf',slidesPdf:'/slides/2099-smoke-test.pdf',slideImageCount:0,video:null,thumbnail:'/thumbnails/2099-smoke-test.webp',topics:['DevOps'],tech:[]},{id:'smoke-event-2099',notistEventId:'smoke-event-2099',name:'Smoke Event 2099',date:'2099-01-01T08:00:00',location:'London, United Kingdom',latitude:51.5,longitude:-0.12}, process.cwd()))"
npm run build 2>&1 | tail -2
test -f "$(find dist/2099 -name '*.html' | head -1)" && echo "NEW /{year}/{slug} PAGE OK"
```
Expected: `makeThumbnail` prints `/thumbnails/2099-smoke-test.webp`; build succeeds; `NEW /{year}/{slug} PAGE OK`.

- [ ] **Step 3: Revert the smoke-test artifacts**

```bash
rm -rf originals/2099-smoke-test.pdf public/slides/2099-smoke-test* \
       public/thumbnails/2099-smoke-test.webp \
       src/content/talks/2099-smoke-test.md src/content/events/smoke-event-2099.md
git checkout src/data/tags.json src/data/slide-counts.json src/data/slide-text.json 2>/dev/null || true
git status --short   # expect only the new SKILL.md staged/untracked
```
Expected: working tree clean except `.claude/skills/add-talk/SKILL.md`.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/add-talk/SKILL.md
git commit -m "feat: add-talk skill (interview + orchestration) — closes #2

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- `/{year}/{slug}` URLs — Task 1 (`talkUrl`) + Task 2 (cutover). ✓
- Decouple `notistId` → `talk.id` (optional `notistId`, helper, refactor sites incl. the two extra asset libs found during planning) — Tasks 1–2. ✓
- Conversational interview, skip front-loaded — Task 7. ✓
- Nominatim geocode + confirm + manual fallback — Task 4 (helper) + Task 7 (confirm/fallback). ✓
- Event find-or-create + friendly id — Task 3 (`eventId`) + Task 7. ✓
- Thumbnail from slide 1, none if no slides — Task 5. ✓
- Central tags.json, suggest from registry — Task 6 (merge) + Task 7 (suggest). ✓
- Reuse optimize/rasterize; thin SKILL.md — Task 7. ✓
- Verification (astro check + build) + branch/commit/PR — Task 7. ✓
- No new-talk redirects — honored (Task 2/7 never touch `_redirects`). ✓
- Scope boundaries (no attach-video/bulk/edit) — stated in SKILL.md. ✓
- Tests on helpers; refactor guarded by build — Tasks 1,3,4,5,6 (unit) + Task 2 (build gate). ✓

**Placeholder scan:** No TBD/TODO; every code step has complete code; every command has expected output. ✓

**Type consistency:** `talkUrl`/`talkRouteParams` (Task 1) reused verbatim in Task 2. `slugify`/`uniqueTalkId`/`eventId` (Task 3), `geocode`/`GeoResult` (Task 4), `makeThumbnail` (Task 5), `scaffold`/`NewTalk`/`NewEvent` (Task 6) referenced by the same names/signatures in Task 7. ✓
