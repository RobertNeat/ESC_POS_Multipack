import {
  parseRasterMarkdown,
  RasterLineBlock,
  RasterTableBlock,
} from './raster-markdown';

const BODY_SIZE = 18;

function lineRuns(block: ReturnType<typeof parseRasterMarkdown>[number]) {
  return (block as RasterLineBlock).runs;
}

function lineText(
  block: ReturnType<typeof parseRasterMarkdown>[number],
): string {
  return lineRuns(block)
    .map((run) => run.text)
    .join('');
}

function cellText(cell: readonly { readonly text: string }[]): string {
  return cell.map((run) => run.text).join('');
}

function tableOf(
  block: ReturnType<typeof parseRasterMarkdown>[number],
): RasterTableBlock {
  return block as RasterTableBlock;
}

describe('parseRasterMarkdown plain text', () => {
  it('keeps a blank line between two paragraphs as its own line block', () => {
    const blocks = parseRasterMarkdown('Zazolc\n\nb', BODY_SIZE);
    expect(blocks).toHaveLength(3);
    expect(lineText(blocks[0])).toBe('Zazolc');
    expect(lineText(blocks[1])).toBe('');
    expect(lineText(blocks[2])).toBe('b');
  });

  it('preserves leading spaces in a plain line', () => {
    const blocks = parseRasterMarkdown('   Total: 12', BODY_SIZE);
    expect(lineText(blocks[0])).toBe('   Total: 12');
  });

  it('preserves a double space inside a line', () => {
    const blocks = parseRasterMarkdown('a  b', BODY_SIZE);
    expect(lineText(blocks[0])).toBe('a  b');
  });

  it('does not turn a 4-space indented line into a code block', () => {
    const blocks = parseRasterMarkdown('    indented', BODY_SIZE);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe('line');
    expect(lineText(blocks[0])).toBe('    indented');
  });

  it('prints unsupported inline markers as literal raw text', () => {
    const source = '_x_ ~~y~~ `z` > q [l](https://)';
    const blocks = parseRasterMarkdown(source, BODY_SIZE);
    expect(blocks).toHaveLength(1);
    expect(lineText(blocks[0])).toBe(source);
    expect(lineRuns(blocks[0]).every((run) => !run.bold)).toBe(true);
  });
});

describe('parseRasterMarkdown headings', () => {
  it('bolds and upsizes an H1', () => {
    const [block] = parseRasterMarkdown('# T', BODY_SIZE);
    const [run] = lineRuns(block);
    expect(run.text).toBe('T');
    expect(run.bold).toBe(true);
    expect(run.sizePx).toBeGreaterThan(BODY_SIZE);
  });

  it('bolds an H2 at the body size', () => {
    const [block] = parseRasterMarkdown('## T', BODY_SIZE);
    const [run] = lineRuns(block);
    expect(run.text).toBe('T');
    expect(run.bold).toBe(true);
    expect(run.sizePx).toBe(BODY_SIZE);
  });
});

describe('parseRasterMarkdown lists', () => {
  it('renumbers ordered items sequentially', () => {
    const blocks = parseRasterMarkdown('1. a\n1. b', BODY_SIZE);
    expect(lineText(blocks[0])).toBe('1. a');
    expect(lineText(blocks[1])).toBe('2. b');
  });

  it('restarts numbering for a nested ordered item', () => {
    const blocks = parseRasterMarkdown('1. a\n   1. x\n2. b', BODY_SIZE);
    expect(lineText(blocks[0])).toBe('1. a');
    expect(lineText(blocks[1])).toBe('   1. x');
    expect(lineText(blocks[2])).toBe('2. b');
  });

  it('renders a checked bullet task', () => {
    const blocks = parseRasterMarkdown('- [x] t', BODY_SIZE);
    expect(lineText(blocks[0])).toBe('- [X] t');
  });

  it('renders an unchecked numbered task with renumbering', () => {
    const blocks = parseRasterMarkdown('2. [ ] t', BODY_SIZE);
    expect(lineText(blocks[0])).toBe('1. [ ] t');
  });
});

describe('parseRasterMarkdown fenced code', () => {
  it('wraps fenced content with rule blocks and preserves whitespace', () => {
    const blocks = parseRasterMarkdown('```\n  a   b\n```', BODY_SIZE);
    expect(blocks.map((block) => block.kind)).toEqual(['rule', 'line', 'rule']);
    expect(lineText(blocks[1])).toBe('  a   b');
  });

  it('closes an unclosed fence with a trailing rule', () => {
    const blocks = parseRasterMarkdown('```\ncode', BODY_SIZE);
    expect(blocks.map((block) => block.kind)).toEqual(['rule', 'line', 'rule']);
  });
});

describe('parseRasterMarkdown inline bold', () => {
  it('bolds only the marked run within a line', () => {
    const blocks = parseRasterMarkdown('plain **bold** plain', BODY_SIZE);
    const runs = lineRuns(blocks[0]);
    expect(runs.map((run) => [run.text, run.bold])).toEqual([
      ['plain ', false],
      ['bold', true],
      [' plain', false],
    ]);
  });
});

describe('parseRasterMarkdown tables', () => {
  it("parses the user's literal single-dash example", () => {
    const source = [
      '|title|description|',
      '|-|-|',
      '|element|description of element|',
      '|element|description of element|',
    ].join('\n');
    const blocks = parseRasterMarkdown(source, BODY_SIZE);
    expect(blocks).toHaveLength(1);
    const table = tableOf(blocks[0]);
    expect(table.kind).toBe('table');
    expect(table.header.map(cellText)).toEqual(['title', 'description']);
    expect(table.rows.map((row) => row.map(cellText))).toEqual([
      ['element', 'description of element'],
      ['element', 'description of element'],
    ]);
    expect(table.alignments).toEqual(['left', 'left']);
  });

  it('does not treat a stray pipe in prose as a table without a delimiter row', () => {
    const blocks = parseRasterMarkdown('a | b\nnext line', BODY_SIZE);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].kind).toBe('line');
    expect(lineText(blocks[0])).toBe('a | b');
  });

  it('reads column alignment from the delimiter row', () => {
    const source = '| a | b | c |\n| :-- | :-: | --: |\n| 1 | 2 | 3 |';
    const table = tableOf(parseRasterMarkdown(source, BODY_SIZE)[0]);
    expect(table.alignments).toEqual(['left', 'center', 'right']);
  });

  it('pads a ragged row to the header column count', () => {
    const source = '| a | b | c |\n| - | - | - |\n| 1 | 2 |';
    const table = tableOf(parseRasterMarkdown(source, BODY_SIZE)[0]);
    expect(table.rows[0].map(cellText)).toEqual(['1', '2', '']);
  });

  it('truncates a row with extra cells to the header column count', () => {
    const source = '| a | b |\n| - | - |\n| 1 | 2 | 3 |';
    const table = tableOf(parseRasterMarkdown(source, BODY_SIZE)[0]);
    expect(table.rows[0].map(cellText)).toEqual(['1', '2']);
  });

  it('unescapes \\| inside a cell without splitting on it', () => {
    const source = '| a |\n| - |\n| x \\| y |';
    const table = tableOf(parseRasterMarkdown(source, BODY_SIZE)[0]);
    expect(table.rows[0].map(cellText)).toEqual(['x | y']);
  });

  it('ends a table at a blank line', () => {
    const source = '| a |\n| - |\n| 1 |\n\nafter';
    const blocks = parseRasterMarkdown(source, BODY_SIZE);
    expect(blocks.map((block) => block.kind)).toEqual([
      'table',
      'line',
      'line',
    ]);
  });

  it('ends a table at a line without pipes', () => {
    const source = '| a |\n| - |\n| 1 |\nafter';
    const blocks = parseRasterMarkdown(source, BODY_SIZE);
    expect(blocks.map((block) => block.kind)).toEqual(['table', 'line']);
  });

  it('never parses a table inside a fenced code block', () => {
    const source = '```\n| a |\n| - |\n```';
    const blocks = parseRasterMarkdown(source, BODY_SIZE);
    expect(blocks.map((block) => block.kind)).toEqual([
      'rule',
      'line',
      'line',
      'rule',
    ]);
  });

  it('runs inline bold parsing on cell content', () => {
    const source = '| a |\n| - |\n| **b** |';
    const table = tableOf(parseRasterMarkdown(source, BODY_SIZE)[0]);
    expect(table.rows[0][0]).toEqual([
      { text: 'b', bold: true, sizePx: BODY_SIZE },
    ]);
  });

  it('resets ordered-list numbering state when a table follows a list', () => {
    const source = '1. a\n| x |\n| - |\n| 1 |\n1. b';
    const blocks = parseRasterMarkdown(source, BODY_SIZE);
    expect(lineText(blocks[0])).toBe('1. a');
    expect(blocks[1].kind).toBe('table');
    expect(lineText(blocks[2])).toBe('1. b');
  });
});
