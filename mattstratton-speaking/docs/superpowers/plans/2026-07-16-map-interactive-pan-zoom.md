# Interactive Map Pan/Zoom + Tap-to-Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add pan/zoom and a tap-to-preview info panel to the "Where I've spoken" map (`src/pages/map.astro`), with zero new dependencies and no regression to PR1's filtering or the existing accessibility/no-JS contract.

**Architecture:** A pure, unit-tested viewBox-math module (`src/lib/map-viewbox.ts`) computes every zoom/pan/pinch transform; a single new `<script>` block in `map.astro` wires that math to `wheel`/`pointer*`/`click` events on the map SVG, plus a small info-panel dialog (open/close/focus-trap, modeled directly on `src/components/Search.astro`'s existing dialog pattern). Everything stays inline in `map.astro` (no new components) — see the design spec's "Component structure" decision for why.

**Tech Stack:** Astro 6, TypeScript (strict), Tailwind v4 utility classes, `node:test` (existing `npm test` convention), `astro-icon` + `@iconify-json/lucide` (already installed, already used in `src/pages/bio.astro`).

## Global Constraints

- **Zero new npm dependencies.** No mapping library, no `d3-zoom`.
- **Zero new client-side frameworks.** Everything is a vanilla `<script>` island.
- **No regression to PR1.** `MapFilters.astro`, `MapLegend.astro`, and `src/lib/map-data.ts` are not modified. The existing filter `<script>` in `map.astro` is not modified — this feature adds a second, independent `<script>` block after it.
- **No regression with JS disabled.** The map must still render and every link must still work with the new `<script>` never running.
- **`svg.style.touchAction = 'none'` is set only inside the guarded script, never as a static class** — a static class would break native touch scrolling for no-JS mobile users over the map region.
- **Accessibility contract fixed:** the map `<svg>` stays `aria-hidden="true"`; dots stay `tabindex="-1"`. The zoom/reset buttons must be real, tabbable controls. The info panel, once open, must be a fully keyboard-operable dialog (focus moves in on open, restores on close, Tab-trapped, `Escape` closes it) — mirror `src/components/Search.astro`'s existing dialog pattern exactly.
- **Zoom range:** min width = `1000` (fit-to-world), max zoom = width `125` (8× magnification). World dimensions are `W = 1000`, `H = 500` (already constants in `map.astro`).
- **No eased/animated transitions.** `viewBox` isn't CSS-animatable; "Reset view" snaps instantly. This is deliberate, not a shortcut — see the spec's "Reduced motion" decision.
- Every commit message ends with: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- Work happens on a dedicated branch off `main`; this plan ends with a PR, never a direct merge to `main`.
- Design reference: `docs/superpowers/specs/2026-07-16-map-interactive-pan-zoom-design.md`.

---

## File Structure

**Create:**
- `src/lib/map-viewbox.ts` — pure viewBox math: `clampViewBox`, `zoomAt`, `panBy`, `pinchZoom`.
- `src/lib/map-viewbox.test.ts` — unit tests.

**Modify:**
- `src/pages/map.astro` — add `data-map-svg` hook + 3 more `data-*` attrs per dot; add zoom/reset buttons; add the info-panel markup; add one new `<script>` block wiring pan/zoom/pinch/tap-to-preview.

---

## Task 1: `map-viewbox.ts` — pure zoom/pan/pinch math

**Files:**
- Create: `src/lib/map-viewbox.ts`
- Create: `src/lib/map-viewbox.test.ts`

**Interfaces:**
- Produces (used by Task 2 and Task 3):
  - `interface ViewBox { x: number; y: number; w: number; h: number }`
  - `interface ViewBoxLimits { width: number; height: number; minWidth: number }`
  - `clampViewBox(vb: ViewBox, limits: ViewBoxLimits): ViewBox`
  - `zoomAt(current: ViewBox, focal: { x: number; y: number }, factor: number, limits: ViewBoxLimits): ViewBox`
  - `panBy(start: ViewBox, delta: { x: number; y: number }, limits: ViewBoxLimits): ViewBox`
  - `interface PinchGesture { startViewBox: ViewBox; startDistance: number; startFocal: { x: number; y: number } }`
  - `pinchZoom(gesture: PinchGesture, currentDistance: number, panDelta: { x: number; y: number }, limits: ViewBoxLimits): ViewBox`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/map-viewbox.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampViewBox, zoomAt, panBy, pinchZoom, type ViewBox, type ViewBoxLimits } from './map-viewbox.ts';

const LIMITS: ViewBoxLimits = { width: 1000, height: 500, minWidth: 125 };

test('clampViewBox leaves an already-valid viewBox unchanged', () => {
  const vb: ViewBox = { x: 100, y: 50, w: 500, h: 250 };
  assert.deepEqual(clampViewBox(vb, LIMITS), vb);
});

test('clampViewBox clamps width up to minWidth and derives height from the aspect ratio', () => {
  const result = clampViewBox({ x: 0, y: 0, w: 50, h: 25 }, LIMITS);
  assert.deepEqual(result, { x: 0, y: 0, w: 125, h: 62.5 });
});

test('clampViewBox clamps width down to the world width', () => {
  const result = clampViewBox({ x: 0, y: 0, w: 2000, h: 1000 }, LIMITS);
  assert.deepEqual(result, { x: 0, y: 0, w: 1000, h: 500 });
});

test('clampViewBox clamps x/y into [0, width-w]/[0, height-h]', () => {
  assert.deepEqual(clampViewBox({ x: -50, y: 0, w: 200, h: 100 }, LIMITS), { x: 0, y: 0, w: 200, h: 100 });
  assert.deepEqual(clampViewBox({ x: 900, y: 0, w: 200, h: 100 }, LIMITS), { x: 800, y: 0, w: 200, h: 100 });
  assert.deepEqual(clampViewBox({ x: 0, y: -50, w: 200, h: 100 }, LIMITS), { x: 0, y: 0, w: 200, h: 100 });
  assert.deepEqual(clampViewBox({ x: 0, y: 450, w: 200, h: 100 }, LIMITS), { x: 0, y: 400, w: 200, h: 100 });
});

test('zoomAt zooming in 2x on the exact center keeps the center point fixed', () => {
  const current: ViewBox = { x: 0, y: 0, w: 1000, h: 500 };
  const result = zoomAt(current, { x: 500, y: 250 }, 0.5, LIMITS);
  assert.deepEqual(result, { x: 250, y: 125, w: 500, h: 250 });
});

test('zoomAt clamps zoom-in at the max-zoom floor (minWidth)', () => {
  const current: ViewBox = { x: 0, y: 0, w: 1000, h: 500 };
  const result = zoomAt(current, { x: 500, y: 250 }, 0.001, LIMITS);
  assert.equal(result.w, 125);
  assert.equal(result.h, 62.5);
});

test('zoomAt clamps zoom-out at the world width (already-fit view stays put)', () => {
  const current: ViewBox = { x: 0, y: 0, w: 1000, h: 500 };
  const result = zoomAt(current, { x: 500, y: 250 }, 2, LIMITS);
  assert.deepEqual(result, { x: 0, y: 0, w: 1000, h: 500 });
});

test('panBy translates the viewBox by the given delta', () => {
  const result = panBy({ x: 100, y: 50, w: 500, h: 250 }, { x: 20, y: 10 }, LIMITS);
  assert.deepEqual(result, { x: 80, y: 40, w: 500, h: 250 });
});

test('panBy clamps at the edge of the world', () => {
  const result = panBy({ x: 480, y: 0, w: 500, h: 250 }, { x: -50, y: 0 }, LIMITS);
  assert.deepEqual(result, { x: 500, y: 0, w: 500, h: 250 });
});

test('pinchZoom with no pan matches zoomAt for the same zoom-in-on-center case', () => {
  const gesture = {
    startViewBox: { x: 0, y: 0, w: 1000, h: 500 },
    startDistance: 100,
    startFocal: { x: 500, y: 250 },
  };
  const result = pinchZoom(gesture, 200, { x: 0, y: 0 }, LIMITS); // fingers moved twice as far apart -> zoom in 2x
  assert.deepEqual(result, { x: 250, y: 125, w: 500, h: 250 });
});

test('pinchZoom applies the pinch-midpoint pan delta on top of the zoom', () => {
  const gesture = {
    startViewBox: { x: 0, y: 0, w: 1000, h: 500 },
    startDistance: 100,
    startFocal: { x: 500, y: 250 },
  };
  const result = pinchZoom(gesture, 200, { x: 50, y: 0 }, LIMITS);
  assert.deepEqual(result, { x: 200, y: 125, w: 500, h: 250 });
});

test('pinchZoom zooming back out from a zoomed-in start returns to the exact original view', () => {
  const gesture = {
    startViewBox: { x: 250, y: 125, w: 500, h: 250 },
    startDistance: 200,
    startFocal: { x: 500, y: 250 }, // center of the startViewBox
  };
  const result = pinchZoom(gesture, 100, { x: 0, y: 0 }, LIMITS); // fingers moved back together -> zoom out 2x
  assert.deepEqual(result, { x: 0, y: 0, w: 1000, h: 500 });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd mattstratton-speaking && node --import tsx --test src/lib/map-viewbox.test.ts`
Expected: FAIL — `Cannot find module './map-viewbox.ts'`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/map-viewbox.ts`:

```ts
/** A rectangle of the map's 1000×500 world, in SVG viewBox units. */
export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The world's full dimensions and the narrowest (most-zoomed-in) width allowed. */
export interface ViewBoxLimits {
  width: number;
  height: number;
  minWidth: number;
}

/** Clamps width into [minWidth, width], derives height from the fixed aspect
 * ratio, then clamps x/y so the viewBox never shows anything outside the world. */
export function clampViewBox(vb: ViewBox, limits: ViewBoxLimits): ViewBox {
  const w = Math.min(limits.width, Math.max(limits.minWidth, vb.w));
  const h = (w * limits.height) / limits.width;
  const x = Math.min(limits.width - w, Math.max(0, vb.x));
  const y = Math.min(limits.height - h, Math.max(0, vb.y));
  return { x, y, w, h };
}

/** Zooms `current` by `factor` (< 1 zooms in, > 1 zooms out) around a focal
 * point given in world/viewBox coordinates, keeping that point visually fixed. */
export function zoomAt(
  current: ViewBox,
  focal: { x: number; y: number },
  factor: number,
  limits: ViewBoxLimits,
): ViewBox {
  const newW = Math.min(limits.width, Math.max(limits.minWidth, current.w * factor));
  const newH = (newW * limits.height) / limits.width;
  const relX = (focal.x - current.x) / current.w;
  const relY = (focal.y - current.y) / current.h;
  return clampViewBox({ x: focal.x - relX * newW, y: focal.y - relY * newH, w: newW, h: newH }, limits);
}

/** Translates `start` by `delta` (in viewBox units), clamped to the world. */
export function panBy(start: ViewBox, delta: { x: number; y: number }, limits: ViewBoxLimits): ViewBox {
  return clampViewBox({ ...start, x: start.x - delta.x, y: start.y - delta.y }, limits);
}

/** A pinch gesture's fixed starting state, captured once when the second
 * finger touches down — every subsequent frame is computed relative to this,
 * never to the live/current viewBox, so a multi-frame gesture can't drift. */
export interface PinchGesture {
  startViewBox: ViewBox;
  startDistance: number;
  /** The pinch's starting midpoint, already expressed in startViewBox's coordinate space. */
  startFocal: { x: number; y: number };
}

/** Computes the new viewBox for a pinch gesture given the current
 * inter-finger distance and how far the pinch midpoint has moved (in viewBox
 * units) since the gesture started. */
export function pinchZoom(
  gesture: PinchGesture,
  currentDistance: number,
  panDelta: { x: number; y: number },
  limits: ViewBoxLimits,
): ViewBox {
  const factor = gesture.startDistance / currentDistance;
  const newW = Math.min(limits.width, Math.max(limits.minWidth, gesture.startViewBox.w * factor));
  const newH = (newW * limits.height) / limits.width;
  const relX = (gesture.startFocal.x - gesture.startViewBox.x) / gesture.startViewBox.w;
  const relY = (gesture.startFocal.y - gesture.startViewBox.y) / gesture.startViewBox.h;
  return clampViewBox(
    {
      x: gesture.startFocal.x - relX * newW - panDelta.x,
      y: gesture.startFocal.y - relY * newH - panDelta.y,
      w: newW,
      h: newH,
    },
    limits,
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd mattstratton-speaking && node --import tsx --test src/lib/map-viewbox.test.ts`
Expected: PASS — all 12 tests green.

- [ ] **Step 5: Run the full test suite and type check**

Run: `cd mattstratton-speaking && npm test && npx astro check`
Expected: PASS, no new errors.

- [ ] **Step 6: Commit**

```bash
cd mattstratton-speaking
git add src/lib/map-viewbox.ts src/lib/map-viewbox.test.ts
git commit -m "$(cat <<'EOF'
feat: add pure viewBox zoom/pan/pinch math (map-viewbox.ts)

Pure, unit-tested functions for the speaking map's upcoming pan/zoom
UI — clampViewBox/zoomAt/panBy/pinchZoom — factored out so the trickiest
math (focal-point zoom, pinch gestures, edge clamping) has real test
coverage independent of DOM/event-wiring code.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Wire pan/zoom into `map.astro` (wheel, drag, pinch, buttons)

**Files:**
- Modify: `src/pages/map.astro`

**Interfaces:**
- Consumes: `clampViewBox`, `zoomAt`, `panBy`, `pinchZoom`, `type ViewBox`, `type PinchGesture` from `../lib/map-viewbox` (Task 1).

This task does NOT add the tap-to-preview panel yet (Task 3) — only pan/zoom/pinch and the zoom/reset buttons. The `moved`-flag groundwork this task lays (tracking whether a gesture included real movement) is exactly what Task 3's tap-vs-drag disambiguation needs, so leave the `moved` variable and the `click` listener stub in place for Task 3 to extend.

- [ ] **Step 1: Make `<figure>` a positioning context and tag the SVG**

In `src/pages/map.astro`, change (current line 89):

```astro
  <figure class="mt-8">
```

to:

```astro
  <figure class="relative mt-8">
```

And change (current line 90):

```astro
    <svg viewBox={`0 0 ${W} ${H}`} class="h-auto w-full" aria-hidden="true">
```

to:

```astro
    <svg viewBox={`0 0 ${W} ${H}`} class="h-auto w-full" aria-hidden="true" data-map-svg>
```

- [ ] **Step 2: Add zoom/reset buttons, hidden by default**

Add the `Icon` import at the top of the frontmatter, alongside the other imports (after the existing `import MapFilters from '../components/MapFilters.astro';` line):

```astro
import { Icon } from 'astro-icon/components';
```

Immediately after the closing `</svg>` tag (before `<MapLegend counts={legendCounts} />`), add:

```astro
    <div class="absolute right-3 bottom-3 flex gap-1" data-map-zoom-controls hidden>
      <button
        type="button"
        data-map-zoom-out
        aria-label="Zoom out"
        class="flex h-9 w-9 items-center justify-center rounded-full bg-panel/95 shadow ring-1 ring-rule hover:text-accent"
      >
        <Icon name="lucide:zoom-out" class="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        data-map-zoom-in
        aria-label="Zoom in"
        class="flex h-9 w-9 items-center justify-center rounded-full bg-panel/95 shadow ring-1 ring-rule hover:text-accent"
      >
        <Icon name="lucide:zoom-in" class="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        data-map-zoom-reset
        aria-label="Reset map view"
        class="flex h-9 w-9 items-center justify-center rounded-full bg-panel/95 shadow ring-1 ring-rule hover:text-accent"
      >
        <Icon name="lucide:maximize-2" class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
```

- [ ] **Step 3: Add the pan/zoom `<script>` block**

At the very end of `src/pages/map.astro`, after the existing filter `</script>` closing tag, add a second `<script>` block:

```astro

<script>
  import { clampViewBox, zoomAt, panBy, pinchZoom, type ViewBox, type PinchGesture } from '../lib/map-viewbox';

  const svg = document.querySelector<SVGSVGElement>('[data-map-svg]');
  const zoomControls = document.querySelector<HTMLElement>('[data-map-zoom-controls]');
  const zoomInBtn = document.querySelector<HTMLButtonElement>('[data-map-zoom-in]');
  const zoomOutBtn = document.querySelector<HTMLButtonElement>('[data-map-zoom-out]');
  const resetBtn = document.querySelector<HTMLButtonElement>('[data-map-zoom-reset]');

  if (svg && zoomControls && zoomInBtn && zoomOutBtn && resetBtn) {
    const LIMITS = { width: 1000, height: 500, minWidth: 125 };
    let viewBox: ViewBox = { x: 0, y: 0, w: LIMITS.width, h: LIMITS.height };

    function render() {
      svg!.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
    }

    function clientToViewBox(clientX: number, clientY: number, rect: DOMRect, vb: ViewBox) {
      return {
        x: vb.x + ((clientX - rect.left) / rect.width) * vb.w,
        y: vb.y + ((clientY - rect.top) / rect.height) * vb.h,
      };
    }

    zoomControls.hidden = false;

    zoomInBtn.addEventListener('click', () => {
      const center = { x: viewBox.x + viewBox.w / 2, y: viewBox.y + viewBox.h / 2 };
      viewBox = zoomAt(viewBox, center, 1 / 1.4, LIMITS);
      render();
    });
    zoomOutBtn.addEventListener('click', () => {
      const center = { x: viewBox.x + viewBox.w / 2, y: viewBox.y + viewBox.h / 2 };
      viewBox = zoomAt(viewBox, center, 1.4, LIMITS);
      render();
    });
    resetBtn.addEventListener('click', () => {
      viewBox = clampViewBox({ x: 0, y: 0, w: LIMITS.width, h: LIMITS.height }, LIMITS);
      render();
    });

    // touch-action is set here (not as a static class) so a no-JS mobile
    // browser keeps normal native touch scrolling over the map region.
    svg.style.touchAction = 'none';

    svg.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const rect = svg!.getBoundingClientRect();
        const focal = clientToViewBox(e.clientX, e.clientY, rect, viewBox);
        viewBox = zoomAt(viewBox, focal, e.deltaY > 0 ? 1.2 : 1 / 1.2, LIMITS);
        render();
      },
      { passive: false },
    );

    const pointers = new Map<number, { x: number; y: number }>();
    let dragStart: { x: number; y: number; viewBox: ViewBox; rect: DOMRect } | null = null;
    let pinchStart: (PinchGesture & { rect: DOMRect; midClient: { x: number; y: number } }) | null = null;
    let moved = false;

    function pointerDistance(): number {
      const pts = [...pointers.values()];
      return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }
    function pointerMidpoint(): { x: number; y: number } {
      const pts = [...pointers.values()];
      return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
    }

    svg.addEventListener('pointerdown', (e) => {
      svg!.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 1) {
        moved = false;
        dragStart = { x: e.clientX, y: e.clientY, viewBox: { ...viewBox }, rect: svg!.getBoundingClientRect() };
        pinchStart = null;
      } else if (pointers.size === 2) {
        dragStart = null;
        const rect = svg!.getBoundingClientRect();
        const midClient = pointerMidpoint();
        pinchStart = {
          startViewBox: { ...viewBox },
          startDistance: pointerDistance(),
          startFocal: clientToViewBox(midClient.x, midClient.y, rect, viewBox),
          rect,
          midClient,
        };
      }
    });

    svg.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 1 && dragStart) {
        const dx = ((e.clientX - dragStart.x) / dragStart.rect.width) * dragStart.viewBox.w;
        const dy = ((e.clientY - dragStart.y) / dragStart.rect.height) * dragStart.viewBox.h;
        if (Math.abs(e.clientX - dragStart.x) > 4 || Math.abs(e.clientY - dragStart.y) > 4) moved = true;
        viewBox = panBy(dragStart.viewBox, { x: dx, y: dy }, LIMITS);
        render();
      } else if (pointers.size === 2 && pinchStart) {
        moved = true;
        const midNow = pointerMidpoint();
        const panDelta = {
          x: ((midNow.x - pinchStart.midClient.x) / pinchStart.rect.width) * pinchStart.startViewBox.w,
          y: ((midNow.y - pinchStart.midClient.y) / pinchStart.rect.height) * pinchStart.startViewBox.h,
        };
        viewBox = pinchZoom(pinchStart, pointerDistance(), panDelta, LIMITS);
        render();
      }
    });

    function endPointer(e: PointerEvent) {
      pointers.delete(e.pointerId);
      if (pointers.size === 0) {
        dragStart = null;
        pinchStart = null;
      }
    }
    svg.addEventListener('pointerup', endPointer);
    svg.addEventListener('pointercancel', endPointer);

    // Tap-vs-drag disambiguation for Task 3 (tap-to-preview) to consume:
    // `moved` is true if this gesture included any real pan/pinch movement.
    svg.addEventListener('click', (e) => {
      const dot = (e.target as Element).closest<HTMLElement>('a[data-event-id][data-kind="point"]');
      if (!dot) return;
      e.preventDefault();
      if (moved) return;
      // Task 3 replaces this comment with a call to open the preview panel.
    });
  }
</script>
```

- [ ] **Step 4: Manual verification in a browser**

Run: `cd mattstratton-speaking && npm run dev`, open `http://localhost:4321/map`.

- Confirm the zoom in/out/reset buttons appear (they're `hidden` until JS runs).
- Scroll the mouse wheel over the map: confirm it zooms in/out centered on the cursor, and the page itself doesn't scroll while hovering the map.
- Click-drag on the map: confirm it pans smoothly, with correct direction (dragging right reveals content to the left).
- Click the zoom-in/zoom-out buttons: confirm they zoom toward the current view's center.
- Click "Reset view": confirm it snaps instantly back to the full world.
- Zoom in repeatedly near a screen edge: confirm you can't pan/zoom to see empty space outside the world bounds.
- Using Chrome device-emulation touch mode: one-finger drag pans; a simulated two-finger pinch (if your tooling supports multi-touch emulation) zooms in/out around the pinch midpoint.
- With browser devtools JavaScript disabled, reload `/map`: confirm the map renders at full extent exactly as before this task, no zoom/reset buttons visible, no console errors.

- [ ] **Step 5: Run the full test suite and type check**

Run: `cd mattstratton-speaking && npm test && npx astro check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd mattstratton-speaking
git add src/pages/map.astro
git commit -m "$(cat <<'EOF'
feat: interactive pan/zoom on the speaking map

Wheel-zoom (desktop), drag-to-pan and pinch-to-zoom (touch), and a
zoom in/out/reset button row — all driven by the pure viewBox math
from map-viewbox.ts. No new dependencies; touch-action is set only via
JS so no-JS mobile users keep native scroll behavior over the map.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Tap-to-preview info panel

**Files:**
- Modify: `src/pages/map.astro`

**Interfaces:** none new — extends the `<script>` block and dot markup from Task 2.

- [ ] **Step 1: Add `data-name`/`data-location`/`data-count` to each dot**

In the dot-rendering loop in `src/pages/map.astro`, change the dot `<a>` (which currently has `data-event-id`, `data-year`, `data-tags`, `data-kind`, `pointer-events="all"`) to also carry:

```astro
            data-name={p.name}
            data-location={p.location}
            data-count={p.talkCount}
```

(Add these three attributes alongside the existing ones on the same `<a>` element — order doesn't matter.)

- [ ] **Step 2: Add the info-panel markup**

Immediately before the closing `</Base>` tag (after the "Delivered virtually" section's closing `)}`), add:

```astro
  <div
    data-map-panel
    role="dialog"
    aria-labelledby="map-panel-name"
    hidden
    class="fixed inset-x-0 bottom-0 z-50 border-t-2 border-ink bg-panel p-5 shadow-xl sm:inset-x-auto sm:bottom-auto sm:w-72 sm:rounded-lg sm:border sm:border-rule"
  >
    <button
      type="button"
      data-map-panel-close
      aria-label="Close"
      class="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:text-accent"
    >
      <Icon name="lucide:x" class="h-4 w-4" aria-hidden="true" />
    </button>
    <p data-map-panel-location class="label normal-case tracking-normal text-ink-soft"></p>
    <h3 id="map-panel-name" data-map-panel-name class="mt-1 font-display text-lg font-medium"></h3>
    <p data-map-panel-count class="label mt-1 normal-case tracking-normal text-ink-soft"></p>
    <a data-map-panel-link class="mt-3 inline-block text-accent underline decoration-rule underline-offset-2 hover:decoration-accent-bright">
      View this event →
    </a>
  </div>
```

- [ ] **Step 3: Extend the `<script>` block with panel logic**

In the same `if (svg && zoomControls && zoomInBtn && zoomOutBtn && resetBtn)` guard block added in Task 2, first widen the guard to also require the panel elements, then add the panel logic. Change the guard's opening lines from:

```ts
  const svg = document.querySelector<SVGSVGElement>('[data-map-svg]');
  const zoomControls = document.querySelector<HTMLElement>('[data-map-zoom-controls]');
  const zoomInBtn = document.querySelector<HTMLButtonElement>('[data-map-zoom-in]');
  const zoomOutBtn = document.querySelector<HTMLButtonElement>('[data-map-zoom-out]');
  const resetBtn = document.querySelector<HTMLButtonElement>('[data-map-zoom-reset]');

  if (svg && zoomControls && zoomInBtn && zoomOutBtn && resetBtn) {
```

to:

```ts
  const svg = document.querySelector<SVGSVGElement>('[data-map-svg]');
  const zoomControls = document.querySelector<HTMLElement>('[data-map-zoom-controls]');
  const zoomInBtn = document.querySelector<HTMLButtonElement>('[data-map-zoom-in]');
  const zoomOutBtn = document.querySelector<HTMLButtonElement>('[data-map-zoom-out]');
  const resetBtn = document.querySelector<HTMLButtonElement>('[data-map-zoom-reset]');
  const panel = document.querySelector<HTMLElement>('[data-map-panel]');
  const panelClose = document.querySelector<HTMLButtonElement>('[data-map-panel-close]');
  const panelName = document.querySelector<HTMLElement>('[data-map-panel-name]');
  const panelLocation = document.querySelector<HTMLElement>('[data-map-panel-location]');
  const panelCount = document.querySelector<HTMLElement>('[data-map-panel-count]');
  const panelLink = document.querySelector<HTMLAnchorElement>('[data-map-panel-link]');

  if (
    svg &&
    zoomControls &&
    zoomInBtn &&
    zoomOutBtn &&
    resetBtn &&
    panel &&
    panelClose &&
    panelName &&
    panelLocation &&
    panelCount &&
    panelLink
  ) {
```

Then, still inside that same block, add the panel open/close/positioning/focus logic (place this after the `pointers`/`dragStart`/`pinchStart`/`moved` declarations added in Task 2, before the final `svg.addEventListener('click', ...)` block):

```ts
    let lastFocused: HTMLElement | null = null;

    function positionPanel(anchorRect: DOMRect) {
      const isDesktop = window.matchMedia('(min-width: 640px)').matches;
      if (!isDesktop) {
        panel!.style.removeProperty('left');
        panel!.style.removeProperty('top');
        return;
      }
      const margin = 12;
      const panelRect = panel!.getBoundingClientRect();
      let left = anchorRect.left + anchorRect.width / 2 - panelRect.width / 2;
      let top = anchorRect.bottom + margin;
      left = Math.min(Math.max(margin, left), window.innerWidth - panelRect.width - margin);
      top = Math.min(top, window.innerHeight - panelRect.height - margin);
      panel!.style.left = `${left}px`;
      panel!.style.top = `${top}px`;
    }

    function openPanel(dot: HTMLElement) {
      lastFocused = document.activeElement as HTMLElement | null;
      panelName!.textContent = dot.dataset.name ?? '';
      panelLocation!.textContent = dot.dataset.location ?? '';
      const count = Number(dot.dataset.count ?? '0');
      panelCount!.textContent = count === 1 ? '1 talk' : `${count} talks`;
      panelLink!.href = dot.getAttribute('href') ?? '#';
      panel!.hidden = false;
      positionPanel(dot.getBoundingClientRect());
      panelClose!.focus();
    }

    function closePanel() {
      panel!.hidden = true;
      lastFocused?.focus();
    }

    panelClose.addEventListener('click', closePanel);

    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePanel();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = panel!.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    document.addEventListener('click', (e) => {
      if (panel!.hidden) return;
      const target = e.target as Element;
      if (panel!.contains(target) || target.closest('a[data-event-id]')) return;
      closePanel();
    });
```

Finally, replace the Task-2 placeholder comment inside the existing `svg.addEventListener('click', ...)` handler:

```ts
    svg.addEventListener('click', (e) => {
      const dot = (e.target as Element).closest<HTMLElement>('a[data-event-id][data-kind="point"]');
      if (!dot) return;
      e.preventDefault();
      if (moved) return;
      // Task 3 replaces this comment with a call to open the preview panel.
    });
```

with:

```ts
    svg.addEventListener('click', (e) => {
      const dot = (e.target as Element).closest<HTMLElement>('a[data-event-id][data-kind="point"]');
      if (!dot) return;
      e.preventDefault();
      if (moved) return;
      openPanel(dot);
    });
```

- [ ] **Step 4: Manual verification in a browser**

Run: `cd mattstratton-speaking && npm run dev`, open `http://localhost:4321/map`.

- Click/tap a dot (without dragging): confirm the panel opens showing that event's name, location, talk count, and a working "View this event" link, and that focus lands on the panel's close button.
- Click-drag across the map (a real pan): confirm the panel does NOT open when you release the mouse over a dot mid-drag.
- With the panel open: press `Escape` — confirm it closes and focus returns to wherever it was before opening (use keyboard Tab to reach a link elsewhere on the page first, if the dot itself isn't focusable — the dot is `tabindex="-1"`, so `lastFocused` will typically be `document.body` or whatever page element had focus; confirm this doesn't error).
- With the panel open: click elsewhere on the map background (not on a dot, not on the panel) — confirm it closes.
- With the panel open: Tab through its contents — confirm focus cycles between the close button and the "View this event" link and doesn't escape the panel.
- On a narrow (375px) viewport (devtools device emulation): confirm the panel appears as a full-width bottom sheet, not floating near the dot.
- On a wide viewport: confirm the panel floats near the tapped dot and stays fully within the viewport even when tapping a dot near a screen edge.
- Filter the map to a subset (via the existing year/topic selects) and confirm tapping a filtered-out (hidden) dot does nothing (it's not clickable — `pointer-events-none` already blocks this natively, but verify).
- With browser devtools JavaScript disabled, reload `/map`: confirm the page renders and links exactly as before this task (dot links navigate normally since there's no script to intercept them), no console errors.

- [ ] **Step 5: Run the full test suite and type check**

Run: `cd mattstratton-speaking && npm test && npx astro check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd mattstratton-speaking
git add src/pages/map.astro
git commit -m "$(cat <<'EOF'
feat: tap-to-preview info panel on the speaking map

Tapping/clicking a dot (when it wasn't the tail end of a pan/pinch
drag) opens a small dialog with the event's name, location, talk
count, and a link — instead of navigating immediately. Focus-managed
and Tab-trapped like Search.astro's existing dialog; Escape and
outside-click both dismiss it. Filtered-out dots stay non-interactive
via the existing pointer-events-none toggle from PR1, no extra code
needed here.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Accessibility check, full regression pass, and PR

**Files:** none (verification-only task, unless the accessibility check surfaces something to fix in `src/pages/map.astro`).

- [ ] **Step 1: Run the accessibility-checker skill**

With `npm run dev` (or `npm run preview` after `npm run build`) running, invoke the `accessibity-checker` skill against `/map`, per `mattstratton-speaking/CLAUDE.md`'s accessibility mandate. If it flags anything newly introduced by Tasks 2–3 (the zoom/reset buttons or the info panel), fix it in `src/pages/map.astro` before proceeding. If it flags something pre-existing and unrelated to this branch, note it but don't fix it here (out of scope).

- [ ] **Step 2: Full regression pass**

Run: `cd mattstratton-speaking && npm test && npx astro check && npm run build`
Expected: all PASS.

Re-verify PR1's filtering still works after Tasks 2–3's markup/script additions: pick a year, confirm dots/lists still filter correctly and the status text updates; reset; confirm a filtered-out dot doesn't open the tap-to-preview panel and isn't draggable/zoomable any differently than a visible one (panning/zooming should work identically regardless of what's currently filtered, since pan/zoom operates on the whole SVG, not per-dot).

Re-run the full Task 2 and Task 3 manual-verification checklists once more end-to-end (wheel zoom, drag pan, pinch, buttons, tap-to-preview open/close/dismiss/focus, JS-disabled degradation) to confirm nothing regressed between tasks.

- [ ] **Step 3: Commit any accessibility fixes**

Only if Step 1 required a code change:

```bash
cd mattstratton-speaking
git add src/pages/map.astro
git commit -m "$(cat <<'EOF'
fix: address accessibility-checker findings on the interactive map

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Open the PR**

Push the branch and open a PR (use the `pr` skill or `gh pr create`), referencing GitHub issue #51 and PR1, summarizing that this is the second and final planned enhancement slice (interactive pan/zoom + tap-to-preview) on top of PR1's filtering/legend/tap-target work. Once this PR merges, close issue #51 with a comment linking both PRs — there's no further planned work on the map after this.
