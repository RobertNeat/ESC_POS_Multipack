import { generateListMarkdown, ListItem, parseListMarkdown } from './list-markdown';

describe('list Markdown', () => {
  it('serializes nested and task list items with the parent marker width as the indent', () => {
    expect(
      generateListMarkdown([
        {
          id: 1,
          type: 'number',
          depth: 0,
          text: 'Kawa',
          task: false,
          checked: false,
        },
        {
          id: 2,
          type: 'bullet',
          depth: 1,
          text: 'bez cukru',
          task: true,
          checked: true,
        },
      ]),
    ).toBe('1. Kawa\n   - [x] bez cukru');
  });

  it('indents a bullet sub-item with exactly 2 spaces under a bullet parent', () => {
    const markdown = generateListMarkdown([
      { id: 1, type: 'bullet', depth: 0, text: 'jeden', task: false, checked: false },
      { id: 2, type: 'bullet', depth: 1, text: 'dwa', task: false, checked: false },
    ]);
    expect(markdown).toBe('- jeden\n  - dwa');
  });

  it('widens the indent under a double-digit numbered parent', () => {
    const markdown = generateListMarkdown([
      ...Array.from({ length: 9 }, (_, index) => ({
        id: index + 1,
        type: 'number' as const,
        depth: 0,
        text: `x${index}`,
        task: false,
        checked: false,
      })),
      { id: 10, type: 'number', depth: 0, text: 'dziesiaty', task: false, checked: false },
      { id: 11, type: 'bullet', depth: 1, text: 'podpunkt', task: false, checked: false },
    ]);
    const lines = markdown.split('\n');
    expect(lines.at(-2)).toBe('10. dziesiaty');
    expect(lines.at(-1)).toBe('    - podpunkt');
  });

  it('resets deeper indentation when an item steps back to a shallower depth', () => {
    const markdown = generateListMarkdown([
      { id: 1, type: 'bullet', depth: 0, text: 'jeden', task: false, checked: false },
      { id: 2, type: 'bullet', depth: 1, text: 'dwa', task: false, checked: false },
      { id: 3, type: 'bullet', depth: 0, text: 'trzy', task: false, checked: false },
      { id: 4, type: 'bullet', depth: 1, text: 'cztery', task: false, checked: false },
    ]);
    expect(markdown).toBe('- jeden\n  - dwa\n- trzy\n  - cztery');
  });

  it('parses the supported list subset and ignores unrelated lines', () => {
    expect(parseListMarkdown('nagłówek\n- [ ] zadanie\n  1. krok')).toEqual([
      {
        id: 1,
        type: 'bullet',
        depth: 0,
        text: 'zadanie',
        task: true,
        checked: false,
      },
      {
        id: 2,
        type: 'number',
        depth: 1,
        text: 'krok',
        task: false,
        checked: false,
      },
    ]);
  });

  it('still parses legacy 3-space indentation at depth 1', () => {
    expect(parseListMarkdown('- jeden\n   - dwa')).toEqual([
      { id: 1, type: 'bullet', depth: 0, text: 'jeden', task: false, checked: false },
      { id: 2, type: 'bullet', depth: 1, text: 'dwa', task: false, checked: false },
    ]);
  });

  it('parses a bullet nested under a double-digit numbered parent at depth 1', () => {
    expect(parseListMarkdown('10. dziesiaty\n    - podpunkt')).toEqual([
      { id: 1, type: 'number', depth: 0, text: 'dziesiaty', task: false, checked: false },
      { id: 2, type: 'bullet', depth: 1, text: 'podpunkt', task: false, checked: false },
    ]);
  });

  it('round-trips generate -> parse for a mixed nested list', () => {
    const items: ListItem[] = [
      { id: 1, type: 'bullet', depth: 0, text: 'jeden', task: false, checked: false },
      { id: 2, type: 'bullet', depth: 1, text: 'dwa', task: true, checked: true },
      { id: 3, type: 'number', depth: 0, text: 'trzy', task: false, checked: false },
    ];
    const parsed = parseListMarkdown(generateListMarkdown(items));
    const withoutId = (item: ListItem) => {
      const { type, depth, text, task, checked } = item;
      return { type, depth, text, task, checked };
    };
    expect(parsed.map(withoutId)).toEqual(items.map(withoutId));
  });
});
