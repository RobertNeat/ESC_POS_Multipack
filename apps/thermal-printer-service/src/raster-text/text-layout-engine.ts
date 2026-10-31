import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import { Injectable } from '@nestjs/common';

export interface LayoutOptions {
  readonly widthDots: number;
  readonly fontAlias: string;
  readonly fontSizePx: number;
  readonly bold: boolean;
  readonly lineHeightPx: number;
  readonly align: 'left' | 'center' | 'right';
}

export interface LayoutLine {
  readonly text: string;
  readonly x: number;
  readonly y: number;
}

export interface TextLayout {
  readonly lines: readonly LayoutLine[];
  readonly heightDots: number;
}

/**
 * Wraps paragraphs by measured glyph width (not an assumed column count,
 * since an uploaded font may be proportional), using integer pixel
 * positions throughout so nothing gets rescaled after layout.
 */
@Injectable()
export class TextLayoutEngine {
  layout(text: string, options: LayoutOptions): TextLayout {
    const measuringContext = this.createMeasuringContext(options);
    const ascent = Math.ceil(
      measuringContext.measureText('M').fontBoundingBoxAscent,
    );
    const paragraphs = text.split('\n');
    const lines: LayoutLine[] = [];

    for (const paragraph of paragraphs) {
      const wrapped = wrapParagraph(
        paragraph,
        options.widthDots,
        measuringContext,
      );
      for (const lineText of wrapped) {
        lines.push(
          this.placeLine(
            lineText,
            lines.length,
            ascent,
            options,
            measuringContext,
          ),
        );
      }
    }

    return {
      lines,
      heightDots: Math.round(lines.length * options.lineHeightPx),
    };
  }

  private createMeasuringContext(options: LayoutOptions): SKRSContext2D {
    const canvas = createCanvas(1, 1);
    const context = canvas.getContext('2d');
    context.font = fontString(options);
    return context;
  }

  private placeLine(
    lineText: string,
    lineIndex: number,
    ascent: number,
    options: LayoutOptions,
    context: SKRSContext2D,
  ): LayoutLine {
    const width = Math.round(context.measureText(lineText).width);
    const x =
      options.align === 'center'
        ? Math.round((options.widthDots - width) / 2)
        : options.align === 'right'
          ? options.widthDots - width
          : 0;
    const y = Math.round(lineIndex * options.lineHeightPx) + ascent;
    return { text: lineText, x: Math.max(0, x), y };
  }
}

export function fontString(options: {
  readonly fontSizePx: number;
  readonly bold: boolean;
  readonly fontAlias: string;
}): string {
  const weight = options.bold ? 'bold ' : '';
  return `${weight}${options.fontSizePx}px "${options.fontAlias}"`;
}

function wrapParagraph(
  paragraph: string,
  widthDots: number,
  context: SKRSContext2D,
): readonly string[] {
  if (paragraph.length === 0) return [''];
  const words = paragraph.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (
      context.measureText(candidate).width <= widthDots ||
      current.length === 0
    ) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
  }
  if (current.length > 0 || lines.length === 0) lines.push(current);

  return lines.flatMap((line) => breakOverlongLine(line, widthDots, context));
}

/** Breaks a single "word" wider than the paper by itself, character by character. */
function breakOverlongLine(
  line: string,
  widthDots: number,
  context: SKRSContext2D,
): readonly string[] {
  if (context.measureText(line).width <= widthDots) return [line];
  const pieces: string[] = [];
  let current = '';
  for (const character of line) {
    const candidate = current + character;
    if (
      context.measureText(candidate).width <= widthDots ||
      current.length === 0
    ) {
      current = candidate;
      continue;
    }
    pieces.push(current);
    current = character;
  }
  if (current.length > 0) pieces.push(current);
  return pieces;
}
