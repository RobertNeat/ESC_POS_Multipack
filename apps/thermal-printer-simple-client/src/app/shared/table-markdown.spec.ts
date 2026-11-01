import { formatMarkdownTables, hasMarkdownTable } from './table-markdown';

describe('formatMarkdownTables', () => {
  it("pads the user's literal single-dash example into aligned columns", () => {
    const source = [
      '|title|description|',
      '|-|-|',
      '|element|description of element|',
      '|element|description of element|',
    ].join('\n');
    const result = formatMarkdownTables(source, 0);
    const lines = result.text.split('\n');
    // Every pipe column lines up in a monospace font: all rows share the
    // same total width, and the longest cell in each column ("element",
    // "description of element") drives that column's width with no
    // leftover padding.
    expect(lines.every((line) => line.length === lines[0].length)).toBe(true);
    expect(lines[0]).toBe('| title   | description            |');
    expect(lines[2]).toBe('| element | description of element |');
  });

  it('is idempotent: formatting an already-formatted table changes nothing', () => {
    const source = '| a | b |\n| - | - |\n| 1 | two |';
    const once = formatMarkdownTables(source, 0);
    const twice = formatMarkdownTables(once.text, 0);
    expect(twice.text).toBe(once.text);
  });

  it('does not touch a stray pipe without a delimiter row', () => {
    const source = 'a | b\nnext line';
    const result = formatMarkdownTables(source, 0);
    expect(result.text).toBe(source);
  });

  it('never scans inside a fenced code block', () => {
    const source = '```\n| a |\n| - |\n```';
    const result = formatMarkdownTables(source, 0);
    expect(result.text).toBe(source);
  });

  it('pads a short row instead of deleting the long row', () => {
    const source = '| a | b | c |\n| - | - | - |\n| 1 | 2 |';
    const result = formatMarkdownTables(source, 0);
    const lines = result.text.split('\n');
    // The missing third cell becomes an empty, padded column rather than
    // vanishing or shortening the row.
    expect(lines[2].split('|').length).toBe(lines[0].split('|').length);
  });

  it('never drops an extra cell beyond the header count', () => {
    const source = '| a | b |\n| - | - |\n| 1 | 2 | 3 |';
    const result = formatMarkdownTables(source, 0);
    const lines = result.text.split('\n');
    expect(lines[2]).toContain('3');
  });

  it('preserves leading indentation on every table line', () => {
    const source = '  | a |\n  | - |\n  | 1 |';
    const result = formatMarkdownTables(source, 0);
    for (const line of result.text.split('\n')) {
      expect(line.startsWith('  ')).toBe(true);
    }
  });

  it('keeps alignment colons and widens the delimiter to at least 3 dashes', () => {
    const source = '| a |\n| :-: |\n| x |';
    const result = formatMarkdownTables(source, 0);
    const delimiter = result.text.split('\n')[1];
    expect(delimiter).toMatch(/^\| :-+: \|$/u);
  });

  it('keeps \\| escapes literal and counts them toward column width', () => {
    const source = '| a |\n| - |\n| x \\| y |';
    const result = formatMarkdownTables(source, 0);
    expect(result.text).toContain('x \\| y');
  });

  it('never changes the number of lines', () => {
    const source = 'before\n| a | b |\n| - | - |\n| 1 | 2 |\nafter';
    const result = formatMarkdownTables(source, 0);
    expect(result.text.split('\n').length).toBe(source.split('\n').length);
  });

  it('formats every table in the document independently', () => {
    const source = '| a |\n| - |\n| 1 |\n\n| bb |\n| - |\n| 2 |';
    const result = formatMarkdownTables(source, 0);
    // The second table's wider column ("bb") must not affect the first
    // table's column width (1 char: "a"/"1").
    expect(result.text).toContain('| a |');
    expect(result.text).toContain('| bb |');
    expect(result.text).toContain('| 2  |');
  });

  it('keeps the caret in the same cell, at a clamped offset, after padding widens the row', () => {
    const source = '|a|bb|\n|-|-|\n|1|2|';
    // caret right after "1" on the body row
    const caretOffset = source.indexOf('1') + 1;
    const result = formatMarkdownTables(source, caretOffset);
    const newLine = result.text.split('\n')[2];
    const caretColumnInNewLine =
      result.caret - result.text.lastIndexOf('\n', result.caret - 1) - 1;
    const charAtCaret = newLine[caretColumnInNewLine - 1];
    expect(charAtCaret).toBe('1');
  });

  it('leaves the caret on a non-table line unaffected by table padding elsewhere', () => {
    const source = 'hello\n| a |\n| - |\n| 1 |';
    const caretOffset = 2; // inside "hello"
    const result = formatMarkdownTables(source, caretOffset);
    expect(result.caret).toBe(caretOffset);
  });
});

describe('hasMarkdownTable', () => {
  it('detects a valid table', () => {
    expect(hasMarkdownTable('| a |\n| - |\n| 1 |')).toBe(true);
  });

  it('returns false for prose containing a bare pipe', () => {
    expect(hasMarkdownTable('a | b')).toBe(false);
  });

  it('returns false when the only table-like text is inside a fenced code block', () => {
    expect(hasMarkdownTable('```\n| a |\n| - |\n```')).toBe(false);
  });

  it('returns false for empty text', () => {
    expect(hasMarkdownTable('')).toBe(false);
  });
});
