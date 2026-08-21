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
  image: boolean,
): MarkdownEdit {
  const range = trimSelection(text, selectionStart, selectionEnd);
  const selected = text.slice(range.start, range.end);
  const prefix = image ? '![' : '[';
  const complete = selected.match(
    image ? /^!\[([^\]]*)\]\([^\n)]*\)$/u : /^\[([^\]]*)\]\([^\n)]*\)$/u,
  );
  if (complete) {
    return replacementEdit(complete[1] ?? '', range.start, range.end);
  }

  const suffix = text.slice(range.end).match(/^\]\([^\n)]*\)/u)?.[0];
  if (text.slice(range.start - prefix.length, range.start) === prefix && suffix) {
    return replacementEdit(selected, range.start - prefix.length, range.end + suffix.length);
  }

  const label = selected || (image ? 'opis' : 'tekst');
  const replacement = `${prefix}${label}](https://)`;
  return {
    replacement,
    replacementStart: range.start,
    replacementEnd: range.end,
    selectionStart: range.start + prefix.length,
    selectionEnd: range.start + prefix.length + label.length,
  };
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
