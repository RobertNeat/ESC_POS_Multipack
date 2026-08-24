export interface MarkdownPreviewFragment {
  readonly text: string;
  readonly className: string;
}

export interface MarkdownPreviewLine {
  readonly fragments: readonly MarkdownPreviewFragment[];
  readonly className: string;
  readonly indent: number;
}

export function markdownPreviewLines(markdown: string, columns = 48): MarkdownPreviewLine[] {
  const source = markdown.split('\n');
  const result: MarkdownPreviewLine[] = [];
  let inCode = false;

  for (let index = 0; index < source.length && result.length < 38; index += 1) {
    const raw = source[index] ?? '';
    const trimmed = raw.trim();
    if (/^```/u.test(trimmed)) {
      result.push(ruleLine(columns, 'code-rule'));
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      result.push(line([fragment(raw, 'code-text')], 'code-line', 0));
      continue;
    }
    if (isTableHeader(source, index)) {
      const tableLines = [raw];
      index += 2;
      while (index < source.length && isTableRow(source[index] ?? '')) {
        tableLines.push(source[index] ?? '');
        index += 1;
      }
      index -= 1;
      result.push(...renderTable(tableLines));
      continue;
    }
    result.push(renderLine(raw, columns));
  }
  if (inCode && result.length < 38) result.push(ruleLine(columns, 'code-rule'));
  return result.slice(0, 38);
}

function renderLine(raw: string, columns: number): MarkdownPreviewLine {
  const spaces = raw.match(/^\s*/u)?.[0].length ?? 0;
  let text = raw.trim();
  if (/^---$/u.test(text)) return ruleLine(columns, 'rule');
  if (/^# /u.test(text)) return line(inlineFragments(text.slice(2)), 'h1', 0);
  if (/^#{2,6} /u.test(text)) {
    return line(inlineFragments(text.replace(/^#{2,6} /u, '')), 'h2', 0);
  }
  if (/^> ?/u.test(text)) {
    return line(inlineFragments(text.replace(/^> ?/u, '')), 'quote', 0);
  }

  const list = text.match(/^([-*+] |\d+[.)] )/u);
  if (list) {
    const marker = list[1] ?? '';
    text = text.slice(marker.length);
    const task = text.match(/^\[([ xX])\] /u);
    const checkbox = task ? `[${task[1]?.toLowerCase() === 'x' ? 'x' : ' '}] ` : '';
    if (task) text = text.slice(task[0].length);
    return line(
      [fragment(`${normalizeListMarker(marker)}${checkbox}`, ''), ...inlineFragments(text)],
      'list',
      Math.min(spaces, 10),
    );
  }
  return line(inlineFragments(text), '', Math.min(spaces, 10));
}

function inlineFragments(text: string, inheritedClass = ''): MarkdownPreviewFragment[] {
  const patterns: ReadonlyArray<{
    readonly expression: RegExp;
    readonly className: string;
    readonly prefix: number;
    readonly suffix: number;
  }> = [
    { expression: /\*\*.+?\*\*/u, className: 'bold', prefix: 2, suffix: 2 },
    { expression: /~~.+?~~/u, className: 'reverse', prefix: 2, suffix: 2 },
    { expression: /_.+?_/u, className: 'underline', prefix: 1, suffix: 1 },
    { expression: /`.+?`/u, className: 'code-inline', prefix: 1, suffix: 1 },
  ];
  const fragments: MarkdownPreviewFragment[] = [];
  let rest = text;
  while (rest) {
    const matches = patterns
      .map((pattern) => ({ pattern, match: pattern.expression.exec(rest) }))
      .filter((candidate) => candidate.match)
      .sort((left, right) => (left.match?.index ?? 0) - (right.match?.index ?? 0));
    const candidate = matches[0];
    if (!candidate?.match) {
      fragments.push(fragment(rest, inheritedClass));
      break;
    }
    const index = candidate.match.index;
    if (index > 0) fragments.push(fragment(rest.slice(0, index), inheritedClass));
    const matched = candidate.match[0];
    const content = matched.slice(candidate.pattern.prefix, -candidate.pattern.suffix);
    fragments.push(
      ...inlineFragments(content, classes(inheritedClass, candidate.pattern.className)),
    );
    rest = rest.slice(index + matched.length);
  }
  return fragments;
}

function isTableHeader(lines: readonly string[], index: number): boolean {
  return (
    isTableRow(lines[index] ?? '') &&
    /^\s*\|?\s*:?-{1,}:?\s*(?:\|\s*:?-{1,}:?\s*)+\|?\s*$/u.test(lines[index + 1] ?? '')
  );
}

function isTableRow(value: string): boolean {
  return (
    value.includes('|') &&
    value
      .trim()
      .replace(/^\||\|$/gu, '')
      .split('|').length >= 2
  );
}

function renderTable(rows: readonly string[]): MarkdownPreviewLine[] {
  const cells = rows.map(parseTableRow);
  const widths =
    cells[0]?.map((_, column) =>
      Math.max(...cells.map((row) => plainInlineText(row[column] ?? '').length)),
    ) ?? [];
  const result = [tableRow(cells[0] ?? [], widths, true)];
  result.push(
    line([fragment(`| ${widths.map((width) => '-'.repeat(width)).join(' | ')} |`, '')], 'table', 0),
  );
  result.push(...cells.slice(1).map((row) => tableRow(row, widths, false)));
  return result;
}

function tableRow(
  cells: readonly string[],
  widths: readonly number[],
  heading: boolean,
): MarkdownPreviewLine {
  const fragments: MarkdownPreviewFragment[] = [fragment('| ', '')];
  cells.forEach((cell, index) => {
    fragments.push(...inlineFragments(cell, heading ? 'bold' : ''));
    fragments.push(
      fragment(' '.repeat(Math.max(0, (widths[index] ?? 0) - plainInlineText(cell).length)), ''),
    );
    fragments.push(fragment(index === cells.length - 1 ? ' |' : ' | ', ''));
  });
  return line(fragments, 'table', 0);
}

function parseTableRow(value: string): string[] {
  return value
    .trim()
    .replace(/^\||\|$/gu, '')
    .split('|')
    .map((cell) => cell.trim());
}

function plainInlineText(value: string): string {
  return value.replace(/\*\*|~~|_|`/gu, '');
}

function normalizeListMarker(marker: string): string {
  return /^\d/u.test(marker) ? marker.replace(/\) /u, '. ') : '- ';
}

function ruleLine(columns: number, className: string): MarkdownPreviewLine {
  return line([fragment('-'.repeat(columns), '')], className, 0);
}

function line(
  fragments: readonly MarkdownPreviewFragment[],
  className: string,
  indent: number,
): MarkdownPreviewLine {
  return { fragments, className, indent };
}

function fragment(text: string, className: string): MarkdownPreviewFragment {
  return { text, className };
}

function classes(...values: string[]): string {
  return values.filter(Boolean).join(' ');
}
