import {
  cycleMarkdownHeading,
  toggleMarkdownCodeBlock,
  toggleMarkdownLinePrefix,
  toggleMarkdownLink,
  toggleMarkdownSubitem,
  toggleMarkdownTask,
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

  it('toggles the supported nested list prefix', () => {
    expect(toggleMarkdownLinePrefix('podpunkt', 0, 8, '   - ').replacement).toBe('   - podpunkt');
  });

  it('rejects unsupported line prefixes', () => {
    expect(() => toggleMarkdownLinePrefix('tekst', 0, 5, '(.*)+ ')).toThrow(
      'Unsupported Markdown line prefix',
    );
  });

  it('toggles a fenced code block', () => {
    const added = toggleMarkdownCodeBlock('const value = 1;', 0, 16);
    expect(added.replacement).toBe('```\nconst value = 1;\n```');
    expect(toggleMarkdownCodeBlock(added.replacement, 4, 20).replacement).toBe('const value = 1;');
  });

  it('adds and removes links when only their label is selected', () => {
    const added = toggleMarkdownLink('dokument', 0, 8);
    expect(added.replacement).toBe('[dokument](https://)');
    expect(toggleMarkdownLink(added.replacement, 1, 9)).toMatchObject({
      replacement: 'dokument',
      replacementStart: 0,
      replacementEnd: 20,
    });
  });
});

describe('toggleMarkdownTask', () => {
  it('adds an unchecked task marker to a plain line', () => {
    const result = toggleMarkdownTask('kup mleko', 0, 9);
    expect(result.replacement).toBe('- [ ] kup mleko');
  });

  it('checks an unchecked task on a second application', () => {
    const added = toggleMarkdownTask('kup mleko', 0, 9);
    const checked = toggleMarkdownTask(added.replacement, added.selectionStart, added.selectionEnd);
    expect(checked.replacement).toBe('- [X] kup mleko');
  });

  it('unchecks a checked task on another application', () => {
    const result = toggleMarkdownTask('- [X] gotowe', 6, 12);
    expect(result.replacement).toBe('- [ ] gotowe');
  });

  it('removes the task marker when the selection overlaps the prefix of the first line', () => {
    const result = toggleMarkdownTask('- [ ] kup mleko', 0, 15);
    expect(result.replacement).toBe('kup mleko');
  });

  it('removes an existing bullet marker before adding a task marker', () => {
    const result = toggleMarkdownTask('- kup mleko', 2, 11);
    expect(result.replacement).toBe('- [ ] kup mleko');
  });

  it('checks every selected unchecked line and leaves already-checked lines alone', () => {
    const text = '- [ ] jeden\n- [X] dwa\n- [ ] trzy';
    const result = toggleMarkdownTask(text, 6, text.length);
    expect(result.replacement).toBe('- [X] jeden\n- [X] dwa\n- [X] trzy');
  });

  it('unchecks every selected line when all of them are already checked', () => {
    const text = '- [X] jeden\n- [X] dwa';
    const result = toggleMarkdownTask(text, 6, text.length);
    expect(result.replacement).toBe('- [ ] jeden\n- [ ] dwa');
  });

  it('removes markers from every line when the selection covers the first marker', () => {
    const text = '- [X] jeden\n- [X] dwa';
    const result = toggleMarkdownTask(text, 0, text.length);
    expect(result.replacement).toBe('jeden\ndwa');
  });

  it('toggles a nested task without prepending a second marker', () => {
    const text = '  - [ ] podpunkt';
    const result = toggleMarkdownTask(text, 8, text.length);
    expect(result.replacement).toBe('  - [X] podpunkt');
  });

  it('adds task markers to every selected plain line', () => {
    const text = 'jeden\ndwa';
    const result = toggleMarkdownTask(text, 0, text.length);
    expect(result.replacement).toBe('- [ ] jeden\n- [ ] dwa');
  });
});

describe('cycleMarkdownHeading', () => {
  it('turns a plain line into an H1', () => {
    expect(cycleMarkdownHeading('tekst', 1, 4).replacement).toBe('# tekst');
  });

  it('cycles H1 to H2, H2 to H3, and so on up to H6', () => {
    expect(cycleMarkdownHeading('# tekst', 2, 7).replacement).toBe('## tekst');
    expect(cycleMarkdownHeading('## tekst', 2, 8).replacement).toBe('### tekst');
    expect(cycleMarkdownHeading('### tekst', 2, 9).replacement).toBe('#### tekst');
    expect(cycleMarkdownHeading('#### tekst', 2, 10).replacement).toBe('##### tekst');
    expect(cycleMarkdownHeading('##### tekst', 2, 11).replacement).toBe('###### tekst');
  });

  it('wraps H6 back to H1', () => {
    expect(cycleMarkdownHeading('###### tekst', 2, 12).replacement).toBe('# tekst');
  });

  it('only acts on the first selected line', () => {
    const result = cycleMarkdownHeading('jeden\ndwa', 0, 9);
    expect(result.replacement).toBe('# jeden\ndwa');
  });
});

describe('toggleMarkdownSubitem', () => {
  it('indents under a bullet sibling using the sibling content column', () => {
    const text = '- jeden\ndwa';
    const result = toggleMarkdownSubitem(text, 8, 11);
    expect(result?.replacement).toBe('  dwa');
  });

  it('indents under a numbered sibling using the sibling content column', () => {
    const text = '1. jeden\ndwa';
    const result = toggleMarkdownSubitem(text, 9, 12);
    expect(result?.replacement).toBe('   dwa');
  });

  it('matches a double-digit numbered marker width', () => {
    const text = '10. jeden\ndwa';
    const result = toggleMarkdownSubitem(text, 10, 13);
    expect(result?.replacement).toBe('    dwa');
  });

  it('preserves the current line marker while indenting', () => {
    const text = '- jeden\n- dwa';
    const result = toggleMarkdownSubitem(text, 8, 13);
    expect(result?.replacement).toBe('  - dwa');
  });

  it('skips blank lines to find the nearest sibling', () => {
    const text = '- jeden\n\ndwa';
    const result = toggleMarkdownSubitem(text, 9, 12);
    expect(result?.replacement).toBe('  dwa');
  });

  it('returns undefined for the first item in a list (nothing to nest under)', () => {
    const text = '- jeden';
    expect(toggleMarkdownSubitem(text, 2, 7)).toBeUndefined();
  });

  it('returns undefined when the preceding line is not a list item', () => {
    const text = 'akapit\ndwa';
    expect(toggleMarkdownSubitem(text, 7, 10)).toBeUndefined();
  });

  it('finds the nearest same-depth sibling, skipping an already-nested item', () => {
    const text = '- jeden\n  - zagniezdzony\ndwa';
    const result = toggleMarkdownSubitem(text, 25, 28);
    expect(result?.replacement).toBe('  dwa');
  });
});
