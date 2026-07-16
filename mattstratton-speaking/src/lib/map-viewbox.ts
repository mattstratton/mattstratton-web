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
