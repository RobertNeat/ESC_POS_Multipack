import { markdownPreviewLines } from './markdown-preview';

describe('Markdown preview', () => {
  it('renders inline printer styles as separate fragments', () => {
    const [preview] = markdownPreviewLines('**bold** _underline_ ~~reverse~~ `code`');

    expect(preview?.fragments).toEqual([
      { text: 'bold', className: 'bold' },
      { text: ' ', className: '' },
      { text: 'underline', className: 'underline' },
      { text: ' ', className: '' },
      { text: 'reverse', className: 'reverse' },
      { text: ' ', className: '' },
      { text: 'code', className: 'code-inline' },
    ]);
  });

  it('renders compact horizontal rules across the selected paper width', () => {
    const preview = markdownPreviewLines('before\n---\nafter', 64);

    expect(preview.map((item) => item.fragments.map((part) => part.text).join(''))).toEqual([
      'before',
      '-'.repeat(64),
      'after',
    ]);
  });

  it('renders code blocks between rules without reverse styling', () => {
    const preview = markdownPreviewLines('```\nconst value = 1;\n```', 48);

    expect(preview.map((item) => item.className)).toEqual(['code-rule', 'code-line', 'code-rule']);
    expect(preview[1]?.fragments[0]).toEqual({ text: 'const value = 1;', className: 'code-text' });
  });

  it('aligns table columns like the printer output', () => {
    const preview = markdownPreviewLines(
      '| Kolumna 1 | Kolumna 2 |\n| --- | --- |\n| wartość | wartość |',
    );

    expect(preview.map((item) => item.fragments.map((part) => part.text).join(''))).toEqual([
      '| Kolumna 1 | Kolumna 2 |',
      '| --------- | --------- |',
      '| wartość   | wartość   |',
    ]);
  });

  it('does not make list items bold unless their content requests it', () => {
    const preview = markdownPreviewLines('- zwykły i **ważny**');

    expect(preview[0]?.fragments).toEqual([
      { text: '- ', className: '' },
      { text: 'zwykły i ', className: '' },
      { text: 'ważny', className: 'bold' },
    ]);
  });
});
