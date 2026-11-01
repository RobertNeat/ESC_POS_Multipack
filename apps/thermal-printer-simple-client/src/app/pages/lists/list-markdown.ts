export type ListType = 'bullet' | 'number';

export interface ListItem {
  id: number;
  type: ListType;
  depth: number;
  text: string;
  checked: boolean;
  task: boolean;
}

const MAX_DEPTH = 3;

/**
 * Converts list editor state to the Markdown accepted by the print endpoint.
 * Indentation at each depth matches the actual marker width of the item at
 * the depth above (e.g. 2 spaces under "- ", 4 spaces under "10. "), since
 * that is what marked/MarkdownPrinter requires to recognize nesting -- a
 * fixed-width indent silently flattens the list instead.
 */
export function generateListMarkdown(items: readonly ListItem[]): string {
  let number = 1;
  const indentByDepth: string[] = [''];
  return items
    .filter((item) => item.text.trim())
    .map((item) => {
      const marker = item.type === 'number' ? `${number++}. ` : '- ';
      const task = item.task ? `[${item.checked ? 'x' : ' '}] ` : '';
      const indent = indentByDepth[item.depth] ?? indentByDepth.at(-1) ?? '';
      indentByDepth[item.depth + 1] = indent + ' '.repeat(marker.length);
      indentByDepth.length = item.depth + 2;
      return `${indent}${marker}${task}${item.text.trim()}`;
    })
    .join('\n');
}

/**
 * Parses only list syntax supported by the visual list editor. Depth is
 * derived structurally (nearest preceding line at a lesser indent width),
 * matching marked's own nesting rules, rather than dividing the indent by a
 * fixed step -- the same indent width means different depths depending on
 * the parent marker's length ("- " vs "10. ").
 */
export function parseListMarkdown(markdown: string): ListItem[] {
  let id = 1;
  const stack: Array<{ readonly indent: number; readonly depth: number }> = [];
  return markdown.split('\n').flatMap((line) => {
    const match = line.match(/^(\s*)([-*+]|\d+\.)\s+(?:\[([ xX])\]\s+)?(.*)$/);
    if (!match) return [];

    const indent = match[1].length;
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    const parent = stack[stack.length - 1];
    const depth = Math.min(parent ? parent.depth + 1 : 0, MAX_DEPTH);
    stack.push({ indent, depth });

    return [
      {
        id: id++,
        type: /\d+\./.test(match[2]) ? 'number' : 'bullet',
        depth,
        text: match[4],
        task: match[3] !== undefined,
        checked: /x/i.test(match[3] ?? ''),
      } satisfies ListItem,
    ];
  });
}
