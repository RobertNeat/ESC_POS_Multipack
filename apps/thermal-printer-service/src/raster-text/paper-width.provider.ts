import { DEFAULT_PAPER_WIDTH_DOTS } from './raster-text.constants';

/**
 * Printable width in dots is a physical property of the installed print
 * head, not something derivable from paperWidthMm * dpi (that formula
 * overshoots the real printable area by the head's margins). 576 is the
 * correct value for the currently deployed 80mm/203dpi POS-8370 head.
 */
export function paperWidthDots(): number {
  const raw = process.env.PAPER_WIDTH_DOTS?.trim();
  if (!raw) return DEFAULT_PAPER_WIDTH_DOTS;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid PAPER_WIDTH_DOTS: "${raw}". Expected a positive integer.`,
    );
  }
  return parsed;
}
