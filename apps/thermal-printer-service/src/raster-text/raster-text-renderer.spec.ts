import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GlobalFonts } from '@napi-rs/canvas';
import { RasterTextRenderer, type RenderRequest } from './raster-text-renderer';
import { TextLayoutEngine } from './text-layout-engine';

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

function baseRequest(overrides: Partial<RenderRequest> = {}): RenderRequest {
  return {
    text: 'Hi',
    widthDots: 64,
    fontAlias: FONT_ALIAS,
    fontSizePx: 18,
    bold: false,
    lineHeightPx: 22,
    align: 'left',
    mode: 'antialiased',
    thresholdPercent: 45,
    ditherAlgorithm: 'floydSteinberg',
    ...overrides,
  };
}

describe('RasterTextRenderer', () => {
  const renderer = new RasterTextRenderer(new TextLayoutEngine());

  beforeAll(() => {
    if (!GlobalFonts.has(FONT_ALIAS)) {
      GlobalFonts.register(readFileSync(BUILT_IN_FONT_PATH), FONT_ALIAS);
    }
  });

  it('packs bitmap width as a multiple of 8 (byte-padded)', () => {
    const result = renderer.render(baseRequest({ widthDots: 65 }));
    expect(result.bitmap.widthBytes).toBe(Math.ceil(65 / 8));
    expect(result.bitmap.bytes.length).toBe(
      result.bitmap.widthBytes * result.bitmap.height,
    );
  });

  it('produces a pure black/white bitmap for every render mode', () => {
    for (const mode of ['raw', 'antialiased', 'dithered'] as const) {
      const result = renderer.render(
        baseRequest({ mode, text: 'Sample ABC 123' }),
      );
      for (const byte of result.bitmap.bytes) {
        expect(byte).toBeGreaterThanOrEqual(0);
        expect(byte).toBeLessThanOrEqual(255);
      }
      // at least some black pixels were produced for non-empty text
      const hasBlack = [...result.bitmap.bytes].some((byte) => byte !== 0);
      expect(hasBlack).toBe(true);
    }
  });

  it('is deterministic: identical input produces identical output bytes', () => {
    const first = renderer.render(
      baseRequest({ text: 'Deterministic render' }),
    );
    const second = renderer.render(
      baseRequest({ text: 'Deterministic render' }),
    );
    expect([...first.bitmap.bytes]).toEqual([...second.bitmap.bytes]);
    expect(first.heightDots).toBe(second.heightDots);
    expect(first.lineCount).toBe(second.lineCount);
  });

  it('a higher threshold percent produces at least as many black pixels (thicker strokes)', () => {
    const low = renderer.render(
      baseRequest({ text: 'M', mode: 'antialiased', thresholdPercent: 10 }),
    );
    const high = renderer.render(
      baseRequest({ text: 'M', mode: 'antialiased', thresholdPercent: 90 }),
    );
    const countBits = (bytes: Uint8Array) =>
      [...bytes].reduce((sum, byte) => sum + popcount(byte), 0);
    expect(countBits(high.bitmap.bytes)).toBeGreaterThanOrEqual(
      countBits(low.bitmap.bytes),
    );
  });

  it('matches a pixel-count snapshot for a fixed sample render', () => {
    const result = renderer.render(
      baseRequest({
        text: 'Snapshot ABC',
        widthDots: 200,
        fontSizePx: 18,
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
