/** GS v 0 hard limits enforced by the POS-8370 command encoder and DTO. */
export const MAX_RASTER_WIDTH_BYTES = 128;
export const MAX_RASTER_HEIGHT_DOTS = 4095;

export const DEFAULT_PAPER_WIDTH_DOTS = 576;

export const FONT_SIZE_PRESETS_PX = [16, 18, 20] as const;
export const DEFAULT_FONT_SIZE_PX = 18;
export const MIN_FONT_SIZE_PX = 8;
export const MAX_FONT_SIZE_PX = 64;

export const DEFAULT_THRESHOLD_PERCENT = 45;
export const MIN_THRESHOLD_PERCENT = 1;
export const MAX_THRESHOLD_PERCENT = 99;

/** Supersampling factor used for the antialiased/dithered render modes. */
export const SUPERSAMPLE_FACTOR = 3;

/**
 * One raster-text request renders to a single GS v 0 block (v1 scope — no
 * multi-band pagination). This caps how many wrapped lines fit before the
 * UI must warn/truncate, assuming the tallest supported line height.
 */
export function maxLinesForLineHeight(lineHeightPx: number): number {
  return Math.max(1, Math.floor(MAX_RASTER_HEIGHT_DOTS / lineHeightPx));
}
