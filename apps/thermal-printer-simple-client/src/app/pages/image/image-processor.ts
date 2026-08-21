import { distance, image, utils } from 'image-q';

export type DitherMethod =
  'none' | 'floydSteinberg' | 'atkinson' | 'stucki' | 'burkes' | 'sierraLite';

export interface ColorAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  gamma: number;
  hue: number;
  threshold: number;
  invert: boolean;
}

export interface MonochromeRaster {
  pixels: Uint8ClampedArray;
  bytes: Uint8Array;
  width: number;
  height: number;
  widthBytes: number;
  blackRatio: number;
}

const kernels: Exclude<DitherMethod, 'none'>[] = [
  'floydSteinberg',
  'atkinson',
  'stucki',
  'burkes',
  'sierraLite',
];

const kernelMap = {
  floydSteinberg: image.ErrorDiffusionArrayKernel.FloydSteinberg,
  atkinson: image.ErrorDiffusionArrayKernel.Atkinson,
  stucki: image.ErrorDiffusionArrayKernel.Stucki,
  burkes: image.ErrorDiffusionArrayKernel.Burkes,
  sierraLite: image.ErrorDiffusionArrayKernel.SierraLite,
} as const;

export function rasterizeMonochrome(
  source: ImageData,
  adjustments: ColorAdjustments,
  dither: DitherMethod,
): MonochromeRaster {
  const adjusted = adjustPixels(source.data, adjustments);
  const points = utils.PointContainer.fromUint8Array(adjusted, source.width, source.height);
  const palette = blackAndWhitePalette();
  const colorDistance = new distance.EuclideanBT709NoAlpha();
  const quantizer =
    dither === 'none'
      ? new image.NearestColor(colorDistance)
      : new image.ErrorDiffusionArray(colorDistance, kernelMap[dither], true, 0, true);
  const result = quantizer.quantizeSync(points, palette).toUint8Array();
  const pixels = new Uint8ClampedArray(result);
  const packed = packMonochrome(pixels, source.width, source.height);
  return { pixels, ...packed };
}

export function packMonochrome(
  rgba: ArrayLike<number>,
  width: number,
  height: number,
): Pick<MonochromeRaster, 'bytes' | 'width' | 'height' | 'widthBytes' | 'blackRatio'> {
  const widthBytes = Math.ceil(width / 8);
  const bytes = new Uint8Array(widthBytes * height);
  let blackPixels = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = (y * width + x) * 4;
      if (rgba[pixel] >= 128) continue;
      bytes[y * widthBytes + (x >> 3)] |= 0x80 >> (x & 7);
      blackPixels++;
    }
  }
  return {
    bytes,
    width,
    height,
    widthBytes,
    blackRatio: blackPixels / (width * height),
  };
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

export function isDitherMethod(value: string): value is DitherMethod {
  return value === 'none' || kernels.includes(value as Exclude<DitherMethod, 'none'>);
}

function blackAndWhitePalette(): utils.Palette {
  const palette = new utils.Palette();
  palette.add(utils.Point.createByRGBA(0, 0, 0, 255));
  palette.add(utils.Point.createByRGBA(255, 255, 255, 255));
  return palette;
}

function adjustPixels(source: Uint8ClampedArray, settings: ColorAdjustments): Uint8ClampedArray {
  const output = new Uint8ClampedArray(source.length);
  const brightness = (settings.brightness / 100) * 255;
  const contrastValue = settings.contrast * 2.55;
  const contrast = (259 * (contrastValue + 255)) / (255 * (259 - contrastValue));
  const saturation = 1 + settings.saturation / 100;
  const gamma = 1 / settings.gamma;
  const thresholdShift = 128 - settings.threshold;
  const hue = (settings.hue * Math.PI) / 180;
  const cos = Math.cos(hue);
  const sin = Math.sin(hue);

  for (let index = 0; index < source.length; index += 4) {
    const alpha = source[index + 3] / 255;
    let red = source[index] * alpha + 255 * (1 - alpha);
    let green = source[index + 1] * alpha + 255 * (1 - alpha);
    let blue = source[index + 2] * alpha + 255 * (1 - alpha);

    const hueRed =
      red * (0.213 + cos * 0.787 - sin * 0.213) +
      green * (0.715 - cos * 0.715 - sin * 0.715) +
      blue * (0.072 - cos * 0.072 + sin * 0.928);
    const hueGreen =
      red * (0.213 - cos * 0.213 + sin * 0.143) +
      green * (0.715 + cos * 0.285 + sin * 0.14) +
      blue * (0.072 - cos * 0.072 - sin * 0.283);
    const hueBlue =
      red * (0.213 - cos * 0.213 - sin * 0.787) +
      green * (0.715 - cos * 0.715 + sin * 0.715) +
      blue * (0.072 + cos * 0.928 + sin * 0.072);
    red = hueRed;
    green = hueGreen;
    blue = hueBlue;

    const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    red = luminance + (red - luminance) * saturation;
    green = luminance + (green - luminance) * saturation;
    blue = luminance + (blue - luminance) * saturation;

    red = Math.pow(clamp((contrast * (red - 128) + 128 + brightness) / 255), gamma) * 255;
    green = Math.pow(clamp((contrast * (green - 128) + 128 + brightness) / 255), gamma) * 255;
    blue = Math.pow(clamp((contrast * (blue - 128) + 128 + brightness) / 255), gamma) * 255;
    output[index] = clamp255((settings.invert ? 255 - red : red) + thresholdShift);
    output[index + 1] = clamp255((settings.invert ? 255 - green : green) + thresholdShift);
    output[index + 2] = clamp255((settings.invert ? 255 - blue : blue) + thresholdShift);
    output[index + 3] = 255;
  }
  return output;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clamp255(value: number): number {
  return Math.round(Math.max(0, Math.min(255, value)));
}
