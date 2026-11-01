const TABLE_ROW_LINE = /\|/u;
const TABLE_DELIMITER_LINE = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/u;
const FENCE_LINE = /^```/u;

export interface FormattedTable {
  readonly text: string;
  readonly caret: number;
}

type Alignment = 'left' | 'center' | 'right';

/**
 * Pads every Markdown table in `text` so its pipe columns line up visually
 * in a monospace font, matching the server's table detection (a header row
 * followed by a delimiter row of the same cell count; the table ends at a
 * blank line or a line without pipes; code fences are never scanned).
 * Never deletes user text — short rows are padded, long rows keep every
 * cell. Idempotent: formatting an already-formatted table is a no-op.
 */
export function formatMarkdownTables(text: string, caret: number): FormattedTable {
  const lines = text.split('\n');
  const caretLine = lineIndexAt(lines, caret);
  const caretColumn = caret - lineStartOffset(lines, caretLine);
  const caretCellLocation = cellLocationAt(lines, caretLine, caretColumn);

  const outputLines: string[] = [];
  let fenced = false;
  let index = 0;
  let newCaretOffset: number | undefined;

  while (index < lines.length) {
    const raw = lines[index];

    if (FENCE_LINE.test(raw.trim())) {
      fenced = !fenced;
      outputLines.push(raw);
      recordCaretIfOnLine(index, caretLine, outputLines, newCaretOffset, caretColumn, (value) => (newCaretOffset = value));
      index += 1;
      continue;
    }

    if (!fenced && TABLE_ROW_LINE.test(raw) && isDelimiterLine(lines[index + 1])) {
      const headerCells = splitTableRow(raw);
      const delimiterCells = splitTableRow(lines[index + 1]);
      if (delimiterCells.length === headerCells.length) {
        const bodyStart = index + 2;
        let bodyEnd = bodyStart;
        while (
          bodyEnd < lines.length &&
          lines[bodyEnd].trim() !== '' &&
          TABLE_ROW_LINE.test(lines[bodyEnd])
        ) {
          bodyEnd += 1;
        }

        const indent = leadingIndent(raw);
        const bodyRows = lines.slice(bodyStart, bodyEnd).map(splitTableRow);
        const alignments = delimiterCells.map(alignmentOf);
        const columnCount = headerCells.length;
        const widths = columnWidths(columnCount, headerCells, bodyRows);

        const formattedHeader = formatRow(headerCells, widths, alignments, columnCount, indent);
        const formattedDelimiter = formatDelimiterRow(widths, alignments, columnCount, indent);
        const formattedBody = bodyRows.map((row) =>
          formatRow(row, widths, alignments, columnCount, indent),
        );

        const tableLineNumbers = [index, index + 1, ...bodyRows.map((_, i) => bodyStart + i)];
        const formattedLines = [formattedHeader, formattedDelimiter, ...formattedBody];

        if (
          caretCellLocation &&
          tableLineNumbers.includes(caretCellLocation.lineIndex)
        ) {
          const rowPosition = tableLineNumbers.indexOf(caretCellLocation.lineIndex);
          newCaretOffset = caretOffsetInFormattedRow(
            formattedLines[rowPosition],
            widths,
            alignments,
            columnCount,
            indent,
            caretCellLocation.cellIndex,
            caretCellLocation.offsetInCell,
          );
        }

        outputLines.push(...formattedLines);
        index = bodyEnd;
        continue;
      }
    }

    outputLines.push(raw);
    recordCaretIfOnLine(index, caretLine, outputLines, newCaretOffset, caretColumn, (value) => (newCaretOffset = value));
    index += 1;
  }

  const formattedText = outputLines.join('\n');
  const caret2 = newCaretOffset ?? clamp(caret, 0, formattedText.length);
  return { text: formattedText, caret: clamp(caret2, 0, formattedText.length) };
}

function recordCaretIfOnLine(
  sourceLineIndex: number,
  caretLine: number,
  outputLines: readonly string[],
  current: number | undefined,
  caretColumn: number,
  set: (value: number) => void,
): void {
  if (current !== undefined || sourceLineIndex !== caretLine) return;
  const lineStart = outputLines.slice(0, -1).reduce((sum, line) => sum + line.length + 1, 0);
  set(lineStart + caretColumn);
}

function lineIndexAt(lines: readonly string[], offset: number): number {
  let consumed = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const lineLength = lines[index].length;
    if (offset <= consumed + lineLength) return index;
    consumed += lineLength + 1;
  }
  return Math.max(0, lines.length - 1);
}

function lineStartOffset(lines: readonly string[], lineIndex: number): number {
  let consumed = 0;
  for (let index = 0; index < lineIndex; index += 1) consumed += lines[index].length + 1;
  return consumed;
}

interface CellLocation {
  readonly lineIndex: number;
  readonly cellIndex: number;
  readonly offsetInCell: number;
}

/** Locates which raw (unformatted) table cell the caret sits in, if any, so the reformatted output can restore it there. */
function cellLocationAt(
  lines: readonly string[],
  lineIndex: number,
  column: number,
): CellLocation | undefined {
  const raw = lines[lineIndex];
  if (raw === undefined || !TABLE_ROW_LINE.test(raw)) return undefined;
  const cells = splitTableRowWithOffsets(raw);
  for (const cell of cells) {
    if (column >= cell.start && column <= cell.end) {
      return {
        lineIndex,
        cellIndex: cell.index,
        offsetInCell: clamp(column - cell.contentStart, 0, cell.trimmedLength),
      };
    }
  }
  return undefined;
}

function isDelimiterLine(line: string | undefined): boolean {
  return line !== undefined && TABLE_DELIMITER_LINE.test(line) && line.includes('-');
}

function leadingIndent(line: string): string {
  return line.match(/^\s*/u)?.[0] ?? '';
}

interface CellSplit {
  readonly index: number;
  readonly text: string;
  readonly start: number;
  readonly end: number;
  readonly contentStart: number;
  readonly trimmedLength: number;
}

function splitTableRowWithOffsets(rowLine: string): CellSplit[] {
  const indent = leadingIndent(rowLine);
  const trimmed = rowLine.slice(indent.length);
  const rawCells: { text: string; start: number }[] = [];
  let current = '';
  let currentStart = indent.length;
  for (let i = 0; i < trimmed.length; i += 1) {
    const char = trimmed[i];
    if (char === '\\' && trimmed[i + 1] === '|') {
      current += '|';
      i += 1;
      continue;
    }
    if (char === '|') {
      rawCells.push({ text: current, start: currentStart });
      current = '';
      currentStart = indent.length + i + 1;
      continue;
    }
    current += char;
  }
  rawCells.push({ text: current, start: currentStart });

  let cells = rawCells.map((cell, idx) => ({ ...cell, end: cell.start + cell.text.length, originalIndex: idx }));
  if (cells.length > 1 && cells[0].text.trim() === '') cells = cells.slice(1);
  if (cells.length > 1 && cells[cells.length - 1].text.trim() === '') cells = cells.slice(0, -1);

  return cells.map((cell, index) => {
    const leading = cell.text.match(/^\s*/u)?.[0].length ?? 0;
    return {
      index,
      text: cell.text,
      start: cell.start,
      end: cell.end,
      contentStart: cell.start + leading,
      trimmedLength: cell.text.trim().length,
    };
  });
}

function splitTableRow(rowLine: string): string[] {
  return splitTableRowWithOffsets(rowLine).map((cell) => cell.text.trim());
}

function alignmentOf(delimiterCell: string): Alignment {
  const trimmed = delimiterCell.trim();
  const left = trimmed.startsWith(':');
  const right = trimmed.endsWith(':');
  if (left && right) return 'center';
  if (right) return 'right';
  return 'left';
}

/** Cell padding width: driven purely by the widest cell content, no artificial floor (that only applies to the delimiter row's dash count, in formatDelimiterRow). */
function columnWidths(
  columnCount: number,
  header: readonly string[],
  bodyRows: readonly (readonly string[])[],
): number[] {
  const widths = new Array<number>(columnCount).fill(1);
  for (let column = 0; column < columnCount; column += 1) {
    const headerLength = [...(header[column] ?? '')].length;
    widths[column] = Math.max(widths[column], headerLength);
  }
  for (const row of bodyRows) {
    for (let column = 0; column < columnCount; column += 1) {
      const cellLength = [...(row[column] ?? '')].length;
      widths[column] = Math.max(widths[column], cellLength);
    }
  }
  return widths;
}

function pad(value: string, width: number, alignment: Alignment): string {
  const length = [...value].length;
  const deficit = Math.max(0, width - length);
  if (alignment === 'right') return `${' '.repeat(deficit)}${value}`;
  if (alignment === 'center') {
    const left = Math.floor(deficit / 2);
    const right = deficit - left;
    return `${' '.repeat(left)}${value}${' '.repeat(right)}`;
  }
  return `${value}${' '.repeat(deficit)}`;
}

function formatRow(
  cells: readonly string[],
  widths: readonly number[],
  alignments: readonly Alignment[],
  columnCount: number,
  indent: string,
): string {
  const padded = Array.from({ length: columnCount }, (_, column) =>
    pad((cells[column] ?? '').replace(/\|/gu, '\\|'), widths[column], alignments[column] ?? 'left'),
  );
  // A row with more cells than the header is never truncated: the extra
  // cells are kept verbatim (unpadded) past the aligned columns, so no
  // user text is lost on Ctrl+S even though the server also ignores them.
  const extra = cells.slice(columnCount).map((cell) => cell.replace(/\|/gu, '\\|'));
  const allCells = [...padded, ...extra];
  return `${indent}| ${allCells.join(' | ')} |`;
}

function formatDelimiterRow(
  widths: readonly number[],
  alignments: readonly Alignment[],
  columnCount: number,
  indent: string,
): string {
  const cells = Array.from({ length: columnCount }, (_, column) => {
    const width = Math.max(3, widths[column]);
    const alignment = alignments[column] ?? 'left';
    if (alignment === 'center') return `:${'-'.repeat(Math.max(1, width - 2))}:`;
    if (alignment === 'right') return `${'-'.repeat(Math.max(2, width - 1))}:`;
    return '-'.repeat(width);
  });
  return `${indent}| ${cells.join(' | ')} |`;
}

/** Finds the absolute text offset for a caret that was at `offsetInCell` within `cellIndex` of this now-reformatted row. */
function caretOffsetInFormattedRow(
  formattedLine: string,
  widths: readonly number[],
  alignments: readonly Alignment[],
  columnCount: number,
  indent: string,
  cellIndex: number,
  offsetInCell: number,
): number {
  if (cellIndex >= columnCount) return formattedLine.length;
  let offset = indent.length + 2; // "| "
  for (let column = 0; column < cellIndex; column += 1) {
    offset += widths[column] + 3; // cell + " | "
  }
  const alignment = alignments[cellIndex] ?? 'left';
  const leftPad =
    alignment === 'right'
      ? Math.max(0, widths[cellIndex] - offsetInCell)
      : alignment === 'center'
        ? Math.floor(Math.max(0, widths[cellIndex]) / 2) -
          Math.floor(Math.min(offsetInCell, widths[cellIndex]) / 2)
        : 0;
  if (alignment === 'left') return offset + offsetInCell;
  return offset + leftPad + offsetInCell <= offset + widths[cellIndex]
    ? offset + leftPad + offsetInCell
    : offset + widths[cellIndex];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** True when `text` contains at least one Markdown table the formatter would reformat (used to enable/disable the refresh action). */
export function hasMarkdownTable(text: string): boolean {
  const lines = text.split('\n');
  let fenced = false;
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    if (FENCE_LINE.test(raw.trim())) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    if (TABLE_ROW_LINE.test(raw) && isDelimiterLine(lines[index + 1])) {
      if (splitTableRow(raw).length === splitTableRow(lines[index + 1]).length) {
        return true;
      }
    }
  }
  return false;
}
