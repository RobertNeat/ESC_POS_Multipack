import { generateListMarkdown, parseListMarkdown } from './list-markdown';

describe('list Markdown', () => {
  it('serializes nested and task list items', () => {
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

  it('parses the supported list subset and ignores unrelated lines', () => {
    expect(parseListMarkdown('nagłówek\n- [ ] zadanie\n   1. krok')).toEqual([
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
});
