import { DitherAlgorithm, RasterTextMode } from '../../core/raster-text.models';
import { TranslationKey } from '../../core/translations';

export const MODE_OPTIONS: ReadonlyArray<{ labelKey: TranslationKey; value: RasterTextMode }> = [
  { labelKey: 'rasterText.modeRaw', value: 'raw' },
  { labelKey: 'rasterText.modeAntialiased', value: 'antialiased' },
  { labelKey: 'rasterText.modeDithered', value: 'dithered' },
];

export const DITHER_ALGORITHM_OPTIONS: ReadonlyArray<{
  labelKey: TranslationKey;
  value: DitherAlgorithm;
}> = [
  { labelKey: 'rasterText.ditherFloydSteinberg', value: 'floydSteinberg' },
  { labelKey: 'rasterText.ditherBayer', value: 'bayer' },
];

export const FONT_SIZE_PRESETS_PX = [16, 18, 20] as const;
export const MIN_FONT_SIZE_PX = 8;
export const MAX_FONT_SIZE_PX = 64;
export const DEFAULT_FONT_SIZE_PX = 25;

export const MIN_THRESHOLD_PERCENT = 1;
export const MAX_THRESHOLD_PERCENT = 99;
export const DEFAULT_THRESHOLD_PERCENT = 45;

export const MIN_LINE_SPACING = 1;
export const MAX_LINE_SPACING = 3;
export const DEFAULT_LINE_SPACING = 1.2;
