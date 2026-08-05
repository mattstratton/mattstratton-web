# Design: interactive pan/zoom + tap-to-preview for the "Where I've spoken" map

**Date:** 2026-07-16
**Status:** Approved (design); pending implementation plan

## Problem

PR1 (merged) added filtering, a legend, and tap-target polish to the existing
static "Where I've spoken" map (`src/pages/map.astro`). This spec covers PR2,
the second and final planned slice for GitHub issue #51: interactive pan/zoom
and tap-to-preview on the map itself. Today the map is a fixed, full-world SVG
— dense regions (e.g. the US Midwest, where several events sit close
together) can't be zoomed into, and there's no way to see an event's details
without following its link away from the page.

Both additions are pointer/touch-driven client-side enhancements on top of a
page that must keep rendering and linking correctly with JavaScript disabled
— same progressive-enhancement contract PR1 established, and the same one
`src/components/Search.astro`/`src/components/SlideBrowser.astro` already
follow.

## Decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| Library choice | None. No Leaflet/MapLibre/d3-zoom. The map is a hand-authored Natural Earth SVG projected at build time — there's no tile server, so a tile-oriented library is the wrong shape. `d3-zoom` would add a runtime dependency for ~150 lines of hand-rollable pointer-math. Hand-rolling matches the "static, durable, works in 15 years" ethos in `CLAUDE.md` and the site's existing zero-framework, vanilla-`<script>`-island pattern (`Search.astro`, `SlideBrowser.astro`). |
| Pan/zoom mechanism | Rewrite the outer `<svg>`'s `viewBox` attribute directly, not a `<g transform>`. Every dot's `x`/`y` (already computed server-side) stays valid in the same 1000×500 coordinate space regardless of current zoom/pan — no matrix inversion needed anywhere, including for tap-to-preview panel anchoring. |
| Zoom math | Extracted into a **pure, unit-tested module** (`src/lib/map-viewbox.ts`) — `clampViewBox`, `zoomAt`, `pinchZoom`, `panBy` — mirroring the `map-data.ts` precedent (PR1) of separating testable logic from DOM glue. This is the one part of PR2 precise enough, and bug-prone enough (focal-point math, clamping, pinch math), to be worth a real test suite; the DOM/event-wiring layer stays manually verified, same as PR1's filter script. |
| Zoom range | Min = fit-to-world (`0 0 1000 500`, today's default view). Max = 8× (viewBox width down to `125`). Enforced by `clampViewBox`. |
| Desktop interaction | `wheel` zooms around the cursor position (`preventDefault`d). `pointerdown`/`pointermove`/`pointerup`/`pointercancel` on the SVG drags/pans. |
| Mobile interaction | The same Pointer Event handlers give one-finger drag-to-pan for free (Pointer Events unify mouse/touch/pen — no separate touch-event code path). Two simultaneous active pointers → pinch-to-zoom, computed from the change in inter-pointer distance (scale) and pinch-midpoint movement (pan). `svg.style.touchAction = 'none'` is set **only inside the guarded script** (never as a static class), so a browser with JS disabled still gets normal native touch scrolling over the map region — setting it statically would be a real progressive-enhancement regression for no-JS mobile users. |
| Zoom/reset controls | A `+`/`−`/"Reset view" button row, absolutely positioned in the map figure's corner. Present in markup but `hidden` by default, unhidden by the script once it runs — same pattern as `SlideBrowser.astro`'s prev/next buttons. Icons via the already-installed `astro-icon` + `@iconify-json/lucide` (`lucide:zoom-in`, `lucide:zoom-out`, `lucide:maximize-2`, confirmed against the existing `<Icon name="lucide:mic" .../>` usage convention in `src/pages/bio.astro`/`src/data/bio.ts`) — zero new dependency. |
| Reduced motion | No eased/animated transitions anywhere in this feature. `viewBox` isn't a CSS-animatable property, so any "snap to reset" would need a hand-rolled `requestAnimationFrame` tween — deliberately skipped. Reset is instant. This trivially satisfies `prefers-reduced-motion` without extra logic, and keeps the whole feature simpler. |
| Tap-to-preview trigger | Clicking/tapping a dot always calls `preventDefault()` and opens/updates a preview panel instead of navigating immediately — uniform behavior for mouse and touch (not "instant-navigate on desktop, preview on touch"). The panel's own link is the one real "go to this event" action once opened. |
| Drag-vs-tap disambiguation | A `moved` flag, reset to `false` only when a *fresh* single-pointer gesture begins (not when a second finger joins mid-gesture), set to `true` the first time pointer movement during that gesture exceeds a small pixel threshold. The `click` handler only opens the panel if `moved` is still `false` when the click fires — this is the concrete resolution of the "drag-to-pan vs. tap-a-dot" ambiguity that the earlier interactivity design pass flagged but didn't fully specify. |
| Panel markup location | A single info-panel `<div role="dialog">`, sibling of the map `<figure>` — not inside the SVG (`foreignObject` positioning is its own coordinate-math headache), not a component split across two files (see "Component structure" below). |
| Panel positioning | Narrow viewports (`<640px`): fixed bottom sheet, no inline positioning — avoids float-positioning edge-clamp math on the hardest viewport to get right. `≥640px`: floats near the tapped dot via `getBoundingClientRect()` + viewport-edge clamping, positioned with inline `style.left`/`style.top` (deliberately **not** set at all on narrow viewports, so the mobile CSS classes — which need to win on `left`/`top`/`bottom` — aren't fighting a higher-specificity inline style). |
| Panel focus handling | Mirrors `Search.astro`'s existing dialog pattern exactly: focus moves to the panel's close button on open, restores to the previously-focused element on close, and a small two-element Tab-trap (same shape as `Search.astro`'s) keeps focus inside the panel while it's open. `Escape` closes it. Clicking outside the panel (and not on a dot) closes it. |
| Native tooltips | Each dot's existing `<title>` hover tooltip (from before PR1) is kept, not replaced — free, harmless, helps desktop mouse users who don't trigger the JS panel. |
| Accessibility contract | Unchanged from PR1: the map `<svg>` stays `aria-hidden="true"`, dots stay `tabindex="-1"` — this whole feature is pointer/mouse/touch-only enhancement on a still-decorative element, layered on top of the still-authoritative alphabetized list. Nothing about *opening* the panel needs to be keyboard-reachable (its trigger, a dot, deliberately isn't) — but the zoom/reset buttons **do** belong in the tab order (real controls, not decoration), and the panel, once open, must be a fully keyboard-operable/focus-managed real dialog. |
| Interop with PR1 filtering | No special-casing needed. PR1's filter script toggles `pointer-events-none` (a stylesheet rule) on a filtered-out dot's `<a>`, which already beats the presentation-attribute `pointer-events="all"` PR1 set on that same element (see the inline comment in the current `map.astro`) — meaning a filtered-out dot simply never receives `pointerdown`/`click` at all. PR2's pan/zoom and tap-to-preview code needs zero awareness of filter state. |
| Component structure | **Everything stays inline in `map.astro`** (new markup + one new `<script>` block after the existing filter script), matching how PR1 itself extended this same file, rather than splitting into a new `MapInteractive.astro` component. Reason: the zoom/reset buttons must be DOM *descendants* of the map `<figure>` for CSS absolute positioning to anchor to it, while the info panel must be a *sibling* of `<figure>` (not nested inside it, to avoid `<figure>`'s own layout/overflow rules clipping a floating panel) — a single Astro component can emit multiple top-level elements, but placing one `<Component />` call site can't satisfy "buttons go here, panel goes somewhere else entirely" without either two separate components (splitting one coordinating script awkwardly across two files) or accepting the CSS-anchoring break. Keeping it inline avoids both problems and matches precedent. |
| New dependencies | None. Confirmed against `package.json`: `astro-icon` + `@iconify-json/lucide` are already installed and already used elsewhere (`bio.astro`). |

## Data/component shape

No changes to `src/lib/map-data.ts`'s `MapPoint`/`VirtualEvent`/`MapData`
shapes. `map.astro`'s dot-rendering loop gains three more `data-*` attributes
per dot (all already available from the existing `p` object — no new data
computation needed): `data-name={p.name}`, `data-location={p.location}`,
`data-count={p.talkCount}`. The event's link (`p.href`) is **not** duplicated
into a new `data-href` — the panel reads it straight off the existing
`href` attribute via `dot.getAttribute('href')`.

New pure module `src/lib/map-viewbox.ts`:

```ts
export interface ViewBox { x: number; y: number; w: number; h: number; }
export interface ViewBoxLimits { width: number; height: number; minWidth: number; }

export function clampViewBox(vb: ViewBox, limits: ViewBoxLimits): ViewBox;
export function zoomAt(current: ViewBox, focal: { x: number; y: number }, factor: number, limits: ViewBoxLimits): ViewBox;
export function panBy(start: ViewBox, delta: { x: number; y: number }, limits: ViewBoxLimits): ViewBox;

export interface PinchGesture {
  startViewBox: ViewBox;
  startDistance: number;
  startFocal: { x: number; y: number }; // pinch midpoint, in startViewBox's coordinate space
}
export function pinchZoom(
  gesture: PinchGesture,
  currentDistance: number,
  panDelta: { x: number; y: number }, // how far the pinch midpoint has moved, in viewBox units
  limits: ViewBoxLimits,
): ViewBox;
```

All four functions are pure (no DOM, no globals) — every input needed to
compute the next `ViewBox` is passed in explicitly, which is what makes them
unit-testable with `node:test` the same way `map-data.ts` is.

## Out of scope (explicitly excluded, not deferred-with-a-ticket)

- Any mapping library, tile server, or `d3-zoom` dependency.
- Double-tap-to-zoom gesture (native double-tap/double-click browser behavior isn't fought here; the button row covers the discoverability gap).
- "Recenter to continent" shortcut buttons (superseded by free pan/pinch + a single "Reset view" button).
- Click-a-list-row-to-highlight-its-dot, multi-select tag filtering, URL deep links to a specific event, country-grouped list — all already excluded in PR1's spec and still out of scope here.
- Any change to `MapFilters.astro`, `MapLegend.astro`, or `src/lib/map-data.ts` — PR2 is additive only on top of PR1's merged work.
