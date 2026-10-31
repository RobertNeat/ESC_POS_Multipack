import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import { Injectable } from '@nestjs/common';
import {
  applyThreshold,
  ditherBayer,
  ditherFloydSteinberg,
  packGrayscaleToBits,
  type PackedBitmap,
} from './monochrome-packing';
import type {
  DitherAlgorithm,
  RasterTextRenderMode,
} from './raster-text-render-mode';
import { SUPERSAMPLE_FACTOR } from './raster-text.constants';
import {
  fontString,
  TextLayoutEngine,
  type TextLayout,
} from './text-layout-engine';

export interface RenderRequest {
  readonly text: string;
  readonly widthDots: number;
  readonly fontAlias: string;
  readonly fontSizePx: number;
  readonly bold: boolean;
  readonly lineHeightPx: number;
  readonly align: 'left' | 'center' | 'right';
  readonly mode: RasterTextRenderMode;
  readonly thresholdPercent: number;
  readonly ditherAlgorithm: DitherAlgorithm;
}

export interface RenderResult {
  readonly bitmap: PackedBitmap;
  readonly widthDots: number;
  readonly heightDots: number;
  readonly lineCount: number;
}

@Injectable()
export class RasterTextRenderer {
  constructor(private readonly layoutEngine: TextLayoutEngine) {}

  render(request: RenderRequest): RenderResult {
    const layout = this.layoutEngine.layout(request.text, {
      widthDots: request.widthDots,
      fontAlias: request.fontAlias,
      fontSizePx: request.fontSizePx,
      bold: request.bold,
      lineHeightPx: request.lineHeightPx,
      align: request.align,
    });

    const grayscale =
      request.mode === 'raw'
        ? this.renderDirect(layout, request)
        : this.renderSupersampled(layout, request);

    const thresholded = applyMode(grayscale, request);
    const bitmap = packGrayscaleToBits(
      thresholded,
      request.widthDots,
      layout.heightDots,
    );

    return {
      bitmap,
      widthDots: request.widthDots,
      heightDots: layout.heightDots,
      lineCount: layout.lines.length,
    };
  }

  /**
   * Raw mode: a single 1x render. @napi-rs/canvas (Skia) has no text
   * antialiasing toggle, so this is not a truly jagged binary render — it
   * is the sharpest achievable approximation, thresholded directly against
   * the natural edge pixels without the extra AA-then-downscale softening
   * step `renderSupersampled` applies.
   */
  private renderDirect(
    layout: TextLayout,
    request: RenderRequestFontOnly,
  ): Uint8ClampedArray {
    const context = this.paint(
      request,
      request.widthDots,
      layout.heightDots,
      1,
    );
    for (const line of layout.lines)
      context.fillText(line.text, line.x, line.y);
    return toGrayscale(context, request.widthDots, layout.heightDots);
  }

  /**
   * Antialiased/dithered modes: render at SUPERSAMPLE_FACTOR resolution,
   * then box-average back down by hand (never via drawImage/resize, so no
   * filter choice we don't control runs after the final pixels exist).
   */
  private renderSupersampled(
    layout: TextLayout,
    request: RenderRequestFontOnly,
  ): Uint8ClampedArray {
    const scale = SUPERSAMPLE_FACTOR;
    const bigWidth = request.widthDots * scale;
    const bigHeight = layout.heightDots * scale;
    const context = this.paint(request, bigWidth, bigHeight, scale);
    for (const line of layout.lines) {
      context.fillText(line.text, line.x * scale, line.y * scale);
    }
    const big = toGrayscale(context, bigWidth, bigHeight);
    return boxDownscale(big, bigWidth, bigHeight, scale);
  }

  private paint(
    request: RenderRequestFontOnly,
    canvasWidth: number,
    canvasHeight: number,
    scale: number,
  ): SKRSContext2D {
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    context.fillStyle = '#000';
    context.font = fontString({
      fontAlias: request.fontAlias,
      fontSizePx: request.fontSizePx * scale,
      bold: request.bold,
    });
    context.textBaseline = 'alphabetic';
    return context;
  }
}

type RenderRequestFontOnly = Pick<
  RenderRequest,
  'widthDots' | 'fontAlias' | 'fontSizePx' | 'bold'
>;

function toGrayscale(
  context: SKRSContext2D,
  width: number,
  height: number,
): Uint8ClampedArray {
  const { data } = context.getImageData(0, 0, width, height);
  const gray = new Uint8ClampedArray(width * height);
  for (let pixel = 0; pixel < gray.length; pixel++) {
    gray[pixel] = data[pixel * 4];
  }
  return gray;
}

function boxDownscale(
  source: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  factor: number,
): Uint8ClampedArray {
  const width = Math.round(sourceWidth / factor);
  const height = Math.round(sourceHeight / factor);
  const output = new Uint8ClampedArray(width * height);
  const area = factor * factor;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let sy = 0; sy < factor; sy++) {
        const sourceY = y * factor + sy;
        for (let sx = 0; sx < factor; sx++) {
          sum += source[sourceY * sourceWidth + x * factor + sx];
        }
      }
      output[y * width + x] = Math.round(sum / area);
    }
  }
  return output;
}

function applyMode(
  grayscale: Uint8ClampedArray,
  request: Pick<
    RenderRequest,
    'mode' | 'thresholdPercent' | 'ditherAlgorithm' | 'widthDots'
  > & { readonly widthDots: number },
): Uint8ClampedArray {
  const cutPoint = Math.round((request.thresholdPercent / 100) * 255);
  if (request.mode === 'dithered') {
    const height = grayscale.length / request.widthDots;
    return request.ditherAlgorithm === 'bayer'
      ? ditherBayer(grayscale, request.widthDots, height)
      : ditherFloydSteinberg(grayscale, request.widthDots, height);
  }
  return applyThreshold(grayscale, cutPoint);
}
