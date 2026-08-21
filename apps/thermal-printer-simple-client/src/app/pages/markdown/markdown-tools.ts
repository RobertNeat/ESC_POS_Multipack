export interface MarkdownTool {
  readonly label: string;
  readonly icon: string;
  readonly hint: string;
  readonly marker?: string;
  readonly value?: string;
  readonly linePrefix?: string;
  readonly codeBlock?: boolean;
  readonly reference?: 'link' | 'image';
}

export interface MarkdownReplacement {
  replacement: string;
  selectedOffset: number;
  selectedLength: number;
}

export const MARKDOWN_TOOLS: readonly MarkdownTool[] = [
  {
    label: 'H1',
    icon: 'pi pi-hashtag',
    value: '\n# Nagłówek\n',
    linePrefix: '# ',
    hint: 'Nagłówek poziomu 1',
  },
  {
    label: 'H2',
    icon: 'pi pi-hashtag',
    value: '\n## Nagłówek\n',
    linePrefix: '## ',
    hint: 'Nagłówek poziomu 2',
  },
  {
    label: 'H3',
    icon: 'pi pi-hashtag',
    value: '\n### Nagłówek\n',
    linePrefix: '### ',
    hint: 'Nagłówek poziomu 3',
  },
  {
    label: 'H4',
    icon: 'pi pi-hashtag',
    value: '\n#### Nagłówek\n',
    linePrefix: '#### ',
    hint: 'Nagłówek poziomu 4',
  },
  {
    label: 'H5',
    icon: 'pi pi-hashtag',
    value: '\n##### Nagłówek\n',
    linePrefix: '##### ',
    hint: 'Nagłówek poziomu 5',
  },
  {
    label: 'H6',
    icon: 'pi pi-hashtag',
    value: '\n###### Nagłówek\n',
    linePrefix: '###### ',
    hint: 'Nagłówek poziomu 6',
  },
  { label: 'Bold', icon: 'pi pi-bold', marker: '**', hint: 'Pogrubienie' },
  { label: 'Podkr.', icon: 'pi pi-italic', marker: '_', hint: 'Podkreślenie' },
  { label: 'Negatyw', icon: 'pi pi-stop', marker: '~~', hint: 'Negatyw' },
  { label: 'Kod', icon: 'pi pi-code', marker: '`', hint: 'Kod inline' },
  {
    label: 'Blok kodu',
    icon: 'pi pi-code',
    value: '\n```\nkod\n```\n',
    codeBlock: true,
    hint: 'Blok kodu',
  },
  {
    label: 'Cytat',
    icon: 'pi pi-comment',
    value: '\n> cytat\n',
    linePrefix: '> ',
    hint: 'Cytat',
  },
  { label: '---', icon: 'pi pi-minus', value: '\n---\n', hint: 'Linia oddzielająca' },
  {
    label: 'Lista',
    icon: 'pi pi-list',
    value: '\n- element\n  - podpunkt\n',
    linePrefix: '- ',
    hint: 'Lista punktowana',
  },
  {
    label: '1. Lista',
    icon: 'pi pi-sort-numeric-down',
    value: '\n1. element\n   1. podpunkt\n',
    linePrefix: '1. ',
    hint: 'Lista numerowana',
  },
  {
    label: 'Zadanie',
    icon: 'pi pi-check-square',
    value: '\n- [ ] zadanie\n',
    linePrefix: '- [ ] ',
    hint: 'Lista zadań',
  },
  {
    label: 'Tabela',
    icon: 'pi pi-table',
    value: '\n| Kolumna 1 | Kolumna 2 |\n| --- | --- |\n| wartość | wartość |\n',
    hint: 'Tabela',
  },
  {
    label: 'Link',
    icon: 'pi pi-link',
    value: '[opis](https://)',
    reference: 'link',
    hint: 'Odnośnik',
  },
  {
    label: 'Obraz',
    icon: 'pi pi-image',
    value: '![opis](https://)',
    reference: 'image',
    hint: 'Obraz jako odnośnik',
  },
];

export function formatMarkdownSelection(
  tool: Pick<MarkdownTool, 'value'>,
  selected: string,
): MarkdownReplacement {
  const value = tool.value ?? '';
  return {
    replacement: `${value}${selected}`,
    selectedOffset: value.length,
    selectedLength: selected.length,
  };
}
