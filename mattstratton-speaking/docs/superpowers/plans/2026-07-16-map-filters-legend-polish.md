# Map Filters, Legend, and Tap-Target Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add year/topic filtering, a dot-size legend, and mobile tap-target fixes to the existing `/map` page (`src/pages/map.astro`), with zero new dependencies and no regression to its current no-JS/accessible fallback behavior.

**Architecture:** Extract the join logic currently inline in `map.astro`'s frontmatter into a pure, unit-tested `buildMapData()` function (`src/lib/map-data.ts`) that both the map page and a new legend component can share. Add two new presentational Astro components (`MapFilters.astro`, `MapLegend.astro`). Wire client-side filtering via one vanilla `<script>` island co-located in `map.astro`, following the exact progressive-enhancement pattern already used by `src/components/Search.astro` and `src/components/SlideBrowser.astro`.

**Tech Stack:** Astro 6, TypeScript (strict), Tailwind v4 (utility classes only, no new `<style>` blocks), Node 24, `node:test` (existing `npm test` convention — see `package.json`'s `test` script, which globs `src/lib/*.test.ts`), `d3-geo`/`topojson-client` (existing, build-time-only devDependencies — untouched).

## Global Constraints

- **Zero new npm dependencies.** Confirmed against `mattstratton-speaking/package.json` — this plan touches no `dependencies`/`devDependencies` entries.
- **Zero new client-side frameworks.** All interactivity is a vanilla `<script>` island, matching the site's only existing patterns (`Search.astro`, `SlideBrowser.astro`).
- **No regression with JS disabled.** Every markup change must render and link correctly with the `<script>` never running — filtering is the only thing allowed to depend on JS.
- **Accessibility contract is fixed, not up for revision:** the map `<svg>` stays `aria-hidden="true"`; dots stay `tabindex="-1"`; the alphabetized list stays the authoritative accessible/keyboard interface. Filtering must keep the SVG dots, the alphabetized list, and the "Delivered virtually" list in sync (same predicate, all three regions).
- **No schema changes.** `src/content.config.ts` and `src/data/tags.json`/`src/lib/tags.ts` are reused exactly as they exist today.
- Every commit message ends with the trailer: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` (this repo's convention).
- Work happens on a dedicated branch off `main`; this plan ends with a PR, never a direct merge to `main`.
- Design reference: `docs/superpowers/specs/2026-07-16-map-filters-legend-polish-design.md` — read it if any decision here seems unmotivated.

---

## File Structure

**Create:**
- `src/lib/map-data.ts` — `dotRadius()`, `buildMapData()`, and their supporting types. Pure functions, dependency-injected (projection/tag lookups passed in), so they're testable without Astro's runtime.
- `src/lib/map-data.test.ts` — unit tests.
- `src/components/MapLegend.astro` — dot-size legend, rendered as the map figure's `<figcaption>`.
- `src/components/MapFilters.astro` — year/topic `<select>`s, reset button, live status region.

**Modify:**
- `src/pages/map.astro` — call `buildMapData()` instead of today's inline joins; render the two new components; add `data-*` attributes and hit-circles to dots and list rows; add the filter `<script>`.

---

## Task 1: `map-data.ts` — `dotRadius` and `buildMapData`

**Files:**
- Create: `src/lib/map-data.ts`
- Create: `src/lib/map-data.test.ts`

**Interfaces:**
- Consumes: `tagSlug(name: string): string` and `type TagInfo = { name: string; kind: 'topic' | 'tech'; slug: string; count: number }` from `src/lib/tags.ts` (existing, read-only).
- Produces (used by Task 2 and later):
  - `dotRadius(count: number): number`
  - `interface EventInput { id: string; notistEventId: string; name: string; location?: string; date?: Date; latitude?: number; longitude?: number }`
  - `interface TalkInput { notistSlug: string; eventId?: string }`
  - `interface MapPoint { id: string; x: number; y: number; r: number; name: string; location: string; href: string; talkCount: number; year: number | null; tags: string[] }`
  - `interface VirtualEvent { id: string; name: string; href: string; year: number | null; tags: string[] }`
  - `interface MapData { points: MapPoint[]; virtual: VirtualEvent[]; years: number[]; tags: TagInfo[] }`
  - `interface BuildMapDataOptions { project: (lonLat: [number, number]) => [number, number] | null; tagsFor: (notistSlug: string) => string[]; tagBySlug: (slug: string) => TagInfo | undefined }`
  - `buildMapData(events: EventInput[], talks: TalkInput[], options: BuildMapDataOptions): MapData`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/map-data.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dotRadius, buildMapData, type EventInput, type TalkInput } from './map-data.ts';
import type { TagInfo } from './tags.ts';

test('dotRadius grows sublinearly with talk count', () => {
  assert.equal(dotRadius(0), 4);
  assert.equal(dotRadius(1), 5.5);
  assert.equal(dotRadius(4), 7);
});

const MELBOURNE: EventInput = {
  id: '0SaoHZ',
  notistEventId: '0SaoHZ',
  name: 'DevOps Talks Melbourne 2023',
  location: 'Melbourne VIC, Australia',
  date: new Date('2023-04-04T08:00:00'),
  latitude: -37.813628,
  longitude: 144.963058,
};

const ZURICH_VIRTUAL: EventInput = {
  id: '2cJjuw',
  notistEventId: '2cJjuw',
  name: 'DevOps Meetup Zürich',
  location: 'Virtual',
  date: new Date('2020-05-18T08:00:00'),
};

const identityProject = (lonLat: [number, number]): [number, number] => lonLat;
const noTags = () => [] as string[];
const noTagLookup = () => undefined;

test('buildMapData projects a geocoded event into a point', () => {
  const { points, virtual } = buildMapData([MELBOURNE], [], {
    project: identityProject,
    tagsFor: noTags,
    tagBySlug: noTagLookup,
  });
  assert.equal(points.length, 1);
  assert.equal(virtual.length, 0);
  assert.equal(points[0].x, 144.963058);
  assert.equal(points[0].y, -37.813628);
  assert.equal(points[0].href, '/event/0saohz');
  assert.equal(points[0].talkCount, 0);
  assert.equal(points[0].r, dotRadius(0));
  assert.equal(points[0].year, 2023);
});

test('buildMapData puts an event with no coordinates in virtual, not points', () => {
  const { points, virtual } = buildMapData([ZURICH_VIRTUAL], [], {
    project: identityProject,
    tagsFor: noTags,
    tagBySlug: noTagLookup,
  });
  assert.equal(points.length, 0);
  assert.equal(virtual.length, 1);
  assert.equal(virtual[0].name, 'DevOps Meetup Zürich');
  assert.equal(virtual[0].year, 2020);
});

test('buildMapData drops a point whose projection returns null, without treating it as virtual', () => {
  const { points, virtual } = buildMapData([MELBOURNE], [], {
    project: () => null,
    tagsFor: noTags,
    tagBySlug: noTagLookup,
  });
  assert.equal(points.length, 0);
  assert.equal(virtual.length, 0);
});

test('buildMapData counts talks per event via the event reference', () => {
  const talks: TalkInput[] = [
    { notistSlug: 'talk-a', eventId: '0SaoHZ' },
    { notistSlug: 'talk-b', eventId: '0SaoHZ' },
    { notistSlug: 'talk-c', eventId: 'some-other-event' },
  ];
  const { points } = buildMapData([MELBOURNE], talks, {
    project: identityProject,
    tagsFor: noTags,
    tagBySlug: noTagLookup,
  });
  assert.equal(points[0].talkCount, 2);
  assert.equal(points[0].r, dotRadius(2));
});

test('buildMapData treats a missing date as a null year', () => {
  const noDate: EventInput = { ...MELBOURNE, id: 'no-date', date: undefined };
  const { points } = buildMapData([noDate], [], {
    project: identityProject,
    tagsFor: noTags,
    tagBySlug: noTagLookup,
  });
  assert.equal(points[0].year, null);
});

test('buildMapData unions and dedupes tags across every talk delivered at an event', () => {
  const talks: TalkInput[] = [
    { notistSlug: 'talk-a', eventId: '0SaoHZ' },
    { notistSlug: 'talk-b', eventId: '0SaoHZ' },
  ];
  const tagsBySlug: Record<string, string[]> = {
    'talk-a': ['Incident Response', 'Kubernetes'],
    'talk-b': ['Kubernetes', 'On Call'],
  };
  const registry: Record<string, TagInfo> = {
    'incident-response': { name: 'Incident Response', kind: 'topic', slug: 'incident-response', count: 1 },
    kubernetes: { name: 'Kubernetes', kind: 'tech', slug: 'kubernetes', count: 2 },
    'on-call': { name: 'On Call', kind: 'topic', slug: 'on-call', count: 1 },
  };
  const { points, tags } = buildMapData([MELBOURNE], talks, {
    project: identityProject,
    tagsFor: (slug) => tagsBySlug[slug] ?? [],
    tagBySlug: (slug) => registry[slug],
  });
  assert.deepEqual([...points[0].tags].sort(), ['incident-response', 'kubernetes', 'on-call']);
  assert.equal(tags.length, 3);
});

test('buildMapData returns distinct years descending and only tags present in the dataset', () => {
  const olderEvent: EventInput = { ...MELBOURNE, id: 'older', date: new Date('2019-01-01') };
  const talks: TalkInput[] = [{ notistSlug: 'talk-a', eventId: '0SaoHZ' }];
  const registry: Record<string, TagInfo> = {
    kubernetes: { name: 'Kubernetes', kind: 'tech', slug: 'kubernetes', count: 1 },
    unused: { name: 'Unused', kind: 'topic', slug: 'unused', count: 0 },
  };
  const { years, tags } = buildMapData([MELBOURNE, olderEvent], talks, {
    project: identityProject,
    tagsFor: () => ['Kubernetes'],
    tagBySlug: (slug) => registry[slug],
  });
  assert.deepEqual(years, [2023, 2019]);
  assert.deepEqual(tags.map((t) => t.slug), ['kubernetes']);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd mattstratton-speaking && node --import tsx --test src/lib/map-data.test.ts`
Expected: FAIL — `Cannot find module './map-data.ts'` (the module doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/lib/map-data.ts`:

```ts
import { tagSlug, type TagInfo } from './tags';

/** Visible dot radius, in map viewBox units. Shared by the map and the legend. */
export function dotRadius(count: number): number {
  return 4 + Math.sqrt(count) * 1.5;
}

export interface EventInput {
  id: string;
  notistEventId: string;
  name: string;
  location?: string;
  date?: Date;
  latitude?: number;
  longitude?: number;
}

export interface TalkInput {
  notistSlug: string;
  eventId?: string;
}

export interface MapPoint {
  id: string;
  x: number;
  y: number;
  r: number;
  name: string;
  location: string;
  href: string;
  talkCount: number;
  year: number | null;
  tags: string[];
}

export interface VirtualEvent {
  id: string;
  name: string;
  href: string;
  year: number | null;
  tags: string[];
}

export interface MapData {
  points: MapPoint[];
  virtual: VirtualEvent[];
  years: number[];
  tags: TagInfo[];
}

export interface BuildMapDataOptions {
  project: (lonLat: [number, number]) => [number, number] | null;
  tagsFor: (notistSlug: string) => string[];
  tagBySlug: (slug: string) => TagInfo | undefined;
}

/**
 * Joins events + talks into everything the map page and legend need.
 * `project`/`tagsFor`/`tagBySlug` are injected (not imported directly) so
 * this stays unit-testable without real geo math or the real tag registry.
 */
export function buildMapData(events: EventInput[], talks: TalkInput[], options: BuildMapDataOptions): MapData {
  const { project, tagsFor, tagBySlug } = options;

  const talkCount = new Map<string, number>();
  const tagSlugsByEvent = new Map<string, Set<string>>();
  for (const t of talks) {
    if (!t.eventId) continue;
    talkCount.set(t.eventId, (talkCount.get(t.eventId) ?? 0) + 1);
    const set = tagSlugsByEvent.get(t.eventId) ?? new Set<string>();
    for (const name of tagsFor(t.notistSlug)) set.add(tagSlug(name));
    tagSlugsByEvent.set(t.eventId, set);
  }

  const points: MapPoint[] = [];
  const virtual: VirtualEvent[] = [];
  const yearSet = new Set<number>();
  const tagSlugSet = new Set<string>();

  for (const e of events) {
    const count = talkCount.get(e.id) ?? 0;
    const tags = [...(tagSlugsByEvent.get(e.id) ?? [])];
    const year = e.date ? e.date.getFullYear() : null;
    if (year !== null) yearSet.add(year);
    for (const s of tags) tagSlugSet.add(s);
    const href = `/event/${e.notistEventId.toLowerCase()}`;
    const hasCoords = typeof e.latitude === 'number' && typeof e.longitude === 'number';

    if (hasCoords) {
      const xy = project([e.longitude as number, e.latitude as number]);
      if (!xy) continue; // unplottable projection artifact — drop silently, matches prior behavior
      points.push({
        id: e.id,
        x: xy[0],
        y: xy[1],
        r: dotRadius(count),
        name: e.name,
        location: e.location ?? '',
        href,
        talkCount: count,
        year,
        tags,
      });
    } else {
      virtual.push({ id: e.id, name: e.name, href, year, tags });
    }
  }

  const years = [...yearSet].sort((a, b) => b - a);
  const tags = [...tagSlugSet]
    .map((slug) => tagBySlug(slug))
    .filter((t): t is TagInfo => Boolean(t))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return { points, virtual, years, tags };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd mattstratton-speaking && node --import tsx --test src/lib/map-data.test.ts`
Expected: PASS — all 8 tests green.

- [ ] **Step 5: Run the full test suite and type check**

Run: `cd mattstratton-speaking && npm test && npx astro check`
Expected: PASS, no new type errors.

- [ ] **Step 6: Commit**

```bash
cd mattstratton-speaking
git add src/lib/map-data.ts src/lib/map-data.test.ts
git commit -m "$(cat <<'EOF'
feat: extract map-data.ts (dotRadius + buildMapData)

Pure, unit-tested join logic for the speaking map, factored out of
map.astro's frontmatter so it can be shared with a future legend
component and tested without Astro's runtime.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Refactor `map.astro` to use `buildMapData` (no visible change)

**Files:**
- Modify: `src/pages/map.astro`

**Interfaces:**
- Consumes: `buildMapData`, `EventInput`, `TalkInput` from `../lib/map-data` (Task 1); `tagsFor`, `tagBySlug` from `../lib/tags` (existing).
- Produces: `points` (`MapPoint[]`, sorted for draw order), `list` (`MapPoint[]`, alphabetized), `virtual` (`VirtualEvent[]`, alphabetized) — same three shapes future tasks render, now carrying `year`/`tags` too.

This task is a pure refactor: same rendered output, different frontmatter. It's the safety checkpoint before any new UI lands.

- [ ] **Step 1: Replace the frontmatter**

In `src/pages/map.astro`, replace everything from the top of the file through the `virtual` computation (originally lines 1–61) with:

```astro
---
import { getCollection } from 'astro:content';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import Base from '../layouts/Base.astro';
import world from '../assets/world-110m.json';
import { buildMapData, type EventInput, type TalkInput } from '../lib/map-data';
import { tagsFor, tagBySlug } from '../lib/tags';

// "Where I've spoken" — a static, fully-owned SVG dot-map. The world geometry is
// committed (src/assets/world-110m.json, public-domain Natural Earth), projected
// at BUILD time with d3-geo. No runtime/external dependency, no tile server: the
// page ships as inline SVG that keeps working as long as static files do.
const W = 1000;
const H = 500;

// TopoJSON → GeoJSON features, then project + path each country. The
// topojson-client / d3-geo interop is loosely typed, so cast at the boundary.
/* eslint-disable @typescript-eslint/no-explicit-any */
const land = feature(world as any, (world as any).objects.countries) as any;
const projection = geoNaturalEarth1().fitSize([W, H], land);
const toPath = geoPath(projection);
const countryPaths = (land.features as any[])
  .map((f) => toPath(f))
  .filter((d): d is string => Boolean(d));

const eventEntries = await getCollection('events');
const talkEntries = await getCollection('talks');

const events: EventInput[] = eventEntries.map((e) => ({
  id: e.id,
  notistEventId: e.data.notistEventId,
  name: e.data.name,
  location: e.data.location,
  date: e.data.date,
  latitude: e.data.latitude,
  longitude: e.data.longitude,
}));
const talks: TalkInput[] = talkEntries.map((t) => ({
  notistSlug: t.data.notistSlug,
  eventId: t.data.event?.id,
}));

const {
  points: rawPoints,
  virtual: rawVirtual,
  years,
  tags,
} = buildMapData(events, talks, {
  project: (lonLat) => projection(lonLat),
  tagsFor,
  tagBySlug,
});

// Draw northern dots last so they sit on top of overlapping southern ones.
const points = [...rawPoints].sort((a, b) => b.y - a.y);
// Alphabetized list for the accessible text fallback / index below the map.
const list = [...rawPoints].sort((a, b) => (a.location || a.name).localeCompare(b.location || b.name));
const virtual = [...rawVirtual].sort((a, b) => a.name.localeCompare(b.name));
---
```

- [ ] **Step 2: Verify the markup below still matches the new variable shapes**

The existing markup (the `<Base>` block) already references `points`, `list`, `virtual`, `p.name`, `p.location`, `p.href`, `p.x`, `p.y`, `p.r`, `v.name`, `v.href` — all of which the new frontmatter still provides with the same names and meaning. No markup changes are needed for this task; leave the rest of the file exactly as it is.

- [ ] **Step 3: Build and manually diff the output**

Run: `cd mattstratton-speaking && npm run build`
Expected: build succeeds with no errors.

Run: `grep -o '<circle cx="[0-9.]*"' dist/map/index.html | wc -l` before and after this change (stash/unstash if needed to compare) — the count of rendered dots must be identical (93 events, ~75 with coordinates today). If you have `git stash` available, compare `dist/map/index.html`'s dot count and the venue-count text in the `<h1>`'s sibling `<p>` against the pre-refactor build to confirm no regression.

- [ ] **Step 4: Run the full test suite and type check**

Run: `cd mattstratton-speaking && npm test && npx astro check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd mattstratton-speaking
git add src/pages/map.astro
git commit -m "$(cat <<'EOF'
refactor: build map.astro's data via buildMapData

No visible change — moves the events/talks join out of map.astro's
frontmatter into the shared, tested map-data.ts module.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `MapLegend.astro`

**Files:**
- Create: `src/components/MapLegend.astro`
- Modify: `src/pages/map.astro`

**Interfaces:**
- Consumes: `dotRadius` from `../lib/map-data` (Task 1).
- Produces: `<MapLegend counts={number[]} />` — a `<figcaption>`-shaped component; no exported JS functions.

- [ ] **Step 1: Create the component**

Create `src/components/MapLegend.astro`:

```astro
---
// Explains the map's dot-size encoding: a few representative talk counts,
// each drawn at its real dotRadius() so it visually matches the map exactly.
import { dotRadius } from '../lib/map-data';

interface Props {
  counts: number[];
}
const { counts } = Astro.props;
---

<figcaption class="mt-3 flex flex-wrap items-center gap-4">
  {counts.map((count) => {
    const r = dotRadius(count);
    const size = Math.ceil(r * 2 + 4);
    return (
      <span class="label normal-case tracking-normal flex items-center gap-1.5 text-ink-soft">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} class="fill-accent/60" />
        </svg>
        {count} talk{count === 1 ? '' : 's'}
      </span>
    );
  })}
</figcaption>
```

- [ ] **Step 2: Wire it into `map.astro`**

In `src/pages/map.astro`, add the import alongside the other imports:

```ts
import MapLegend from '../components/MapLegend.astro';
```

After the `virtual` line in the frontmatter, add the legend sample computation:

```ts
// Legend samples: 1 talk, the dataset's median non-zero count, and its max —
// always truthful as the archive grows, never a hardcoded guess.
const nonZeroCounts = rawPoints
  .map((p) => p.talkCount)
  .filter((c) => c > 0)
  .sort((a, b) => a - b);
const legendCounts = nonZeroCounts.length
  ? [...new Set([1, nonZeroCounts[Math.floor(nonZeroCounts.length / 2)], nonZeroCounts[nonZeroCounts.length - 1]])]
  : [1];
```

In the markup, immediately after the closing `</svg>` tag inside the `<figure>`, add:

```astro
    <MapLegend counts={legendCounts} />
```

- [ ] **Step 3: Build and visually check**

Run: `cd mattstratton-speaking && npm run dev`

Open `http://localhost:4321/map` in a browser (or via Chrome automation) and confirm a small legend row appears below the map with 1–3 labeled dots that visually match the size of real dots on the map above.

- [ ] **Step 4: Run the type check**

Run: `cd mattstratton-speaking && npx astro check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd mattstratton-speaking
git add src/components/MapLegend.astro src/pages/map.astro
git commit -m "$(cat <<'EOF'
feat: add dot-size legend to the speaking map

Explains what the map's dot sizes mean (talk count), using the same
dotRadius() formula as the real dots so the legend can't drift out of
sync with what's actually drawn.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `MapFilters.astro` + filtering script + `data-*` attributes

**Files:**
- Create: `src/components/MapFilters.astro`
- Modify: `src/pages/map.astro`

**Interfaces:**
- Consumes: `TagInfo` type from `../lib/tags` (existing).
- Produces: `<MapFilters years={number[]} tags={TagInfo[]} total={number} virtualTotal={number} />`; markup hooks `[data-map-filter-year]`, `[data-map-filter-tag]`, `[data-map-filter-reset]`, `[data-map-filter-status]` that the filter script (added to `map.astro` in this same task) queries.

- [ ] **Step 1: Create the filters component**

Create `src/components/MapFilters.astro`:

```astro
---
import type { TagInfo } from '../lib/tags';

interface Props {
  years: number[];
  tags: TagInfo[];
  total: number;
  virtualTotal: number;
}
const { years, tags, total, virtualTotal } = Astro.props;
---

<div class="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
  <label class="label normal-case tracking-normal inline-flex items-center gap-1.5 rounded-full border border-rule px-2.5 py-1">
    <span>Year</span>
    <select data-map-filter-year aria-label="Filter by year" class="bg-transparent font-mono text-xs text-ink focus:outline-none">
      <option value="">All</option>
      {years.map((y) => (
        <option value={y}>{y}</option>
      ))}
    </select>
  </label>
  <label class="label normal-case tracking-normal inline-flex items-center gap-1.5 rounded-full border border-rule px-2.5 py-1">
    <span>Topic</span>
    <select data-map-filter-tag aria-label="Filter by topic or technology" class="bg-transparent font-mono text-xs text-ink focus:outline-none">
      <option value="">All</option>
      {tags.map((t) => (
        <option value={t.slug}>{t.kind === 'tech' ? `#${t.name}` : t.name}</option>
      ))}
    </select>
  </label>
  <button
    type="button"
    data-map-filter-reset
    class="label normal-case tracking-normal text-ink-soft transition-colors hover:text-accent"
  >
    Reset
  </button>
</div>
<p data-map-filter-status role="status" aria-live="polite" class="label mt-2 normal-case tracking-normal text-ink-soft">
  {`Showing ${total} of ${total} venues on the map${virtualTotal > 0 ? ` · ${virtualTotal} of ${virtualTotal} delivered virtually` : ''}`}
</p>
```

- [ ] **Step 2: Wire the component into `map.astro`**

Add the import:

```ts
import MapFilters from '../components/MapFilters.astro';
```

In the markup, immediately after the closing `</header>` tag and before the `<figure>`, add:

```astro
  <MapFilters years={years} tags={tags} total={points.length} virtualTotal={virtual.length} />
```

- [ ] **Step 3: Add `data-*` attributes to dots and both lists**

In the SVG dot loop, change:

```astro
          <a href={p.href} tabindex="-1">
```

to:

```astro
          <a
            href={p.href}
            tabindex="-1"
            data-event-id={p.id}
            data-year={p.year ?? ''}
            data-tags={p.tags.join(' ')}
            data-kind="point"
          >
```

In the alphabetized list `<li>`, change:

```astro
        <li class="border-b border-rule/60 py-1.5">
```

to:

```astro
        <li
          class="border-b border-rule/60 py-1.5"
          data-event-id={p.id}
          data-year={p.year ?? ''}
          data-tags={p.tags.join(' ')}
          data-kind="point"
        >
```

In the virtual list `<li>`, change:

```astro
          <li class="border-b border-rule/60 py-1.5">
```

to:

```astro
          <li
            class="border-b border-rule/60 py-1.5"
            data-event-id={v.id}
            data-year={v.year ?? ''}
            data-tags={v.tags.join(' ')}
            data-kind="virtual"
          >
```

- [ ] **Step 4: Add the filter script**

At the very end of `src/pages/map.astro`, after the closing `</Base>` tag, add:

```astro

<script>
  const yearSelect = document.querySelector<HTMLSelectElement>('[data-map-filter-year]');
  const tagSelect = document.querySelector<HTMLSelectElement>('[data-map-filter-tag]');
  const resetBtn = document.querySelector<HTMLButtonElement>('[data-map-filter-reset]');
  const status = document.querySelector<HTMLElement>('[data-map-filter-status]');
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-event-id]'));

  // Bail out quietly if the markup isn't present (keeps the script inert elsewhere).
  if (yearSelect && tagSelect && resetBtn && status && items.length > 0) {
    const pointIds = new Set(
      items.filter((el) => el.dataset.kind === 'point').map((el) => el.dataset.eventId),
    );
    const virtualIds = new Set(
      items.filter((el) => el.dataset.kind === 'virtual').map((el) => el.dataset.eventId),
    );

    function matches(el: HTMLElement, year: string, tag: string): boolean {
      if (year && el.dataset.year !== year) return false;
      if (tag && !(el.dataset.tags ?? '').split(' ').includes(tag)) return false;
      return true;
    }

    function applyFilters() {
      const year = yearSelect!.value;
      const tag = tagSelect!.value;
      const visiblePoints = new Set<string>();
      const visibleVirtual = new Set<string>();

      for (const el of items) {
        const ok = matches(el, year, tag);
        // Dots live inside the SVG and are enhanced with opacity/pointer-events
        // (removing them would fight the existing draw order); list rows are
        // plain HTML and use `hidden` — cheaper and semantically correct there.
        if (el.closest('svg')) {
          el.classList.toggle('opacity-0', !ok);
          el.classList.toggle('pointer-events-none', !ok);
        } else {
          el.toggleAttribute('hidden', !ok);
        }
        if (ok && el.dataset.eventId) {
          (el.dataset.kind === 'point' ? visiblePoints : visibleVirtual).add(el.dataset.eventId);
        }
      }

      status!.textContent = `Showing ${visiblePoints.size} of ${pointIds.size} venues on the map${
        virtualIds.size > 0 ? ` · ${visibleVirtual.size} of ${virtualIds.size} delivered virtually` : ''
      }`;

      const params = new URLSearchParams(location.search);
      if (year) params.set('year', year);
      else params.delete('year');
      if (tag) params.set('tag', tag);
      else params.delete('tag');
      const qs = params.toString();
      history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
    }

    const initial = new URLSearchParams(location.search);
    if (initial.has('year')) yearSelect.value = initial.get('year')!;
    if (initial.has('tag')) tagSelect.value = initial.get('tag')!;

    yearSelect.addEventListener('change', applyFilters);
    tagSelect.addEventListener('change', applyFilters);
    resetBtn.addEventListener('click', () => {
      yearSelect.value = '';
      tagSelect.value = '';
      applyFilters();
    });
    window.addEventListener('popstate', () => {
      const p = new URLSearchParams(location.search);
      yearSelect.value = p.get('year') ?? '';
      tagSelect.value = p.get('tag') ?? '';
      applyFilters();
    });

    applyFilters();
  }
</script>
```

- [ ] **Step 5: Manual verification in a browser**

Run: `cd mattstratton-speaking && npm run dev`, open `http://localhost:4321/map`.

- Pick a year in the "Year" select. Confirm: some dots fade out (`opacity-0`), the alphabetized list only shows matching rows, the virtual list only shows matching rows (if any), and the status line updates with correct counts.
- Pick a topic. Confirm the same three-way sync.
- Click "Reset". Confirm everything returns to the unfiltered state and the status line matches the original header count.
- Reload the page with `?year=2023` in the URL. Confirm the Year select is pre-set to 2023 and the map/lists are pre-filtered on load.
- Use the browser back button after changing a filter. Confirm the previous filter state is restored (via the `popstate` listener).
- With browser devtools, disable JavaScript and reload `/map`. Confirm the page still renders the full map and both full lists exactly as before this task (the filter controls will just be inert selects with no effect, which is acceptable — nothing should look broken or throw a console error).

- [ ] **Step 6: Run the type check**

Run: `cd mattstratton-speaking && npx astro check`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd mattstratton-speaking
git add src/components/MapFilters.astro src/pages/map.astro
git commit -m "$(cat <<'EOF'
feat: filter the speaking map by year and topic

Client-side, query-param-reflected filtering (?year=&tag=) that keeps
the SVG dots, the alphabetized list, and the virtual-events list in
sync via shared data-event-id/data-year/data-tags attributes. Degrades
to the full unfiltered map/lists with JS disabled.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Tap-target polish — hit-circles and list row sizing

**Files:**
- Modify: `src/pages/map.astro`

**Interfaces:** none new — this task only adjusts markup already introduced in Tasks 2–4.

- [ ] **Step 1: Add an invisible hit-circle per dot**

In the SVG dot loop in `src/pages/map.astro`, inside the `<a>` (after the attributes added in Task 4, before the existing visible `<circle>`), add a second circle:

```astro
            <circle cx={p.x} cy={p.y} r={p.r + 6} fill="transparent" pointer-events="all" />
```

So the full `<a>` block reads:

```astro
          <a
            href={p.href}
            tabindex="-1"
            data-event-id={p.id}
            data-year={p.year ?? ''}
            data-tags={p.tags.join(' ')}
            data-kind="point"
          >
            <circle cx={p.x} cy={p.y} r={p.r + 6} fill="transparent" pointer-events="all" />
            <circle
              cx={p.x}
              cy={p.y}
              r={p.r}
              class="fill-accent/60 transition-[fill] hover:fill-accent-bright"
              stroke="var(--color-paper, #f5f1e8)"
              stroke-width="0.75"
            >
              <title>{p.name}{p.location ? ` — ${p.location}` : ''}</title>
            </circle>
          </a>
```

- [ ] **Step 2: Bump list row tap targets to 44px**

In both the alphabetized list and the virtual list, change the inner `<a>` class from:

```
class="group flex flex-wrap items-baseline gap-x-2"
```

to:

```
class="group flex min-h-11 flex-wrap items-center gap-x-2"
```

(two occurrences — one in the `list.map(...)` block, one in the `virtual.map(...)` block).

- [ ] **Step 3: Build and visually verify no hit-circle overlap**

Run: `cd mattstratton-speaking && npm run build && npm run preview`

Open `/map` and zoom in (browser zoom, not the map itself) on the US Midwest cluster (Chicago/Detroit/Columbus/Indianapolis-area events, the closest-together points in this dataset) via Chrome automation or manual inspection. Confirm the invisible hit-circles (visible temporarily by adding `fill="red" opacity="0.3"` locally, or by checking computed bounding boxes in devtools) don't visibly overlap between adjacent dots — if they do, reduce the `+6` in Step 1 to `+3` or `+4` and rebuild.

Also confirm on a narrow (375px) viewport via devtools device emulation that list rows have a visibly larger, more comfortable tap area than before.

- [ ] **Step 4: Run the accessibility-checker skill**

With the preview server running, invoke the `accessibility-checker` skill against `http://localhost:4321/map` (or the preview URL) per `mattstratton-speaking/CLAUDE.md`'s accessibility mandate. Confirm no new violations were introduced by this task's markup changes.

- [ ] **Step 5: Full regression pass**

Run: `cd mattstratton-speaking && npm test && npx astro check && npm run build`
Expected: all PASS.

Manually re-run the Task 4 Step 5 verification checklist (filter sync, URL round-trip, no-JS degradation) once more to confirm the hit-circle and list-sizing changes didn't disturb the filtering behavior.

- [ ] **Step 6: Commit**

```bash
cd mattstratton-speaking
git add src/pages/map.astro
git commit -m "$(cat <<'EOF'
fix: bigger tap targets on the speaking map

Invisible per-dot hit-circles give mouse/touch users a larger click
area without visually enlarging the talk-count-encoding dots. List
rows (the real keyboard/AT path) bump to a 44px min-height per WCAG
2.5.8.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Final step: open the PR

- [ ] Push the branch and open a PR (use the `pr` skill or `gh pr create`), referencing GitHub issue #51, summarizing that the map already existed and this PR adds filtering/legend/tap-target polish as the first of two planned enhancement slices (pan/zoom + tap-to-preview is a separate follow-up PR). Do not close issue #51 yet — it stays open until the follow-up PR also lands, unless you decide the issue should be split into two tracked issues instead.
