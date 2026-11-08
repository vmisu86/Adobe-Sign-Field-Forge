/** Zoom levels offered in the toolbar, as a multiple of the PDF's natural size (1 = 100%). */
export const ZOOM_STEPS: readonly number[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

export const MIN_SCALE = ZOOM_STEPS[0];
export const MAX_SCALE = ZOOM_STEPS[ZOOM_STEPS.length - 1];

/**
 * Space the workspace keeps around the page: `--ff-space-6` on each side (see `.ff-page` in
 * components.less). The page is fitted into the width that is left.
 */
export const PAGE_GUTTER = 64;

/** `fit-width` follows the window; `manual` stays at a chosen scale. */
export type ZoomMode = 'fit-width' | 'manual';

function clamp(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/**
 * Scale at which a page `pageWidthPoints` wide exactly fills `availableWidth` pixels. Rounded to
 * three decimals so a one-pixel wobble in the window does not re-render the page.
 * Falls back to 100% until the workspace has been measured.
 */
export function fitWidthScale(availableWidth: number, pageWidthPoints: number): number {
  if (!(availableWidth > 0) || !(pageWidthPoints > 0)) return 1;
  return Math.round(clamp(availableWidth / pageWidthPoints) * 1000) / 1000;
}

/** The next zoom step above (`1`) or below (`-1`) `current`; stays at the end of the range. */
export function nextZoomStep(current: number, direction: 1 | -1): number {
  const epsilon = 0.001;
  if (direction === 1) {
    return ZOOM_STEPS.find((step) => step > current + epsilon) ?? MAX_SCALE;
  }
  return [...ZOOM_STEPS].reverse().find((step) => step < current - epsilon) ?? MIN_SCALE;
}

/** Size a canvas for `cssWidth` x `cssHeight` CSS pixels at `pixelRatio`, so it is sharp on high-DPI screens. */
export function sizeCanvas(canvas: HTMLCanvasElement, cssWidth: number, cssHeight: number, pixelRatio: number): void {
  canvas.width = Math.max(1, Math.floor(cssWidth * pixelRatio));
  canvas.height = Math.max(1, Math.floor(cssHeight * pixelRatio));
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
}
