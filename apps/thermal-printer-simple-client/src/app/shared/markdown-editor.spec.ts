import {
  toggleMarkdownCodeBlock,
  toggleMarkdownLinePrefix,
  toggleMarkdownLink,
} from './markdown-editor';

describe('Markdown editor toggles', () => {
  it.each(['# ', '## ', '### ', '#### ', '##### ', '###### '])(
    'adds and removes heading prefix %j for a selection inside the line',
    (prefix) => {
      const heading = `${prefix}tekst`;
      expect(toggleMarkdownLinePrefix('tekst', 1, 4, prefix)).toMatchObject({
        replacement: heading,
        replacementStart: 0,
        replacementEnd: 5,
      });
      expect(
        toggleMarkdownLinePrefix(heading, prefix.length, heading.length, prefix),
      ).toMatchObject({
        replacement: 'tekst',
        replacementStart: 0,
        replacementEnd: heading.length,
      });
    },
  );

  it('changes a heading level instead of nesting headings', () => {
    expect(toggleMarkdownLinePrefix('## tekst', 3, 8, '# ')).toMatchObject({
      replacement: '# tekst',
    });
  });

  it('toggles quote prefixes on every selected line', () => {
    const added = toggleMarkdownLinePrefix('jeden\ndwa', 0, 9, '> ');
    expect(added.replacement).toBe('> jeden\n> dwa');
    expect(
      toggleMarkdownLinePrefix(added.replacement, 0, added.replacement.length, '> ').replacement,
    ).toBe('jeden\ndwa');
  });

  it('switches between list types and removes the selected type', () => {
    expect(toggleMarkdownLinePrefix('1. element', 3, 10, '- ').replacement).toBe('- element');
    expect(toggleMarkdownLinePrefix('- element', 2, 9, '- ').replacement).toBe('element');
    expect(toggleMarkdownLinePrefix('- [x] gotowe', 6, 12, '- [ ] ').replacement).toBe('gotowe');
  });

  it('toggles a fenced code block', () => {
    const added = toggleMarkdownCodeBlock('const value = 1;', 0, 16);
    expect(added.replacement).toBe('```\nconst value = 1;\n```');
    expect(toggleMarkdownCodeBlock(added.replacement, 4, 20).replacement).toBe('const value = 1;');
  });

  it('adds and removes links when only their label is selected', () => {
    const added = toggleMarkdownLink('dokument', 0, 8, false);
    expect(added.replacement).toBe('[dokument](https://)');
    expect(toggleMarkdownLink(added.replacement, 1, 9, false)).toMatchObject({
      replacement: 'dokument',
      replacementStart: 0,
      replacementEnd: 20,
    });
  });

  it('adds and removes image references', () => {
    const added = toggleMarkdownLink('logo', 0, 4, true);
    expect(added.replacement).toBe('![logo](https://)');
    expect(
      toggleMarkdownLink(added.replacement, 0, added.replacement.length, true).replacement,
    ).toBe('logo');
  });
});
