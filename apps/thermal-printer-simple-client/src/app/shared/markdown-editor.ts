export interface MarkdownEdit {
  readonly replacement: string;
  readonly replacementStart: number;
  readonly replacementEnd: number;
  readonly selectionStart: number;
  readonly selectionEnd: number;
}

export function toggleMarkdownLinePrefix(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
): MarkdownEdit {
  const range = selectedLineRange(text, selectionStart, selectionEnd);
  const lines = text.slice(range.start, range.end).split('\n');
  const target = targetPrefixPattern(prefix);
  const remove = lines.every((line) => target.test(line));
  const replacement = lines
    .map((line) => {
      if (remove) return line.replace(target, '');
      return `${prefix}${line.replace(competingPrefixPattern(prefix), '')}`;
    })
    .join('\n');

  return {
    replacement,
    replacementStart: range.start,
    replacementEnd: range.end,
    selectionStart: range.start + (remove ? 0 : prefix.length),
    selectionEnd: range.start + replacement.length,
  };
}

export function toggleMarkdownCodeBlock(
  text: string,
  selectionStart: number,
  selectionEnd: number,
): MarkdownEdit {
  const range = selectedLineRange(text, selectionStart, selectionEnd);
  const selectedLines = text.slice(range.start, range.end);
  const included = selectedLines.match(/^```[^\r\n]*\r?\n([\s\S]*?)\r?\n```$/u);
  if (included) {
    const replacement = included[1] ?? '';
    return replacementEdit(replacement, range.start, range.end);
  }

  const opening = text.slice(0, range.start).match(/(^|\n)```[^\r\n]*\r?\n$/u);
  const closing = text.slice(range.end).match(/^\r?\n```[ \t]*(?=\r?\n|$)/u);
  if (opening && closing) {
    const replacementStart = range.start - opening[0].length + (opening[1]?.length ?? 0);
    return replacementEdit(selectedLines, replacementStart, range.end + closing[0].length);
  }

  const replacement = `\`\`\`\n${selectedLines}\n\`\`\``;
  return {
    replacement,
    replacementStart: range.start,
    replacementEnd: range.end,
    selectionStart: range.start + 4,
    selectionEnd: range.start + 4 + selectedLines.length,
  };
}

export function toggleMarkdownLink(
  text: string,
  selectionStart: number,
  selectionEnd: number,
): MarkdownEdit {
  const range = trimSelection(text, selectionStart, selectionEnd);
  const selected = text.slice(range.start, range.end);
  const prefix = '[';
  const complete = selected.match(/^\[([^\]]*)\]\([^\n)]*\)$/u);
  if (complete) {
    return replacementEdit(complete[1] ?? '', range.start, range.end);
  }

  const suffix = text.slice(range.end).match(/^\]\([^\n)]*\)/u)?.[0];
  if (text.slice(range.start - prefix.length, range.start) === prefix && suffix) {
    return replacementEdit(selected, range.start - prefix.length, range.end + suffix.length);
  }

  const label = selected || 'tekst';
  const replacement = `${prefix}${label}](https://)`;
  return {
    replacement,
    replacementStart: range.start,
    replacementEnd: range.end,
    selectionStart: range.start + prefix.length,
    selectionEnd: range.start + prefix.length + label.length,
  };
}

const HEADING_PATTERN = /^(#{1,6}) /u;

/**
 * Reads the heading level (0-6, 0 = not a heading) of the line the
 * selection/caret is on, so the toolbar button can display the level that
 * pressing it will produce next.
 */
export function currentMarkdownHeadingLevel(
  text: string,
  selectionStart: number,
  selectionEnd: number,
): number {
  const range = selectedLineRange(text, selectionStart, selectionEnd);
  const firstLine = text.slice(range.start, range.end).split('\n')[0] ?? '';
  return firstLine.match(HEADING_PATTERN)?.[1].length ?? 0;
}

/**
 * Cycles the first selected line's heading level: plain text -> H1 -> H2 ->
 * ... -> H6 -> H1. Only the first line of a multi-line selection is
 * affected, since headings are block-level.
 */
export function cycleMarkdownHeading(
  text: string,
  selectionStart: number,
  selectionEnd: number,
): MarkdownEdit {
  const range = selectedLineRange(text, selectionStart, selectionEnd);
  const lines = text.slice(range.start, range.end).split('\n');
  const firstLine = lines[0] ?? '';
  const match = firstLine.match(HEADING_PATTERN);
  const currentLevel = match ? match[1].length : 0;
  const nextLevel = currentLevel >= 6 ? 1 : currentLevel + 1;
  const content = match ? firstLine.slice(match[0].length) : firstLine;
  const replacedFirstLine = `${'#'.repeat(nextLevel)} ${content}`;
  const replacement = [replacedFirstLine, ...lines.slice(1)].join('\n');

  return {
    replacement,
    replacementStart: range.start,
    replacementEnd: range.end,
    selectionStart: range.start + nextLevel + 1,
    selectionEnd: range.start + replacedFirstLine.length,
  };
}

const TASK_MARKER_PATTERN = /^(\s*)(?:[-*+] )?\[([ xX])\] /u;
const LIST_MARKER_PATTERN = /^(\s*)([-*+] |\d+[.)] )/u;

/**
 * Task toggling behaves per the first selected line: no task anywhere -> add
 * unchecked markers to every selected line; selection starts before the
 * first line's content column, i.e. it includes part of the marker -> strip
 * markers from every selected line; otherwise flip check state (checked if
 * any selected line is unchecked, else unchecked). The returned selection
 * always starts at the content column, so a second press with the same
 * (reselected) range toggles rather than removing.
 */
export function toggleMarkdownTask(
  text: string,
  selectionStart: number,
  selectionEnd: number,
): MarkdownEdit {
  const range = selectedLineRange(text, selectionStart, selectionEnd);
  const lines = text.slice(range.start, range.end).split('\n');
  const firstLine = lines[0] ?? '';
  const firstLineTaskMatch = firstLine.match(TASK_MARKER_PATTERN);
  const selectionOffsetInFirstLine = selectionStart - range.start;
  const removeAll =
    firstLineTaskMatch !== null && selectionOffsetInFirstLine < firstLineTaskMatch[0].length;

  let replacement: string;
  let firstLineMarkerLength: number;
  if (removeAll) {
    replacement = lines.map((line) => line.replace(TASK_MARKER_PATTERN, '$1')).join('\n');
    firstLineMarkerLength = 0;
  } else {
    const anyTask = lines.some((line) => TASK_MARKER_PATTERN.test(line));
    const anyUnchecked = lines.some((line) => {
      const match = line.match(TASK_MARKER_PATTERN);
      return match !== null && match[2] === ' ';
    });
    const nextState = !anyTask ? ' ' : anyUnchecked ? 'X' : ' ';
    const replacedLines = lines.map((line) => {
      const match = line.match(TASK_MARKER_PATTERN);
      if (match) return line.replace(TASK_MARKER_PATTERN, `$1- [${nextState}] `);
      const listMarker = line.match(LIST_MARKER_PATTERN);
      const content = listMarker ? line.slice(listMarker[0].length) : line;
      const indent = listMarker?.[1] ?? '';
      return `${indent}- [${nextState}] ${content}`;
    });
    replacement = replacedLines.join('\n');
    firstLineMarkerLength = (replacedLines[0] ?? '').match(TASK_MARKER_PATTERN)?.[0].length ?? 0;
  }

  return {
    replacement,
    replacementStart: range.start,
    replacementEnd: range.end,
    selectionStart: range.start + firstLineMarkerLength,
    selectionEnd: range.start + replacement.length,
  };
}

/**
 * Indents the selected line(s) under the nearest preceding list item at the
 * same indentation, aligning to that sibling's content column (its marker
 * width, e.g. "- " = 2, "10. " = 4) rather than a fixed step. Returns
 * undefined when there is no such sibling to nest under (e.g. the first
 * item in a list), so the caller can grey the tool out.
 */
export function toggleMarkdownSubitem(
  text: string,
  selectionStart: number,
  selectionEnd: number,
): MarkdownEdit | undefined {
  const range = selectedLineRange(text, selectionStart, selectionEnd);
  const currentIndent = text.slice(range.start).match(/^\s*/u)?.[0].length ?? 0;
  const sibling = findPrecedingSibling(text, range.start, currentIndent);
  if (!sibling) return undefined;

  const lines = text.slice(range.start, range.end).split('\n');
  const replacement = lines.map((line) => `${sibling.contentColumn}${line}`).join('\n');

  return {
    replacement,
    replacementStart: range.start,
    replacementEnd: range.end,
    selectionStart: range.start,
    selectionEnd: range.start + replacement.length,
  };
}

function findPrecedingSibling(
  text: string,
  lineStart: number,
  indent: number,
): { readonly contentColumn: string } | undefined {
  let searchEnd = lineStart - 1;
  while (searchEnd >= 0) {
    const previousLineStart = text.lastIndexOf('\n', searchEnd - 1) + 1;
    const previousLine = text.slice(previousLineStart, searchEnd + 1);
    if (previousLine.trim() === '') {
      searchEnd = previousLineStart - 1;
      continue;
    }
    const previousIndent = previousLine.match(/^\s*/u)?.[0].length ?? 0;
    if (previousIndent > indent) {
      searchEnd = previousLineStart - 1;
      continue;
    }
    if (previousIndent < indent) return undefined;
    const marker = previousLine.match(LIST_MARKER_PATTERN);
    if (!marker) return undefined;
    return { contentColumn: ' '.repeat(marker[1].length + marker[2].length) };
  }
  return undefined;
}

function replacementEdit(
  replacement: string,
  replacementStart: number,
  replacementEnd: number,
): MarkdownEdit {
  return {
    replacement,
    replacementStart,
    replacementEnd,
    selectionStart: replacementStart,
    selectionEnd: replacementStart + replacement.length,
  };
}

function selectedLineRange(
  text: string,
  selectionStart: number,
  selectionEnd: number,
): { readonly start: number; readonly end: number } {
  const start = text.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
  const lastSelected =
    selectionEnd > selectionStart && text[selectionEnd - 1] === '\n'
      ? selectionEnd - 1
      : selectionEnd;
  const nextLineBreak = text.indexOf('\n', lastSelected);
  return { start, end: nextLineBreak < 0 ? text.length : nextLineBreak };
}

function trimSelection(
  text: string,
  selectionStart: number,
  selectionEnd: number,
): { readonly start: number; readonly end: number } {
  while (selectionStart < selectionEnd && /\s/u.test(text[selectionStart] ?? '')) {
    selectionStart += 1;
  }
  while (selectionEnd > selectionStart && /\s/u.test(text[selectionEnd - 1] ?? '')) {
    selectionEnd -= 1;
  }
  return { start: selectionStart, end: selectionEnd };
}

function targetPrefixPattern(prefix: string): RegExp {
  const patterns: Readonly<Record<string, RegExp>> = {
    '# ': /^# /u,
    '## ': /^## /u,
    '### ': /^### /u,
    '#### ': /^#### /u,
    '##### ': /^##### /u,
    '###### ': /^###### /u,
    '> ': /^> /u,
    '- ': /^[-*+] /u,
    '1. ': /^\d+[.)] /u,
    '- [ ] ': /^- \[[ xX]\] /u,
    '   - ': /^ {3}[-*+] /u,
  };
  const pattern = patterns[prefix];
  if (!pattern) throw new Error(`Unsupported Markdown line prefix: ${JSON.stringify(prefix)}`);
  return pattern;
}

function competingPrefixPattern(prefix: string): RegExp {
  if (/^#{1,6} $/u.test(prefix)) return /^#{1,6} /u;
  if (prefix === '> ') return /^> /u;
  if (/^(?: {3})?(?:- |1\. |- \[ \] )$/u.test(prefix)) {
    return /^(?: {3})?(?:[-*+] \[[ xX]\] |[-*+] |\d+[.)] )/u;
  }
  return /^/u;
}
