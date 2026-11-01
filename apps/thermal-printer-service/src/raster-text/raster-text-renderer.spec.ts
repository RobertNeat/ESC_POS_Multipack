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
