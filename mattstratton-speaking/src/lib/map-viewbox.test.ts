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
