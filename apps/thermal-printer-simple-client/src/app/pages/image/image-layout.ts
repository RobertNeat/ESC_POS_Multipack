import { RasterScale } from '../../core/printer.models';
import { ColorAdjustments } from './image-processor';

export type FitMode = 'original' | 'shrink' | 'fit' | 'stretch' | 'double';

export function defaultAdjustments(): ColorAdjustments {
  return {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    gamma: 1,
    hue: 0,
    threshold: 128,
    invert: false,
  };
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Nie udało się odczytać obrazu.'));
    image.src = url;
  });
}

export function rasterWidthScale(scale: RasterScale): number {
  return scale === 'doubleWidth' || scale === 'quadruple' ? 2 : 1;
}

export function outputDimensions(
  width: number,
  height: number,
  paper: number,
  mode: FitMode,
): { width: number; height: number } {
  let outputWidth = width;
  let outputHeight = height;
  if (mode === 'fit') {
    outputWidth = paper;
    outputHeight = height * (paper / width);
  }
  if (mode === 'shrink' && width > paper) {
    outputWidth = paper;
    outputHeight = height * (paper / width);
  }
  if (mode === 'stretch') outputWidth = paper;
  if (mode === 'double') {
    outputWidth = width * 2;
    outputHeight = height * 2;
  }
  const limit = Math.min(1, 1024 / outputWidth, 4095 / outputHeight);
  return {
    width: Math.max(1, Math.round(outputWidth * limit)),
    height: Math.max(1, Math.round(outputHeight * limit)),
  };
}
