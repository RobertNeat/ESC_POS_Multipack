import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import { Injectable } from '@nestjs/common';
import type { RasterBlock } from './raster-markdown';
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

export interface BlockLayout {
  readonly lines: readonly PositionedLine[];
  readonly heightDots: number;
}

export interface BlockLayoutOptions {
  readonly widthDots: number;
  readonly lineSpacing: number;
  readonly align: 'left' | 'center' | 'right';
  readonly fontAlias: string;
  readonly ruleFontAlias: string;
}

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
    let y = 0;

    for (const block of blocks) {
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

    return { lines, heightDots: y };
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
