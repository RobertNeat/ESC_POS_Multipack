import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import { Injectable } from '@nestjs/common';
import {
  applyThreshold,
  ditherBayer,
  ditherFloydSteinberg,
  packGrayscaleToBits,
  type PackedBitmap,
} from './monochrome-packing';
import {
  RasterLayoutEngine,
  type BlockLayout,
  type BlockLayoutOptions,
} from './raster-layout-engine';
import type { RasterBlock } from './raster-markdown';
import type {
  DitherAlgorithm,
  RasterTextRenderMode,
} from './raster-text-render-mode';
import { SUPERSAMPLE_FACTOR } from './raster-text.constants';
import { fontString } from './text-layout-engine';

export interface RenderRequest {
  readonly blocks: readonly RasterBlock[];
  readonly widthDots: number;
  readonly fontAlias: string;
  readonly ruleFontAlias: string;
  readonly lineSpacing: number;
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

const RULE_CHARACTER = '─';

@Injectable()
export class RasterTextRenderer {
  constructor(private readonly layoutEngine: RasterLayoutEngine) {}

  render(request: RenderRequest): RenderResult {
    const layoutOptions: BlockLayoutOptions = {
      widthDots: request.widthDots,
      lineSpacing: request.lineSpacing,
      align: request.align,
      fontAlias: request.fontAlias,
      ruleFontAlias: request.ruleFontAlias,
    };
    const layout = this.layoutEngine.layout(request.blocks, layoutOptions);

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
    layout: BlockLayout,
    request: RenderRequest,
  ): Uint8ClampedArray {
    const context = this.paint(request.widthDots, layout.heightDots);
    this.paintLines(
      context,
      layout,
      request.widthDots,
      request.ruleFontAlias,
      1,
    );
    return toGrayscale(context, request.widthDots, layout.heightDots);
  }

  /**
   * Antialiased/dithered modes: render at SUPERSAMPLE_FACTOR resolution,
   * then box-average back down by hand (never via drawImage/resize, so no
   * filter choice we don't control runs after the final pixels exist).
   */
  private renderSupersampled(
    layout: BlockLayout,
    request: RenderRequest,
  ): Uint8ClampedArray {
    const scale = SUPERSAMPLE_FACTOR;
    const bigWidth = request.widthDots * scale;
    const bigHeight = layout.heightDots * scale;
    const context = this.paint(bigWidth, bigHeight);
    this.paintLines(
      context,
      layout,
      request.widthDots,
      request.ruleFontAlias,
      scale,
    );
    const big = toGrayscale(context, bigWidth, bigHeight);
    return boxDownscale(big, bigWidth, bigHeight, scale);
  }

  private paintLines(
    context: SKRSContext2D,
    layout: BlockLayout,
    widthDots: number,
    ruleFontAlias: string,
    scale: number,
  ): void {
    for (const line of layout.lines) {
      if (line.isRule) {
        context.font = fontString({
          fontAlias: ruleFontAlias,
          fontSizePx: line.ruleSizePx * scale,
          bold: false,
        });
        const advance = context.measureText(RULE_CHARACTER).width || 1;
        const repeats = Math.ceil((widthDots * scale) / advance) + 1;
        context.fillText(RULE_CHARACTER.repeat(repeats), 0, line.y * scale);
        continue;
      }
      for (const run of line.runs) {
        context.font = fontString({
          fontAlias: run.fontAlias,
          fontSizePx: run.sizePx * scale,
          bold: run.bold,
        });
        context.fillText(run.text, run.x * scale, line.y * scale);
      }
    }
  }

  private paint(canvasWidth: number, canvasHeight: number): SKRSContext2D {
    const canvas = createCanvas(
      Math.max(1, canvasWidth),
      Math.max(1, canvasHeight),
    );
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    context.fillStyle = '#000';
    context.textBaseline = 'alphabetic';
    return context;
  }
}

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
  >,
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
