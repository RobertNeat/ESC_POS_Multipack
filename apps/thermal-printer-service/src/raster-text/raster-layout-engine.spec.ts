import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GlobalFonts } from '@napi-rs/canvas';
import { parseRasterMarkdown } from './raster-markdown';
import {
  RasterLayoutEngine,
  type BlockLayoutOptions,
} from './raster-layout-engine';

const FONT_ALIAS = 'raster-layout-engine-spec-font';
const BUILT_IN_FONT_PATH = join(
  __dirname,
  '..',
  '..',
  'assets',
  'fonts',
  'built-in',
  'GeistMono-Regular.ttf',
);

function baseOptions(
  overrides: Partial<BlockLayoutOptions> = {},
): BlockLayoutOptions {
  return {
    widthDots: 576,
    lineSpacing: 1.2,
    align: 'left',
    fontAlias: FONT_ALIAS,
    ruleFontAlias: FONT_ALIAS,
    ...overrides,
  };
}

describe('RasterLayoutEngine', () => {
  const engine = new RasterLayoutEngine();

  beforeAll(() => {
    if (!GlobalFonts.has(FONT_ALIAS)) {
      GlobalFonts.register(readFileSync(BUILT_IN_FONT_PATH), FONT_ALIAS);
    }
  });

  function lineTexts(
    blocks: ReturnType<typeof parseRasterMarkdown>,
    options = baseOptions(),
  ) {
    return engine
      .layout(blocks, options)
      .lines.map((line) => line.runs.map((run) => run.text).join(''));
  }

  it('keeps a short line as a single wrapped line', () => {
    const blocks = parseRasterMarkdown('short line', 18);
    const layout = engine.layout(blocks, baseOptions());
    expect(layout.lines).toHaveLength(1);
    expect(layout.lines[0].runs.map((r) => r.text).join('')).toBe('short line');
  });

  it('wraps by measured width, not an assumed column count', () => {
    const longText = Array.from({ length: 30 }, () => 'wrapword').join(' ');
    const blocks = parseRasterMarkdown(longText, 18);
    const layout = engine.layout(blocks, baseOptions({ widthDots: 100 }));
    expect(layout.lines.length).toBeGreaterThan(1);
    for (const line of layout.lines) {
      expect(line.runs.map((r) => r.text).join('').length).toBeGreaterThan(0);
    }
  });

  it('breaks a single word wider than the paper, character by character', () => {
    const longWord = 'x'.repeat(200);
    const blocks = parseRasterMarkdown(longWord, 18);
    const layout = engine.layout(blocks, baseOptions({ widthDots: 100 }));
    expect(layout.lines.length).toBeGreaterThan(1);
    expect(
      layout.lines.map((l) => l.runs.map((r) => r.text).join('')).join(''),
    ).toBe(longWord);
  });

  it('respects explicit newlines as paragraph breaks', () => {
    const blocks = parseRasterMarkdown('first\nsecond\nthird', 18);
    expect(lineTexts(blocks)).toEqual(['first', 'second', 'third']);
  });

  it('uses integer pixel positions for every run', () => {
    const blocks = parseRasterMarkdown('center me', 18);
    const layout = engine.layout(
      blocks,
      baseOptions({ widthDots: 300, align: 'center' }),
    );
    for (const line of layout.lines) {
      expect(Number.isInteger(line.y)).toBe(true);
      for (const run of line.runs) expect(Number.isInteger(run.x)).toBe(true);
    }
  });

  it('computes heightDots as the sum of line heights', () => {
    const blocks = parseRasterMarkdown('a\nb\nc', 18);
    const layout = engine.layout(blocks, baseOptions());
    const expectedLineHeight = Math.round(18 * 1.2);
    expect(layout.heightDots).toBe(3 * expectedLineHeight);
  });

  it('preserves leading whitespace in the first wrapped line', () => {
    const blocks = parseRasterMarkdown('   Total: 12', 18);
    const layout = engine.layout(blocks, baseOptions());
    expect(layout.lines[0].runs.map((r) => r.text).join('')).toBe(
      '   Total: 12',
    );
  });

  it('preserves a nested list indent as leading whitespace on the marker run', () => {
    const blocks = parseRasterMarkdown('1. a\n   1. x', 18);
    expect(lineTexts(blocks)).toEqual(['1. a', '   1. x']);
  });

  it('gives a blank line the body line height, not a fallback size', () => {
    const blocks = parseRasterMarkdown('a\n\nb', 18);
    const layout = engine.layout(blocks, baseOptions());
    const expectedLineHeight = Math.round(18 * 1.2);
    expect(layout.lines[1].height).toBe(expectedLineHeight);
  });

  it('makes an H1 line taller than a body line', () => {
    const blocks = parseRasterMarkdown('# Heading\nbody', 18);
    const layout = engine.layout(blocks, baseOptions());
    expect(layout.lines[0].height).toBeGreaterThan(layout.lines[1].height);
  });

  it('gives a rule block a positive line height and no runs', () => {
    const blocks = parseRasterMarkdown('```\ncode\n```', 18);
    const layout = engine.layout(blocks, baseOptions());
    const rule = layout.lines[0];
    expect(rule.isRule).toBe(true);
    expect(rule.runs).toHaveLength(0);
    expect(rule.height).toBeGreaterThan(0);
  });
});

describe('RasterLayoutEngine tables', () => {
  const engine = new RasterLayoutEngine();

  beforeAll(() => {
    if (!GlobalFonts.has(FONT_ALIAS)) {
      GlobalFonts.register(readFileSync(BUILT_IN_FONT_PATH), FONT_ALIAS);
    }
  });

  function tableSource(): string {
    return ['| a | b |', '| - | - |', '| 1 | two |', '| 3 | four |'].join('\n');
  }

  it('produces one PositionedTable with a border row above and below each content row', () => {
    const blocks = parseRasterMarkdown(tableSource(), 18);
    const layout = engine.layout(blocks, baseOptions());
    expect(layout.tables).toHaveLength(1);
    const [table] = layout.tables;
    expect(table.borderRowsY).toHaveLength(4); // top, header/body separator, between the 2 body rows, bottom
    expect(table.contentRowsY).toHaveLength(3); // header + 2 body rows
    expect(table.columnBoundariesX).toHaveLength(3); // 2 columns -> 3 boundaries
  });

  it('keeps column boundaries strictly increasing and within the paper width', () => {
    const blocks = parseRasterMarkdown(tableSource(), 18);
    const layout = engine.layout(blocks, baseOptions({ widthDots: 300 }));
    const [table] = layout.tables;
    for (let index = 1; index < table.columnBoundariesX.length; index += 1) {
      expect(table.columnBoundariesX[index]).toBeGreaterThan(
        table.columnBoundariesX[index - 1],
      );
    }
    expect(table.columnBoundariesX.at(-1)).toBeLessThanOrEqual(300);
  });

  it('wraps a cell whose content cannot fit the available column width', () => {
    const source = [
      '| a |',
      '| - |',
      '| this is a long cell that must wrap onto more than one line |',
    ].join('\n');
    const blocks = parseRasterMarkdown(source, 18);
    const layout = engine.layout(blocks, baseOptions({ widthDots: 80 }));
    const [table] = layout.tables;
    expect(table.contentRowsY[1].bottom).toBeGreaterThan(
      table.contentRowsY[1].top + Math.round(18 * 1.2),
    );
  });

  it('throws when a table has too many columns to fit the paper width', () => {
    const cells = Array.from({ length: 50 }, (_, index) => `c${index}`);
    const header = `| ${cells.join(' | ')} |`;
    const delimiter = `| ${cells.map(() => '-').join(' | ')} |`;
    const blocks = parseRasterMarkdown(`${header}\n${delimiter}`, 18);
    expect(() =>
      engine.layout(blocks, baseOptions({ widthDots: 80 })),
    ).toThrow();
  });

  it('keeps the table within heightDots so the renderer never clips it', () => {
    const blocks = parseRasterMarkdown(tableSource(), 18);
    const layout = engine.layout(blocks, baseOptions());
    const [table] = layout.tables;
    expect(table.borderRowsY.at(-1)).toBeLessThanOrEqual(layout.heightDots);
  });
});
