import { RasterScale } from '../../core/printer.models';
import { ColorAdjustments, DitherMethod } from './image-processor';
import { FitMode } from './image-layout';

export type AdjustmentKey = Exclude<keyof ColorAdjustments, 'invert'>;

export const ADJUSTMENT_CONTROLS: ReadonlyArray<{
  key: AdjustmentKey;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: 'brightness', label: 'Jasność', min: -100, max: 100, step: 1 },
  { key: 'contrast', label: 'Kontrast', min: -100, max: 100, step: 1 },
  { key: 'saturation', label: 'Nasycenie', min: -100, max: 100, step: 1 },
  { key: 'gamma', label: 'Gamma', min: 0.2, max: 3, step: 0.1 },
  { key: 'hue', label: 'Odcień', min: -180, max: 180, step: 1 },
  { key: 'threshold', label: 'Próg czerni', min: 0, max: 255, step: 1 },
];

export const DITHER_OPTIONS: ReadonlyArray<{
  label: string;
  value: DitherMethod;
}> = [
  { label: 'Bez ditheringu', value: 'none' },
  { label: 'Floyd–Steinberg', value: 'floydSteinberg' },
  { label: 'Atkinson', value: 'atkinson' },
  { label: 'Stucki', value: 'stucki' },
  { label: 'Burkes', value: 'burkes' },
  { label: 'Sierra Lite', value: 'sierraLite' },
];

export const FIT_OPTIONS: ReadonlyArray<{
  value: FitMode;
  label: string;
  description: string;
  icon: string;
}> = [
  { value: 'original', label: '1:1', description: 'Oryginalna liczba pikseli', icon: 'pi pi-stop' },
  {
    value: 'shrink',
    label: 'Zmniejsz',
    description: 'Tylko gdy obraz jest za szeroki',
    icon: 'pi pi-arrow-down-right',
  },
  {
    value: 'fit',
    label: 'Dopasuj',
    description: 'Pełna szerokość, zachowaj proporcje',
    icon: 'pi pi-expand',
  },
  {
    value: 'stretch',
    label: 'Rozciągnij',
    description: 'Pełna szerokość, stała wysokość',
    icon: 'pi pi-arrows-h',
  },
  {
    value: 'double',
    label: 'Powiększ 2×',
    description: 'Dwa punkty na piksel',
    icon: 'pi pi-search-plus',
  },
];

export const RASTER_SCALE_OPTIONS: ReadonlyArray<{
  label: string;
  value: RasterScale;
}> = [
  { label: 'Normalna', value: 'normal' },
  { label: '2× szerokość', value: 'doubleWidth' },
  { label: '2× wysokość', value: 'doubleHeight' },
  { label: '2× oba wymiary', value: 'quadruple' },
];
