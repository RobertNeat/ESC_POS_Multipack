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
  type PositionedTable,
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
const HORIZONTAL = '─';
const VERTICAL = '│';
const TOP_LEFT = '┌';
const TOP_RIGHT = '┐';
const BOTTOM_LEFT = '└';
const BOTTOM_RIGHT = '┘';
const TOP_TEE = '┬';
const BOTTOM_TEE = '┴';
const LEFT_TEE = '├';
const RIGHT_TEE = '┤';
const CROSS = '┼';

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

    const { text: textGray, structure: structureGray } =
      request.mode === 'raw'
        ? this.renderDirect(layout, request)
        : this.renderSupersampled(layout, request);

    const thresholded = applyMode(textGray, request);
    // Rule lines and table borders are thresholded with a fixed hard cut,
    // never dithered: dithering a solid stroke scatters white pixels through
    // it, which reads as a dashed line on paper and violates the explicit
    // "solid lines" requirement for codeblock rules and table borders.
    // A higher cut than the usual 128 midpoint: thin 1px strokes at small
    // font sizes can land half on two pixels, so each half only reaches
    // partial (lighter) coverage after antialiasing/downscaling. A line
    // this thin must never vanish just because it isn't fully opaque.
    const STRUCTURE_CUT_POINT = 200;
    const structureBits = applyThreshold(structureGray, STRUCTURE_CUT_POINT);
    const composited = orGrayscale(thresholded, structureBits);

    const bitmap = packGrayscaleToBits(
      composited,
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
  ): { text: Uint8ClampedArray; structure: Uint8ClampedArray } {
    const textContext = this.paint(request.widthDots, layout.heightDots);
    this.paintText(textContext, layout, 1);
    const structureContext = this.paint(request.widthDots, layout.heightDots);
    this.paintStructure(
      structureContext,
      layout,
      request.widthDots,
      request.ruleFontAlias,
      1,
    );
    return {
      text: toGrayscale(textContext, request.widthDots, layout.heightDots),
      structure: toGrayscale(
        structureContext,
        request.widthDots,
        layout.heightDots,
      ),
    };
  }

  /**
   * Antialiased/dithered modes: render at SUPERSAMPLE_FACTOR resolution,
   * then box-average back down by hand (never via drawImage/resize, so no
   * filter choice we don't control runs after the final pixels exist).
   */
  private renderSupersampled(
    layout: BlockLayout,
    request: RenderRequest,
  ): { text: Uint8ClampedArray; structure: Uint8ClampedArray } {
    const scale = SUPERSAMPLE_FACTOR;
    const bigWidth = request.widthDots * scale;
    const bigHeight = layout.heightDots * scale;

    const textContext = this.paint(bigWidth, bigHeight);
    this.paintText(textContext, layout, scale);
    const bigText = toGrayscale(textContext, bigWidth, bigHeight);

    const structureContext = this.paint(bigWidth, bigHeight);
    this.paintStructure(
      structureContext,
      layout,
      request.widthDots,
      request.ruleFontAlias,
      scale,
    );
    const bigStructure = toGrayscale(structureContext, bigWidth, bigHeight);

    return {
      text: boxDownscale(bigText, bigWidth, bigHeight, scale),
      structure: boxDownscale(bigStructure, bigWidth, bigHeight, scale),
    };
  }

  /** Body text only (skips rule lines, which belong to the structure mask so they're never dithered). */
  private paintText(
    context: SKRSContext2D,
    layout: BlockLayout,
    scale: number,
  ): void {
    for (const line of layout.lines) {
      if (line.isRule) continue;
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

  /**
   * Codeblock rule lines and table borders, rendered onto their own mask so
   * they can be thresholded with a fixed hard cut regardless of render
   * mode — a dithered solid stroke reads as a dashed line on paper, which
   * violates the "solid lines" requirement.
   */
  private paintStructure(
    context: SKRSContext2D,
    layout: BlockLayout,
    widthDots: number,
    ruleFontAlias: string,
    scale: number,
  ): void {
    for (const line of layout.lines) {
      if (!line.isRule) continue;
      context.font = fontString({
        fontAlias: ruleFontAlias,
        fontSizePx: line.ruleSizePx * scale,
        bold: false,
      });
      const advance = context.measureText(RULE_CHARACTER).width || 1;
      const repeats = Math.ceil((widthDots * scale) / advance) + 1;
      context.fillText(RULE_CHARACTER.repeat(repeats), 0, line.y * scale);
    }
    this.paintTables(context, layout, scale);
  }

  private paintTables(
    context: SKRSContext2D,
    layout: BlockLayout,
    scale: number,
  ): void {
    for (const table of layout.tables) {
      this.paintTable(context, table, scale);
    }
  }

  private paintTable(
    context: SKRSContext2D,
    table: PositionedTable,
    scale: number,
  ): void {
    const { columnBoundariesX, borderRowsY, fontAlias, sizePx } = table;
    context.font = fontString({
      fontAlias,
      fontSizePx: sizePx * scale,
      bold: false,
    });
    const left = columnBoundariesX[0];
    const right = columnBoundariesX[columnBoundariesX.length - 1];

    const horizontalMetrics = context.measureText(HORIZONTAL);
    const horizontalAscent =
      horizontalMetrics.actualBoundingBoxAscent || sizePx * scale * 0.7;
    // Signed on purpose: this glyph's ink can sit entirely above its
    // baseline (negative descent), and clamping to 0 here would make the
    // vertical stroke overshoot past the bottom horizontal stroke's ink.
    const horizontalDescent = horizontalMetrics.actualBoundingBoxDescent || 0;
    const tableTop = borderRowsY[0] * scale - horizontalAscent;
    const tableBottom =
      borderRowsY[borderRowsY.length - 1] * scale + horizontalDescent;
    for (const boundaryX of columnBoundariesX) {
      drawVerticalSpan(context, boundaryX * scale, tableTop, tableBottom);
    }

    borderRowsY.forEach((rowY, rowIndex) => {
      const isTop = rowIndex === 0;
      const isBottom = rowIndex === borderRowsY.length - 1;
      drawHorizontalSpan(context, left * scale, right * scale, rowY * scale);
      columnBoundariesX.forEach((boundaryX, columnIndex) => {
        const isLeftEdge = columnIndex === 0;
        const isRightEdge = columnIndex === columnBoundariesX.length - 1;
        const glyph = isTop
          ? isLeftEdge
            ? TOP_LEFT
            : isRightEdge
              ? TOP_RIGHT
              : TOP_TEE
          : isBottom
            ? isLeftEdge
              ? BOTTOM_LEFT
              : isRightEdge
                ? BOTTOM_RIGHT
                : BOTTOM_TEE
            : isLeftEdge
              ? LEFT_TEE
              : isRightEdge
                ? RIGHT_TEE
                : CROSS;
        drawCenteredGlyph(context, glyph, boundaryX * scale, rowY * scale);
      });
    });
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

/** Draws ─ repeated across [fromX, toX), clipped so no glyph overshoots the span — junction glyphs are drawn separately on top. */
function drawHorizontalSpan(
  context: SKRSContext2D,
  fromX: number,
  toX: number,
  baselineY: number,
): void {
  if (toX <= fromX) return;
  const advance = context.measureText(HORIZONTAL).width || 1;
  const repeats = Math.ceil((toX - fromX) / advance) + 1;
  context.save();
  context.beginPath();
  context.rect(fromX, baselineY - 1000, toX - fromX, 2000);
  context.clip();
  context.fillText(HORIZONTAL.repeat(repeats), fromX, baselineY);
  context.restore();
}

/** Stacks │ glyphs from topY to bottomY so the vertical border reads as one continuous line regardless of lineSpacing. */
function drawVerticalSpan(
  context: SKRSContext2D,
  x: number,
  topY: number,
  bottomY: number,
): void {
  if (bottomY <= topY) return;
  const metrics = context.measureText(VERTICAL);
  const ascent = metrics.actualBoundingBoxAscent || 1;
  const descent = metrics.actualBoundingBoxDescent || 0;
  const inkHeight = Math.max(1, ascent + descent);
  const glyphWidth = metrics.width || 1;
  context.save();
  context.beginPath();
  context.rect(x - glyphWidth, topY, glyphWidth * 2, bottomY - topY);
  context.clip();
  const stride = Math.max(1, inkHeight * 0.3);
  let baselineY = topY + ascent;
  while (baselineY - ascent < bottomY) {
    context.fillText(VERTICAL, x - glyphWidth / 2, baselineY);
    baselineY += stride;
  }
  context.restore();
}

/** Centers a junction glyph on the boundary x so it lines up with │ and ─ even in a proportional font. */
function drawCenteredGlyph(
  context: SKRSContext2D,
  glyph: string,
  centerX: number,
  baselineY: number,
): void {
  const width = context.measureText(glyph).width || 0;
  context.fillText(glyph, centerX - width / 2, baselineY);
}

/** Combines two thresholded (0/255) buffers: a pixel is black if either input is black. */
function orGrayscale(
  a: Uint8ClampedArray,
  b: Uint8ClampedArray,
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(a.length);
  for (let index = 0; index < a.length; index += 1) {
    output[index] = a[index] === 0 || b[index] === 0 ? 0 : 255;
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
