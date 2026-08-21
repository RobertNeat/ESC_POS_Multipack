export type ListType = 'bullet' | 'number';

export interface ListItem {
  id: number;
  type: ListType;
  depth: number;
  text: string;
  checked: boolean;
  task: boolean;
}

/** Converts list editor state to the Markdown accepted by the print endpoint. */
export function generateListMarkdown(items: readonly ListItem[]): string {
  let number = 1;
  return items
    .filter((item) => item.text.trim())
    .map((item) => {
      const marker = item.type === 'number' ? `${number++}. ` : '- ';
      const task = item.task ? `[${item.checked ? 'x' : ' '}] ` : '';
      return `${'   '.repeat(item.depth)}${marker}${task}${item.text.trim()}`;
    })
    .join('\n');
}

/** Parses only list syntax supported by the visual list editor. */
export function parseListMarkdown(markdown: string): ListItem[] {
  let id = 1;
  return markdown.split('\n').flatMap((line) => {
    const match = line.match(/^(\s*)([-*+]|\d+\.)\s+(?:\[([ xX])\]\s+)?(.*)$/);
    if (!match) {
      return [];
    }
    return [
      {
        id: id++,
        type: /\d+\./.test(match[2]) ? 'number' : 'bullet',
        depth: Math.min(Math.floor(match[1].length / 3), 3),
        text: match[4],
        task: match[3] !== undefined,
        checked: /x/i.test(match[3] ?? ''),
      } satisfies ListItem,
    ];
  });
}
