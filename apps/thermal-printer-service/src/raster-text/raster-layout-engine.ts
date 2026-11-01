import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import { Injectable, BadRequestException } from '@nestjs/common';
import type { RasterBlock, RasterRun, TableAlignment } from './raster-markdown';
import { fontString } from './text-layout-engine';

export interface PositionedRun {
  readonly text: string;
  readonly bold: boolean;
  readonly sizePx: number;
  readonly fontAlias: string;
  readonly x: number;
}

export interface PositionedLine {
  readonly runs: readonly PositionedRun[];
  readonly y: number;
  readonly height: number;
  readonly isRule: boolean;
  readonly ruleSizePx: number;
}

/**
 * Geometry for one table's border strokes, computed in pixels so junction
 * glyphs (┌┬┐├┼┤└┴┘) line up exactly with the vertical/horizontal rules even
 * in a proportional font. Cell text itself is emitted as ordinary
 * PositionedLines so the plain-text render path (and its byte-identical
 * snapshot) never changes.
 */
export interface PositionedTable {
  readonly columnBoundariesX: readonly number[];
  readonly borderRowsY: readonly number[];
  readonly contentRowsY: readonly {
    readonly top: number;
    readonly bottom: number;
  }[];
  readonly fontAlias: string;
  readonly sizePx: number;
}

export interface BlockLayout {
  readonly lines: readonly PositionedLine[];
  readonly tables: readonly PositionedTable[];
  readonly heightDots: number;
}

export interface BlockLayoutOptions {
  readonly widthDots: number;
  readonly lineSpacing: number;
  readonly align: 'left' | 'center' | 'right';
  readonly fontAlias: string;
  readonly ruleFontAlias: string;
}

const TABLE_BORDER_PADDING_X = 4;
const TABLE_MIN_COLUMN_WIDTH_PX = 12;

/** A character tagged with the run style it belongs to, for style-preserving wrap. */
interface Token {
  readonly char: string;
  readonly bold: boolean;
  readonly sizePx: number;
}

@Injectable()
export class RasterLayoutEngine {
  layout(
    blocks: readonly RasterBlock[],
    options: BlockLayoutOptions,
  ): BlockLayout {
    const measuring = createCanvas(1, 1).getContext('2d');
    const widthCache = new Map<string, number>();
    const ascentCache = new Map<string, number>();
    const lines: PositionedLine[] = [];
    const tables: PositionedTable[] = [];
    let y = 0;

    for (const block of blocks) {
      if (block.kind === 'table') {
        const layout = this.layoutTable(
          block.header,
          block.rows,
          block.alignments,
          block.sizePx,
          options,
          measuring,
          widthCache,
          ascentCache,
          y,
        );
        lines.push(...layout.lines);
        tables.push(layout.table);
        y = layout.nextY;
        continue;
      }

      if (block.kind === 'rule') {
        const height = Math.round(block.sizePx * options.lineSpacing);
        const ascent = this.ascent(
          measuring,
          ascentCache,
          options.ruleFontAlias,
          block.sizePx,
          false,
        );
        lines.push({
          runs: [],
          y: y + Math.ceil(ascent),
          height,
          isRule: true,
          ruleSizePx: block.sizePx,
        });
        y += height;
        continue;
      }

      const fallbackSize = block.runs[0]?.sizePx ?? 16;
      const tokens: Token[] = [];
      for (const run of block.runs) {
        for (const char of run.text)
          tokens.push({ char, bold: run.bold, sizePx: run.sizePx });
      }

      const wrapped = wrapTokens(
        tokens,
        options.widthDots,
        options.fontAlias,
        measuring,
        widthCache,
      );
      for (const tokenLine of wrapped) {
        const runs = tokensToRuns(tokenLine, options.fontAlias);
        const maxSize = runs.length
          ? Math.max(...runs.map((run) => run.sizePx))
          : fallbackSize;
        const height = Math.round(maxSize * options.lineSpacing);
        const ascent = runs.length
          ? Math.max(
              ...runs.map((run) =>
                this.ascent(
                  measuring,
                  ascentCache,
                  run.fontAlias,
                  run.sizePx,
                  run.bold,
                ),
              ),
            )
          : this.ascent(
              measuring,
              ascentCache,
              options.fontAlias,
              fallbackSize,
              false,
            );

        const totalWidth = runs.reduce(
          (sum, run) =>
            sum +
            this.width(
              measuring,
              widthCache,
              run.fontAlias,
              run.sizePx,
              run.bold,
              run.text,
            ),
          0,
        );
        let x =
          options.align === 'center'
            ? (options.widthDots - totalWidth) / 2
            : options.align === 'right'
              ? options.widthDots - totalWidth
              : 0;
        x = Math.max(0, x);

        const positioned: PositionedRun[] = [];
        for (const run of runs) {
          positioned.push({ ...run, x: Math.round(x) });
          x += this.width(
            measuring,
            widthCache,
            run.fontAlias,
            run.sizePx,
            run.bold,
            run.text,
          );
        }

        lines.push({
          runs: positioned,
          y: y + Math.ceil(ascent),
          height,
          isRule: false,
          ruleSizePx: 0,
        });
        y += height;
      }
    }

    return { lines, tables, heightDots: y };
  }

  private width(
    context: SKRSContext2D,
    cache: Map<string, number>,
    fontAlias: string,
    sizePx: number,
    bold: boolean,
    text: string,
  ): number {
    const font = fontString({ fontAlias, fontSizePx: sizePx, bold });
    const key = `${font}|${text}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    context.font = font;
    const width = context.measureText(text).width;
    cache.set(key, width);
    return width;
  }

  private ascent(
    context: SKRSContext2D,
    cache: Map<string, number>,
    fontAlias: string,
    sizePx: number,
    bold: boolean,
  ): number {
    const font = fontString({ fontAlias, fontSizePx: sizePx, bold });
    const cached = cache.get(font);
    if (cached !== undefined) return cached;
    context.font = font;
    const ascent = context.measureText('M').fontBoundingBoxAscent;
    cache.set(font, ascent);
    return ascent;
  }

  private layoutTable(
    header: readonly (readonly RasterRun[])[],
    rows: readonly (readonly (readonly RasterRun[])[])[],
    alignments: readonly TableAlignment[],
    sizePx: number,
    options: BlockLayoutOptions,
    measuring: SKRSContext2D,
    widthCache: Map<string, number>,
    ascentCache: Map<string, number>,
    startY: number,
  ): { lines: PositionedLine[]; table: PositionedTable; nextY: number } {
    const columnCount = header.length;
    const allRows = [header, ...rows];
    const cellWidth = (cell: readonly RasterRun[]): number =>
      cell.reduce(
        (sum, run) =>
          sum +
          this.width(
            measuring,
            widthCache,
            options.fontAlias,
            run.sizePx,
            run.bold,
            run.text,
          ),
        0,
      );

    const naturalWidths = Array.from({ length: columnCount }, (_, column) =>
      Math.max(
        TABLE_MIN_COLUMN_WIDTH_PX,
        ...allRows.map((row) => cellWidth(row[column] ?? [])),
      ),
    );

    const borderGlyphWidth = Math.max(
      1,
      this.width(
        measuring,
        widthCache,
        options.ruleFontAlias,
        sizePx,
        false,
        '┼',
      ),
    );
    const borderOverheadPx = borderGlyphWidth * (columnCount + 1);
    const cellPaddingPx = TABLE_BORDER_PADDING_X * 2 * columnCount;
    const availableForContent = Math.max(
      0,
      options.widthDots - borderOverheadPx - cellPaddingPx,
    );
    const minUsableColumnPx = Math.max(
      1,
      this.width(measuring, widthCache, options.fontAlias, sizePx, false, 'M'),
    );
    if (columnCount * minUsableColumnPx > availableForContent) {
      throw new BadRequestException(
        `Table has too many columns (${columnCount}) to fit within the paper width at this font size.`,
      );
    }

    const fairShare = availableForContent / columnCount;
    const columnWidths = naturalWidths.map((natural) =>
      Math.min(natural, fairShare),
    );
    const usedByFitting = columnWidths.reduce((sum, w) => sum + w, 0);
    const leftover = Math.max(0, availableForContent - usedByFitting);
    const overflowTotal = naturalWidths.reduce(
      (sum, natural, index) => sum + Math.max(0, natural - columnWidths[index]),
      0,
    );
    if (overflowTotal > 0 && leftover > 0) {
      for (let index = 0; index < columnCount; index += 1) {
        const overflow = Math.max(
          0,
          naturalWidths[index] - columnWidths[index],
        );
        columnWidths[index] += (overflow / overflowTotal) * leftover;
      }
    }

    const tableNaturalWidth =
      naturalWidths.reduce((sum, w) => sum + w, 0) +
      borderOverheadPx +
      cellPaddingPx;
    const tableWidth = Math.min(options.widthDots, tableNaturalWidth);
    const contentWidth = columnWidths.reduce((sum, w) => sum + w, 0);
    const scale =
      tableNaturalWidth <= options.widthDots
        ? 1
        : contentWidth > 0
          ? (tableWidth - borderOverheadPx - cellPaddingPx) / contentWidth
          : 1;
    const finalColumnWidths = columnWidths.map((w) => Math.max(1, w * scale));

    const tableStartX =
      options.align === 'center'
        ? Math.max(0, Math.round((options.widthDots - tableWidth) / 2))
        : options.align === 'right'
          ? Math.max(0, Math.round(options.widthDots - tableWidth))
          : 0;

    // Each boundary sits at the centre of its border-glyph slot (not the
    // slot's left edge), since the renderer centres │/┼/corner glyphs on
    // this x. Placing it at the slot's left edge would leave a full glyph
    // width of unwanted gap on the first column's left side. Rounded to a
    // whole pixel so a thin │ stroke always lands on a single pixel column
    // instead of splitting its coverage across two (which can make it
    // disappear entirely at small font sizes after thresholding).
    const columnBoundariesX: number[] = [
      Math.round(tableStartX + borderGlyphWidth / 2),
    ];
    for (const width of finalColumnWidths) {
      const next = Math.round(
        columnBoundariesX[columnBoundariesX.length - 1] +
          borderGlyphWidth +
          TABLE_BORDER_PADDING_X * 2 +
          width,
      );
      columnBoundariesX.push(next);
    }

    const lines: PositionedLine[] = [];
    const borderRowsY: number[] = [];
    const contentRowsY: { top: number; bottom: number }[] = [];
    let y = startY;

    const lineHeight = Math.round(sizePx * options.lineSpacing);
    const bodyAscent = this.ascent(
      measuring,
      ascentCache,
      options.fontAlias,
      sizePx,
      false,
    );
    const borderGlyphMetrics = measureGlyphInk(
      measuring,
      options.ruleFontAlias,
      sizePx,
    );
    const borderBaselineOffset = Math.ceil(borderGlyphMetrics.ascent);
    // The row must have room for the baseline offset itself (ink can sit
    // entirely above the baseline, i.e. descent <= 0), not just the raw
    // ascent+descent ink extent, or the next row's baseline would land
    // past the cursor this row advances to.
    const borderRowHeight = Math.max(
      1,
      borderBaselineOffset,
      Math.round(borderGlyphMetrics.height),
    );

    borderRowsY.push(y + borderBaselineOffset);
    y += borderRowHeight;

    allRows.forEach((row) => {
      const wrappedCells = row.map((cell, column) =>
        wrapRunsToWidth(
          cell,
          finalColumnWidths[column],
          options.fontAlias,
          measuring,
          widthCache,
        ),
      );
      const cellLineCount = Math.max(
        1,
        ...wrappedCells.map((wrapped) => wrapped.length),
      );
      const rowTop = y;
      for (let lineIndex = 0; lineIndex < cellLineCount; lineIndex += 1) {
        const runs: PositionedRun[] = [];
        wrappedCells.forEach((wrapped, column) => {
          const cellRuns = wrapped[lineIndex] ?? [];
          const totalWidth = cellRuns.reduce(
            (sum, run) =>
              sum +
              this.width(
                measuring,
                widthCache,
                run.fontAlias,
                run.sizePx,
                run.bold,
                run.text,
              ),
            0,
          );
          const columnLeft =
            columnBoundariesX[column] +
            borderGlyphWidth / 2 +
            TABLE_BORDER_PADDING_X;
          const columnWidth = finalColumnWidths[column];
          const alignment = alignments[column] ?? 'left';
          let x =
            alignment === 'center'
              ? columnLeft + (columnWidth - totalWidth) / 2
              : alignment === 'right'
                ? columnLeft + columnWidth - totalWidth
                : columnLeft;
          x = Math.max(columnLeft, x);
          for (const run of cellRuns) {
            runs.push({ ...run, x: Math.round(x) });
            x += this.width(
              measuring,
              widthCache,
              run.fontAlias,
              run.sizePx,
              run.bold,
              run.text,
            );
          }
        });
        lines.push({
          runs,
          y: y + Math.ceil(bodyAscent),
          height: lineHeight,
          isRule: false,
          ruleSizePx: 0,
        });
        y += lineHeight;
      }
      contentRowsY.push({ top: rowTop, bottom: y });
      borderRowsY.push(y + borderBaselineOffset);
      y += borderRowHeight;
    });

    const table: PositionedTable = {
      columnBoundariesX,
      borderRowsY,
      contentRowsY,
      fontAlias: options.ruleFontAlias,
      sizePx,
    };

    return { lines, table, nextY: y };
  }
}

/**
 * Measures the ink extent of the ─ glyph: border rows are sized to this (not
 * lineSpacing), since that's the glyph whose baseline the renderer actually
 * draws the horizontal stroke at. The ┼ glyph's bounding box includes its
 * full vertical arm (matching │'s much taller extent), so using it here
 * would place the horizontal stroke's row baseline far from where the
 * renderer paints it.
 */
function measureGlyphInk(
  context: SKRSContext2D,
  fontAlias: string,
  sizePx: number,
): { readonly height: number; readonly ascent: number } {
  context.font = fontString({ fontAlias, fontSizePx: sizePx, bold: false });
  const metrics = context.measureText('─');
  const ascent = metrics.actualBoundingBoxAscent || sizePx * 0.7;
  const descent = metrics.actualBoundingBoxDescent || sizePx * 0.3;
  return { height: ascent + descent, ascent };
}

interface WrapRun {
  readonly text: string;
  readonly bold: boolean;
  readonly sizePx: number;
}

/**
 * Wraps a style-tagged character stream across widthDots. Leading
 * whitespace on a paragraph (or inside a code line) is peeled off as an
 * unbreakable prefix before word-splitting, so it is never silently
 * dropped the way a naive split(' ') on an all-space prefix would drop it.
 * Interior runs of spaces survive because splitting and rejoining by single
 * spaces only ever removes the split delimiters, never doubles.
 */
function wrapTokens(
  tokens: readonly Token[],
  widthDots: number,
  fontAlias: string,
  context: SKRSContext2D,
  cache: Map<string, number>,
): Token[][] {
  if (tokens.length === 0) return [[]];

  let prefixEnd = 0;
  while (prefixEnd < tokens.length && tokens[prefixEnd].char === ' ')
    prefixEnd += 1;
  const prefix = tokens.slice(0, prefixEnd);
  const rest = tokens.slice(prefixEnd);

  const words: Token[][] = [];
  let wordStart = 0;
  for (let index = 0; index <= rest.length; index += 1) {
    if (index === rest.length || rest[index].char === ' ') {
      words.push(rest.slice(wordStart, index));
      wordStart = index + 1;
    }
  }

  const lines: Token[][] = [];
  let current: Token[] = prefix;
  let currentHasPrefixOnly = prefix.length > 0;
  for (const word of words) {
    const spacer: Token[] =
      current.length === 0 || currentHasPrefixOnly
        ? []
        : [
            {
              char: ' ',
              bold: word[0]?.bold ?? false,
              sizePx: word[0]?.sizePx ?? 16,
            },
          ];
    const candidate = [...current, ...spacer, ...word];
    if (
      tokenWidth(candidate, fontAlias, context, cache) <= widthDots ||
      current.length === 0 ||
      currentHasPrefixOnly
    ) {
      current = candidate;
      currentHasPrefixOnly = false;
      continue;
    }
    lines.push(current);
    current = word;
  }
  if (current.length > 0 || lines.length === 0) lines.push(current);

  return lines.flatMap((line) =>
    breakOverlongLine(line, widthDots, fontAlias, context, cache),
  );
}

function breakOverlongLine(
  line: readonly Token[],
  widthDots: number,
  fontAlias: string,
  context: SKRSContext2D,
  cache: Map<string, number>,
): Token[][] {
  if (tokenWidth(line, fontAlias, context, cache) <= widthDots)
    return [[...line]];
  const pieces: Token[][] = [];
  let current: Token[] = [];
  for (const token of line) {
    const candidate = [...current, token];
    if (
      tokenWidth(candidate, fontAlias, context, cache) <= widthDots ||
      current.length === 0
    ) {
      current = candidate;
      continue;
    }
    pieces.push(current);
    current = [token];
  }
  if (current.length > 0) pieces.push(current);
  return pieces;
}

function tokenWidth(
  tokens: readonly Token[],
  fontAlias: string,
  context: SKRSContext2D,
  cache: Map<string, number>,
): number {
  return tokensToRuns(tokens, fontAlias).reduce((sum, run) => {
    const font = fontString({
      fontAlias: run.fontAlias,
      fontSizePx: run.sizePx,
      bold: run.bold,
    });
    const key = `${font}|${run.text}`;
    const cached = cache.get(key);
    if (cached !== undefined) return sum + cached;
    context.font = font;
    const width = context.measureText(run.text).width;
    cache.set(key, width);
    return sum + width;
  }, 0);
}

function tokensToRuns(
  tokens: readonly Token[],
  fontAlias: string,
): Array<WrapRun & { readonly fontAlias: string }> {
  const runs: Array<{
    text: string;
    bold: boolean;
    sizePx: number;
    fontAlias: string;
  }> = [];
  for (const token of tokens) {
    const last = runs[runs.length - 1];
    if (last && last.bold === token.bold && last.sizePx === token.sizePx) {
      last.text += token.char;
    } else {
      runs.push({
        text: token.char,
        bold: token.bold,
        sizePx: token.sizePx,
        fontAlias,
      });
    }
  }
  return runs;
}

/** Wraps a table cell's runs to fit a fixed pixel column width, reusing the same word/char-break logic as body text wrapping. */
function wrapRunsToWidth(
  cellRuns: readonly RasterRun[],
  columnWidthPx: number,
  fontAlias: string,
  context: SKRSContext2D,
  cache: Map<string, number>,
): Array<Array<WrapRun & { readonly fontAlias: string }>> {
  const tokens: Token[] = [];
  for (const run of cellRuns) {
    for (const char of run.text)
      tokens.push({ char, bold: run.bold, sizePx: run.sizePx });
  }
  const wrapped = wrapTokens(tokens, columnWidthPx, fontAlias, context, cache);
  return wrapped.map((tokenLine) => tokensToRuns(tokenLine, fontAlias));
}
