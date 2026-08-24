import {
  LIST_MARKDOWN_TOOLS,
  MARKDOWN_DOCUMENT_TOOLS,
  TYPEWRITER_MARKDOWN_TOOLS,
} from './markdown-tools';

describe('Markdown editor tool sets', () => {
  it('offers only H1 because H2-H6 have the same printer output as bold', () => {
    expect(MARKDOWN_DOCUMENT_TOOLS).toContain('h1');
    expect(MARKDOWN_DOCUMENT_TOOLS).not.toEqual(
      expect.arrayContaining(['h2', 'h3', 'h4', 'h5', 'h6']),
    );
  });

  it('hides document-only blocks in the typewriter', () => {
    expect(TYPEWRITER_MARKDOWN_TOOLS).not.toEqual(expect.arrayContaining(['codeBlock', 'table']));
  });

  it('limits the list editor to list and inline emphasis tools', () => {
    expect(LIST_MARKDOWN_TOOLS).toEqual([
      'bulletList',
      'numberedList',
      'taskList',
      'nestedList',
      'bold',
      'underline',
      'reverse',
    ]);
  });
});
