import { nextHeadingSizePx } from './raster-text.constants';

export interface RasterRun {
  readonly text: string;
  readonly bold: boolean;
  readonly sizePx: number;
}

export interface RasterLineBlock {
  readonly kind: 'line';
  readonly runs: readonly RasterRun[];
}

export interface RasterRuleBlock {
  readonly kind: 'rule';
  readonly sizePx: number;
}

export type RasterBlock = RasterLineBlock | RasterRuleBlock;

const HEADING_LINE = /^(#{1,6}) (.*)$/u;
const BULLET_LINE = /^(\s*)[-*+] (\[([ xX])\] )?(.*)$/u;
const NUMBERED_LINE = /^(\s*)(\d+)[.)] (\[([ xX])\] )?(.*)$/u;
const FENCE_LINE = /^```/u;
const BOLD_RUN = /\*\*(.+?)\*\*/u;

/**
 * Parses the Markdown subset the raster-text toolbar produces into render
 * blocks. Line-oriented by design (not marked's block lexer): formats this
 * renderer doesn't support (_em_, ~~del~~, `code`, > quotes, --- rules as
 * typed syntax) are intentionally left as literal source text rather than
 * interpreted, and every byte of whitespace the user typed survives,
 * including inside code fences and leading paragraph indentation that
 * marked would otherwise swallow into an accidental indented-code block.
 */
interface OrderedLevel {
  readonly indent: number;
  counter: number;
}

export function parseRasterMarkdown(
  text: string,
  bodySizePx: number,
): readonly RasterBlock[] {
  const lines = text.split('\n');
  const blocks: RasterBlock[] = [];
  let fenced = false;
  const orderedStack: OrderedLevel[] = [];

  for (const raw of lines) {
    if (FENCE_LINE.test(raw.trim())) {
      blocks.push({ kind: 'rule', sizePx: bodySizePx });
      fenced = !fenced;
      continue;
    }

    if (fenced) {
      blocks.push(line([run(raw, false, bodySizePx)]));
      continue;
    }

    if (raw.trim() === '') {
      blocks.push(line([run('', false, bodySizePx)]));
      continue;
    }

    const heading = raw.match(HEADING_LINE);
    if (heading) {
      const level = heading[1].length;
      const sizePx = level === 1 ? nextHeadingSizePx(bodySizePx) : bodySizePx;
      blocks.push(line(parseInline(heading[2], true, sizePx)));
      orderedStack.length = 0;
      continue;
    }

    const bullet = raw.match(BULLET_LINE);
    if (bullet) {
      const task = taskPrefix(bullet[3]);
      const marker = `${bullet[1]}- ${task ?? ''}`;
      blocks.push(
        line([
          run(marker, false, bodySizePx),
          ...parseInline(bullet[4], false, bodySizePx),
        ]),
      );
      continue;
    }

    const numbered = raw.match(NUMBERED_LINE);
    if (numbered) {
      const indent = numbered[1].length;
      while (
        orderedStack.length &&
        orderedStack[orderedStack.length - 1].indent > indent
      ) {
        orderedStack.pop();
      }
      const topLevel = orderedStack[orderedStack.length - 1];
      if (topLevel && topLevel.indent === indent) {
        topLevel.counter += 1;
      } else {
        orderedStack.push({ indent, counter: 1 });
      }
      const number = orderedStack[orderedStack.length - 1].counter;
      const task = taskPrefix(numbered[4]);
      const marker = `${numbered[1]}${number}. ${task ?? ''}`;
      blocks.push(
        line([
          run(marker, false, bodySizePx),
          ...parseInline(numbered[5], false, bodySizePx),
        ]),
      );
      continue;
    }

    orderedStack.length = 0;
    blocks.push(line(parseInline(raw, false, bodySizePx)));
  }

  if (fenced) blocks.push({ kind: 'rule', sizePx: bodySizePx });

  return blocks;
}

function line(runs: readonly RasterRun[]): RasterLineBlock {
  return { kind: 'line', runs };
}

function run(text: string, bold: boolean, sizePx: number): RasterRun {
  return { text, bold, sizePx };
}

function taskPrefix(checked: string | undefined): string | undefined {
  return checked === undefined
    ? undefined
    : checked.toLowerCase() === 'x'
      ? '[X] '
      : '[ ] ';
}

/** Only ** bold ** is interpreted; every other marker prints as raw source. */
function parseInline(text: string, bold: boolean, sizePx: number): RasterRun[] {
  const runs: RasterRun[] = [];
  let rest = text;
  while (rest.length > 0) {
    const match = rest.match(BOLD_RUN);
    if (!match || match.index === undefined) {
      runs.push(run(rest, bold, sizePx));
      break;
    }
    if (match.index > 0)
      runs.push(run(rest.slice(0, match.index), bold, sizePx));
    runs.push(run(match[1], true, sizePx));
    rest = rest.slice(match.index + match[0].length);
  }
  return runs;
}
