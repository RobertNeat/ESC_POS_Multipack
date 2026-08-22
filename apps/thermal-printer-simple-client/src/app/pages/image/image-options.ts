import { RasterScale } from '../../core/printer.models';
import { TranslationKey } from '../../core/translations';
import { ColorAdjustments, DitherMethod } from './image-processor';
import { FitMode } from './image-layout';

export type AdjustmentKey = Exclude<keyof ColorAdjustments, 'invert'>;

export const ADJUSTMENT_CONTROLS: ReadonlyArray<{
  key: AdjustmentKey;
  labelKey: TranslationKey;
  min: number;
  max: number;
  step: number;
}> = [
  { key: 'brightness', labelKey: 'image.brightness', min: -100, max: 100, step: 1 },
  { key: 'contrast', labelKey: 'image.contrast', min: -100, max: 100, step: 1 },
  { key: 'saturation', labelKey: 'image.saturation', min: -100, max: 100, step: 1 },
  { key: 'gamma', labelKey: 'image.gamma', min: 0.2, max: 3, step: 0.1 },
  { key: 'hue', labelKey: 'image.hue', min: -180, max: 180, step: 1 },
  { key: 'threshold', labelKey: 'image.threshold', min: 0, max: 255, step: 1 },
];

export const DITHER_OPTIONS: ReadonlyArray<{
  labelKey: TranslationKey;
  value: DitherMethod;
}> = [
  { labelKey: 'image.noDither', value: 'none' },
  { labelKey: 'image.floydSteinberg', value: 'floydSteinberg' },
  { labelKey: 'image.atkinson', value: 'atkinson' },
  { labelKey: 'image.stucki', value: 'stucki' },
  { labelKey: 'image.burkes', value: 'burkes' },
  { labelKey: 'image.sierraLite', value: 'sierraLite' },
];

export const FIT_OPTIONS: ReadonlyArray<{
  value: FitMode;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: string;
}> = [
  {
    value: 'original',
    labelKey: 'image.original',
    descriptionKey: 'image.originalPixels',
    icon: 'pi pi-stop',
  },
  {
    value: 'shrink',
    labelKey: 'image.shrink',
    descriptionKey: 'image.shrinkDescription',
    icon: 'pi pi-arrow-down-right',
  },
  {
    value: 'fit',
    labelKey: 'image.fit',
    descriptionKey: 'image.fitDescription',
    icon: 'pi pi-expand',
  },
  {
    value: 'stretch',
    labelKey: 'image.stretch',
    descriptionKey: 'image.stretchDescription',
    icon: 'pi pi-arrows-h',
  },
  {
    value: 'double',
    labelKey: 'image.double',
    descriptionKey: 'image.doubleDescription',
    icon: 'pi pi-search-plus',
  },
];

export const RASTER_SCALE_OPTIONS: ReadonlyArray<{
  labelKey: TranslationKey;
  value: RasterScale;
}> = [
  { labelKey: 'image.normal', value: 'normal' },
  { labelKey: 'image.doubleWidth', value: 'doubleWidth' },
  { labelKey: 'image.doubleHeight', value: 'doubleHeight' },
  { labelKey: 'image.doubleBoth', value: 'quadruple' },
];
