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
 * Ladder the H1 heading cycle steps through: the next size strictly larger
 * than the current body fontSizePx, capped at the top of the ladder.
 */
export const HEADING_SIZE_LADDER_PX = [
  16, 18, 20, 24, 28, 32, 40, 48, 64,
] as const;

export function nextHeadingSizePx(currentFontSizePx: number): number {
  const next = HEADING_SIZE_LADDER_PX.find((step) => step > currentFontSizePx);
  return next ?? HEADING_SIZE_LADDER_PX[HEADING_SIZE_LADDER_PX.length - 1];
}
