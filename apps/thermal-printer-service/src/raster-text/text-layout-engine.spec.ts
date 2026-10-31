import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GlobalFonts } from '@napi-rs/canvas';
import { TextLayoutEngine } from './text-layout-engine';

const FONT_ALIAS = 'text-layout-engine-spec-font';
const BUILT_IN_FONT_PATH = join(
  __dirname,
  '..',
  '..',
  'assets',
  'fonts',
  'built-in',
  'GeistMono-Regular.ttf',
);

describe('TextLayoutEngine', () => {
  const engine = new TextLayoutEngine();

  beforeAll(() => {
    if (!GlobalFonts.has(FONT_ALIAS)) {
      GlobalFonts.register(readFileSync(BUILT_IN_FONT_PATH), FONT_ALIAS);
    }
  });

  it('keeps a short line as a single wrapped line', () => {
    const layout = engine.layout('short line', {
      widthDots: 576,
      fontAlias: FONT_ALIAS,
      fontSizePx: 18,
      bold: false,
      lineHeightPx: 22,
      align: 'left',
    });
    expect(layout.lines).toHaveLength(1);
    expect(layout.lines[0].text).toBe('short line');
  });

  it('wraps by measured width, not an assumed column count', () => {
    const longText = Array.from({ length: 30 }, () => 'wrapword').join(' ');
    const layout = engine.layout(longText, {
      widthDots: 100,
      fontAlias: FONT_ALIAS,
      fontSizePx: 18,
      bold: false,
      lineHeightPx: 22,
      align: 'left',
    });
    expect(layout.lines.length).toBeGreaterThan(1);
    for (const line of layout.lines) {
      expect(line.text.length).toBeGreaterThan(0);
    }
  });

  it('breaks a single word wider than the paper, character by character', () => {
    const longWord = 'x'.repeat(200);
    const layout = engine.layout(longWord, {
      widthDots: 100,
      fontAlias: FONT_ALIAS,
      fontSizePx: 18,
      bold: false,
      lineHeightPx: 22,
      align: 'left',
    });
    expect(layout.lines.length).toBeGreaterThan(1);
    expect(layout.lines.map((l) => l.text).join('')).toBe(longWord);
  });

  it('respects explicit newlines as paragraph breaks', () => {
    const layout = engine.layout('first\nsecond\nthird', {
      widthDots: 576,
      fontAlias: FONT_ALIAS,
      fontSizePx: 18,
      bold: false,
      lineHeightPx: 22,
      align: 'left',
    });
    expect(layout.lines.map((l) => l.text)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  it('uses integer pixel positions for every line', () => {
    const layout = engine.layout('center me', {
      widthDots: 300,
      fontAlias: FONT_ALIAS,
      fontSizePx: 18,
      bold: false,
      lineHeightPx: 22,
      align: 'center',
    });
    for (const line of layout.lines) {
      expect(Number.isInteger(line.x)).toBe(true);
      expect(Number.isInteger(line.y)).toBe(true);
    }
  });

  it('computes heightDots as line count times line height', () => {
    const layout = engine.layout('a\nb\nc', {
      widthDots: 576,
      fontAlias: FONT_ALIAS,
      fontSizePx: 18,
      bold: false,
      lineHeightPx: 22,
      align: 'left',
    });
    expect(layout.heightDots).toBe(3 * 22);
  });
});
