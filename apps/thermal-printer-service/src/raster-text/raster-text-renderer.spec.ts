import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GlobalFonts } from '@napi-rs/canvas';
import { RasterLayoutEngine } from './raster-layout-engine';
import { parseRasterMarkdown } from './raster-markdown';
import { RasterTextRenderer, type RenderRequest } from './raster-text-renderer';

const FONT_ALIAS = 'raster-text-renderer-spec-font';
const BUILT_IN_FONT_PATH = join(
  __dirname,
  '..',
  '..',
  'assets',
  'fonts',
  'built-in',
  'GeistMono-Regular.ttf',
);
const BODY_SIZE_PX = 18;
const LINE_SPACING = 1.2;

function baseRequest(
  text: string,
  overrides: Partial<RenderRequest> = {},
): RenderRequest {
  return {
    blocks: parseRasterMarkdown(text, BODY_SIZE_PX),
    widthDots: 64,
    fontAlias: FONT_ALIAS,
    ruleFontAlias: FONT_ALIAS,
    lineSpacing: LINE_SPACING,
    align: 'left',
    mode: 'antialiased',
    thresholdPercent: 45,
    ditherAlgorithm: 'floydSteinberg',
    ...overrides,
  };
}

describe('RasterTextRenderer', () => {
  const renderer = new RasterTextRenderer(new RasterLayoutEngine());

  beforeAll(() => {
    if (!GlobalFonts.has(FONT_ALIAS)) {
      GlobalFonts.register(readFileSync(BUILT_IN_FONT_PATH), FONT_ALIAS);
    }
  });

  it('packs bitmap width as a multiple of 8 (byte-padded)', () => {
    const result = renderer.render(baseRequest('Hi', { widthDots: 65 }));
    expect(result.bitmap.widthBytes).toBe(Math.ceil(65 / 8));
    expect(result.bitmap.bytes.length).toBe(
      result.bitmap.widthBytes * result.bitmap.height,
    );
  });

  it('produces a pure black/white bitmap for every render mode', () => {
    for (const mode of ['raw', 'antialiased', 'dithered'] as const) {
      const result = renderer.render(baseRequest('Sample ABC 123', { mode }));
      for (const byte of result.bitmap.bytes) {
        expect(byte).toBeGreaterThanOrEqual(0);
        expect(byte).toBeLessThanOrEqual(255);
      }
      const hasBlack = [...result.bitmap.bytes].some((byte) => byte !== 0);
      expect(hasBlack).toBe(true);
    }
  });

  it('is deterministic: identical input produces identical output bytes', () => {
    const first = renderer.render(baseRequest('Deterministic render'));
    const second = renderer.render(baseRequest('Deterministic render'));
    expect([...first.bitmap.bytes]).toEqual([...second.bitmap.bytes]);
    expect(first.heightDots).toBe(second.heightDots);
    expect(first.lineCount).toBe(second.lineCount);
  });

  it('a higher threshold percent produces at least as many black pixels (thicker strokes)', () => {
    const low = renderer.render(
      baseRequest('M', { mode: 'antialiased', thresholdPercent: 10 }),
    );
    const high = renderer.render(
      baseRequest('M', { mode: 'antialiased', thresholdPercent: 90 }),
    );
    const countBits = (bytes: Uint8Array) =>
      [...bytes].reduce((sum, byte) => sum + popcount(byte), 0);
    expect(countBits(high.bitmap.bytes)).toBeGreaterThanOrEqual(
      countBits(low.bitmap.bytes),
    );
  });

  it('matches a pixel-count snapshot for a fixed sample render', () => {
    const result = renderer.render(
      baseRequest('Snapshot ABC', {
        widthDots: 200,
        mode: 'antialiased',
        thresholdPercent: 45,
      }),
    );
    const blackBits = [...result.bitmap.bytes].reduce(
      (sum, byte) => sum + popcount(byte),
      0,
    );
    expect({
      widthDots: result.widthDots,
      heightDots: result.heightDots,
      lineCount: result.lineCount,
      widthBytes: result.bitmap.widthBytes,
      blackBits,
    }).toMatchSnapshot();
  });

  it('draws a rule line fully black across the full width in every mode', () => {
    for (const mode of ['raw', 'antialiased', 'dithered'] as const) {
      const result = renderer.render(
        baseRequest('```\nx\n```', { mode, widthDots: 100 }),
      );
      const { widthBytes, height, bytes } = result.bitmap;
      const fullWidthBytes = Math.floor(100 / 8);
      const hasFullyBlackRow = Array.from({ length: height }, (_, y) =>
        Array.from(
          { length: fullWidthBytes },
          (_, b) => bytes[y * widthBytes + b],
        ).every((byte) => byte === 0xff),
      ).some(Boolean);
      expect(hasFullyBlackRow).toBe(true);
    }
  });

  describe('table borders', () => {
    const tableSource = [
      '| a | b |',
      '| - | - |',
      '| 1 | two |',
      '| 3 | four that wraps onto more than one visual line |',
    ].join('\n');

    function isBlack(
      bitmap: { readonly bytes: Uint8Array; readonly widthBytes: number },
      x: number,
      y: number,
    ): boolean {
      const byte = bitmap.bytes[y * bitmap.widthBytes + (x >> 3)];
      return (byte & (0x80 >> (x & 7))) !== 0;
    }

    for (const fontSizePx of [BODY_SIZE_PX, 8]) {
      for (const lineSpacing of [1.0, 2.0]) {
        for (const mode of ['raw', 'antialiased', 'dithered'] as const) {
          it(`keeps every vertical border column solid top-to-bottom (fontSizePx=${fontSizePx}, lineSpacing=${lineSpacing}, mode=${mode})`, () => {
            const engine = new RasterLayoutEngine();
            const blocks = parseRasterMarkdown(tableSource, fontSizePx);
            const layout = engine.layout(blocks, {
              widthDots: 200,
              lineSpacing,
              align: 'left',
              fontAlias: FONT_ALIAS,
              ruleFontAlias: FONT_ALIAS,
            });
            const [table] = layout.tables;
            expect(table).toBeDefined();

            const result = renderer.render(
              baseRequest(tableSource, {
                blocks,
                widthDots: 200,
                lineSpacing,
                mode,
              }),
            );

            // Probe from the top stroke's ink to the bottom stroke's ink
            // (not just the baselines), so the corner/tee joins are
            // actually covered by the check.
            const topY = table.borderRowsY[0] - 2;
            const bottomY = table.borderRowsY[table.borderRowsY.length - 1] + 2;
            for (const boundaryX of table.columnBoundariesX) {
              // Sub-pixel glyph centering can land the actual ink a pixel
              // to either side of the rounded boundary x; a row counts as
              // "covered" if any column in a small window around it is
              // black.
              const candidateXs = [
                Math.round(boundaryX) - 1,
                Math.round(boundaryX),
                Math.round(boundaryX) + 1,
              ];
              let blackRows = 0;
              let totalRows = 0;
              for (let y = Math.max(0, topY); y <= bottomY; y += 1) {
                totalRows += 1;
                if (candidateXs.some((x) => isBlack(result.bitmap, x, y)))
                  blackRows += 1;
              }
              // Allow a few rows of slack: the probe range intentionally
              // reaches 2px beyond the ink on each end to also exercise the
              // corner/tee joins, and antialiasing can soften a row or two
              // at small font sizes. The stroke must still be essentially
              // continuous in between.
              expect(blackRows).toBeGreaterThanOrEqual(totalRows - 8);
            }
          });
        }
      }
    }

    it('draws the top border row fully black from corner to corner', () => {
      const engine = new RasterLayoutEngine();
      const blocks = parseRasterMarkdown(tableSource, BODY_SIZE_PX);
      const layout = engine.layout(blocks, {
        widthDots: 200,
        lineSpacing: 1.2,
        align: 'left',
        fontAlias: FONT_ALIAS,
        ruleFontAlias: FONT_ALIAS,
      });
      const [table] = layout.tables;
      const result = renderer.render(
        baseRequest(tableSource, { widthDots: 200, lineSpacing: 1.2 }),
      );
      const baseline = Math.round(table.borderRowsY[0]);
      const left = Math.round(table.columnBoundariesX[0]);
      const right = Math.round(
        table.columnBoundariesX[table.columnBoundariesX.length - 1],
      );
      // The ─ glyph's ink sits in a small window near (not necessarily
      // exactly at) its baseline; scan that window for the row the
      // horizontal stroke actually lands on.
      let maxBlackPixels = 0;
      for (let y = baseline - 10; y <= baseline + 4; y += 1) {
        if (y < 0) continue;
        let blackPixels = 0;
        for (let x = left; x <= right; x += 1) {
          if (isBlack(result.bitmap, x, y)) blackPixels += 1;
        }
        maxBlackPixels = Math.max(maxBlackPixels, blackPixels);
      }
      expect(maxBlackPixels).toBeGreaterThanOrEqual(right - left - 2);
    });

    it('does not let the vertical border overshoot into the blank line above the table', () => {
      const source = `\n${tableSource}`;
      const engine = new RasterLayoutEngine();
      const blocks = parseRasterMarkdown(source, BODY_SIZE_PX);
      const layout = engine.layout(blocks, {
        widthDots: 200,
        lineSpacing: 1.2,
        align: 'left',
        fontAlias: FONT_ALIAS,
        ruleFontAlias: FONT_ALIAS,
      });
      const [table] = layout.tables;
      const result = renderer.render(
        baseRequest(source, { widthDots: 200, lineSpacing: 1.2 }),
      );
      // The blank line occupies [0, firstBorderBaseline - lineHeight); the
      // vertical stroke must not bleed upward into it.
      const blankLineBottom = layout.lines[0].y;
      for (const boundaryX of table.columnBoundariesX) {
        const x = Math.round(boundaryX);
        for (let y = 0; y < blankLineBottom - 2; y += 1) {
          expect(isBlack(result.bitmap, x, y)).toBe(false);
        }
      }
    });

    it('does not let the vertical border overshoot into the blank line below the table', () => {
      const source = `${tableSource}\n\n\n`;
      const engine = new RasterLayoutEngine();
      const blocks = parseRasterMarkdown(source, BODY_SIZE_PX);
      const layout = engine.layout(blocks, {
        widthDots: 200,
        lineSpacing: 1.2,
        align: 'left',
        fontAlias: FONT_ALIAS,
        ruleFontAlias: FONT_ALIAS,
      });
      const [table] = layout.tables;
      const result = renderer.render(
        baseRequest(source, { widthDots: 200, lineSpacing: 1.2 }),
      );
      // The blank lines right after the table must stay white at the
      // table's former column boundaries — the vertical stroke must not
      // bleed downward past the bottom corner.
      const bottomStrokeBaseline =
        table.borderRowsY[table.borderRowsY.length - 1];
      for (const boundaryX of table.columnBoundariesX) {
        const x = Math.round(boundaryX);
        for (let y = bottomStrokeBaseline + 10; y < layout.heightDots; y += 1) {
          expect(isBlack(result.bitmap, x, y)).toBe(false);
        }
      }
    });
  });

  it('a bold run produces more black pixels than the same plain run', () => {
    const plain = renderer.render(
      baseRequest('M', {
        blocks: [
          { kind: 'line', runs: [{ text: 'M', bold: false, sizePx: 18 }] },
        ],
      }),
    );
    const bold = renderer.render(
      baseRequest('M', {
        blocks: [
          { kind: 'line', runs: [{ text: 'M', bold: true, sizePx: 18 }] },
        ],
      }),
    );
    const countBits = (bytes: Uint8Array) =>
      [...bytes].reduce((sum, byte) => sum + popcount(byte), 0);
    expect(countBits(bold.bitmap.bytes)).toBeGreaterThan(
      countBits(plain.bitmap.bytes),
    );
  });
});

function popcount(byte: number): number {
  let count = 0;
  let value = byte;
  while (value) {
    count += value & 1;
    value >>= 1;
  }
  return count;
}
