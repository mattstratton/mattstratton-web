# Design: filtering, legend, and tap-target polish for the "Where I've spoken" map

**Date:** 2026-07-16
**Status:** Approved (design); pending implementation plan

## Problem

GitHub issue #51 asked for a map of speaking locations. That map already
exists and is live: `src/pages/map.astro`, a build-time static SVG (via
`d3-geo` + `topojson-client` projecting a committed Natural Earth topojson)
with dots sized by talk count, plus a fully accessible alphabetized text
list and a separate "Delivered virtually" list for events with no
coordinates. Since the core ask was already shipped, this project treats
the issue as a real enhancement rather than a close-it task, split into two
independently shippable slices:

- **This spec (PR1):** filtering by year/topic, a legend explaining the
  dot-size encoding, and mobile/tap-target polish.
- **A later spec (PR2, not covered here):** interactive pan/zoom and
  tap-to-preview, which needs a different kind of script (pointer/touch
  event handling) and is scoped separately so each PR stays one concern.

Two independent design passes (interactivity architecture; filtering/
legend/polish) confirmed there's no framework and zero client-side JS on
this site today (`astro.config.mjs` has only `@astrojs/sitemap` +
`astro-icon`), and that the established pattern for adding interactivity
(`Search.astro`, `SlideBrowser.astro`) is a vanilla `<script>` island:
markup renders fully and correctly with JS off, and JS only progressively
narrows/enhances. This spec follows that pattern.

## Decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| Filter mechanism | Client-side only, query-param-reflected (`?year=&tag=`) via `URLSearchParams` + `history.replaceState`. Not static per-filter pages — year × tag is a large mostly-empty cross product, and the dataset (93 events, 106 talks) is small enough to filter entirely in the browser. |
| Filter UI | Two `<select>` elements ("Year", "Topic"), not a chip cloud — ~20 tags as tap targets above a map is worse mobile real estate than one native picker, and single-select avoids AND/OR multi-tag semantics. |
| Where tags live | On talks (`src/data/tags.json`, keyed by `notistSlug`), not on events. Event-level tags are the union of `tagsFor(talk.notistSlug)` across every talk whose `event` reference resolves to that event — same join shape as the existing `talkCount` map already built in `map.astro`. |
| Dot size formula | Bump from today's inline `3 + sqrt(count)` to `4 + sqrt(count) * 1.5`, centralized in one `dotRadius()` function shared by the map and the new legend so they can't visually drift apart. |
| Legend | 3 representative dot sizes (1 talk / dataset median / dataset max, computed from real data, not hardcoded), rendered as a real (non-`aria-hidden`) `<ul>` — informative content, unlike the decorative main map SVG. |
| Tap-target fix | Two changes: (1) an invisible hit-circle per dot, `r = visibleR + 6` viewBox units, `pointer-events="all"`, boosting the effective tap area without visually enlarging the talk-count-encoding dot; (2) list rows bump from `py-1.5` to `min-h-11` (44px) — the list, not the SVG dots, is the tap target that actually matters per WCAG 2.5.8, since dots stay intentionally `tabindex="-1"` pointer-only convenience. |
| Accessibility contract | Unchanged. SVG stays `aria-hidden="true"`; dots stay `tabindex="-1"`; the alphabetized list remains the authoritative accessible interface. Filtering must keep the SVG dots, the alphabetized list, and the virtual-events list in sync (same `data-event-id`/`data-year`/`data-tags` predicate on all three), with an `aria-live="polite"` status region reporting live counts so screen-reader users get the same filtered view sighted users see. |
| Testability | `map-data.ts` is a pure, dependency-injected function (project/tagsFor/tagBySlug passed in, not imported and called directly) so it's unit-testable with `node:test` without needing Astro's runtime or real content collections — mirrors the `scripts/lib/memory-sync.ts` precedent (pure builders, thin call site does the I/O). |
| No new dependencies | Confirmed against `package.json` — `d3-geo`/`topojson-client` stay build-time-only devDependencies; no mapping library, no new npm package needed for filtering/legend/polish. |

## Data shape

New module `src/lib/map-data.ts`:

```ts
export function dotRadius(count: number): number; // 4 + sqrt(count) * 1.5

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
  eventId?: string; // talk.data.event?.id
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
  tags: string[]; // tag slugs
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
  years: number[]; // distinct, descending
  tags: TagInfo[]; // from src/lib/tags.ts, filtered to slugs actually present
}

export interface BuildMapDataOptions {
  project: (lonLat: [number, number]) => [number, number] | null;
  tagsFor: (notistSlug: string) => string[];
  tagBySlug: (slug: string) => TagInfo | undefined;
}

export function buildMapData(
  events: EventInput[],
  talks: TalkInput[],
  options: BuildMapDataOptions,
): MapData;
```

`map.astro` maps `getCollection('events')`/`getCollection('talks')` entries
into `EventInput[]`/`TalkInput[]`, computes the `d3-geo` projection exactly
as today, and calls `buildMapData(events, talks, { project: projection,
tagsFor, tagBySlug })` — the projection/tagsFor/tagBySlug functions are
passed in rather than imported inside `map-data.ts`, so unit tests can pass
trivial stubs instead of depending on real geo math or the real curated
tag registry in `src/data/tags.json`.

An event whose projection returns `null` (an off-globe artifact) is
dropped from `points` entirely and does **not** fall into `virtual` —
`virtual` is specifically "no coordinates" (the `location: "Virtual"`
sentinel), not "unplottable." This matches today's existing behavior in
`map.astro` (`.filter((p): p is NonNullable<typeof p> => p !== null)`).

## Components

1. **`src/lib/map-data.ts`** (+ `map-data.test.ts`) — the pure data layer above.
2. **`src/components/MapLegend.astro`** — takes `counts: number[]`, renders each as a small `<svg>` circle (via `dotRadius()`) + visible label, as the map `<figure>`'s `<figcaption>`.
3. **`src/components/MapFilters.astro`** — takes `years`, `tags`, `total`, `virtualTotal`; renders the two `<select>`s, a Reset button, and the `aria-live` status paragraph. Placed between the page `<header>` and the map `<figure>`.
4. **`src/pages/map.astro`** — refactored to call `buildMapData()`; every dot `<a>` and every list `<li>` (both lists) gets `data-event-id`, `data-year`, `data-tags`, `data-kind="point"|"virtual"` attributes; dots get an added invisible hit-circle; list rows bump to `min-h-11`; a co-located `<script>` wires the filter selects to toggle visibility across all three regions and syncs `?year=`/`?tag=` in the URL.

## Out of scope (deferred to PR2 or later, not part of this spec)

- Pan/zoom, tap-to-preview info panel — separate future spec, different script concern (pointer/touch event handling vs. attribute-based filtering).
- Click-a-list-row-to-highlight-its-dot, "recenter to continent" shortcuts, multi-select tags, URL deep links to a specific event, grouping the list by country — all discussed and explicitly excluded as low-payoff/scope-creep for this slice.
