import { parseRasterMarkdown } from './raster-markdown';
import { applyBoldOverride, visibleTextOf } from './raster-text.service';

describe('applyBoldOverride', () => {
  it('leaves blocks untouched when forceBold is false', () => {
    const blocks = parseRasterMarkdown('| a |\n| - |\n| 1 |', 18);
    expect(applyBoldOverride(blocks, false)).toBe(blocks);
  });

  it('bolds every cell in a table header and rows', () => {
    const blocks = parseRasterMarkdown('| a | b |\n| - | - |\n| 1 | 2 |', 18);
    const [table] = applyBoldOverride(blocks, true) as [
      Extract<(typeof blocks)[number], { kind: 'table' }>,
    ];
    expect(table.header.every((cell) => cell.every((run) => run.bold))).toBe(
      true,
    );
    expect(
      table.rows.every((row) =>
        row.every((cell) => cell.every((run) => run.bold)),
      ),
    ).toBe(true);
  });

  it('still bolds plain line blocks alongside a table', () => {
    const blocks = parseRasterMarkdown('text\n| a |\n| - |\n| 1 |', 18);
    const bolded = applyBoldOverride(blocks, true);
    expect(bolded[0].kind).toBe('line');
    expect(
      (
        bolded[0] as Extract<(typeof bolded)[number], { kind: 'line' }>
      ).runs.every((run) => run.bold),
    ).toBe(true);
  });
});

describe('visibleTextOf', () => {
  it('includes table cell text for the glyph checker', () => {
    const blocks = parseRasterMarkdown('| café |\n| - |\n| rowé |', 18);
    const text = visibleTextOf(blocks);
    expect(text).toContain('café');
    expect(text).toContain('rowé');
  });

  it('excludes table border markup (| and -) from the delimiter row', () => {
    const blocks = parseRasterMarkdown('| a |\n| - |\n| 1 |', 18);
    const text = visibleTextOf(blocks);
    expect(text).not.toContain('-');
    expect(text).not.toContain('|');
  });

  it('still includes plain line text alongside a table', () => {
    const blocks = parseRasterMarkdown('hello\n| a |\n| - |\n| 1 |', 18);
    expect(visibleTextOf(blocks)).toContain('hello');
  });
});
