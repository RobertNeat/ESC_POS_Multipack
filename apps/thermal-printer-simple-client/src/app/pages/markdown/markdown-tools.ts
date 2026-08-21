export interface MarkdownTool {
  readonly label: string;
  readonly icon: string;
  readonly hint: string;
  readonly marker?: string;
  readonly value?: string;
}

export interface MarkdownReplacement {
  replacement: string;
  selectedOffset: number;
  selectedLength: number;
}

export const MARKDOWN_TOOLS: readonly MarkdownTool[] = [
  { label: 'H1', icon: 'pi pi-hashtag', value: '\n# Nagłówek\n', hint: 'Nagłówek poziomu 1' },
  { label: 'H2', icon: 'pi pi-hashtag', value: '\n## Nagłówek\n', hint: 'Nagłówek poziomu 2' },
  { label: 'H3', icon: 'pi pi-hashtag', value: '\n### Nagłówek\n', hint: 'Nagłówek poziomu 3' },
  { label: 'H4', icon: 'pi pi-hashtag', value: '\n#### Nagłówek\n', hint: 'Nagłówek poziomu 4' },
  { label: 'H5', icon: 'pi pi-hashtag', value: '\n##### Nagłówek\n', hint: 'Nagłówek poziomu 5' },
  { label: 'H6', icon: 'pi pi-hashtag', value: '\n###### Nagłówek\n', hint: 'Nagłówek poziomu 6' },
  { label: 'Bold', icon: 'pi pi-bold', marker: '**', hint: 'Pogrubienie' },
  { label: 'Podkr.', icon: 'pi pi-italic', marker: '_', hint: 'Podkreślenie' },
  { label: 'Negatyw', icon: 'pi pi-stop', marker: '~~', hint: 'Negatyw' },
  { label: 'Kod', icon: 'pi pi-code', marker: '`', hint: 'Kod inline' },
  { label: 'Blok kodu', icon: 'pi pi-code', value: '\n```\nkod\n```\n', hint: 'Blok kodu' },
  { label: 'Cytat', icon: 'pi pi-comment', value: '\n> cytat\n', hint: 'Cytat' },
  { label: '---', icon: 'pi pi-minus', value: '\n---\n', hint: 'Linia oddzielająca' },
  {
    label: 'Lista',
    icon: 'pi pi-list',
    value: '\n- element\n  - podpunkt\n',
    hint: 'Lista punktowana',
  },
  {
    label: '1. Lista',
    icon: 'pi pi-sort-numeric-down',
    value: '\n1. element\n   1. podpunkt\n',
    hint: 'Lista numerowana',
  },
  { label: 'Zadanie', icon: 'pi pi-check-square', value: '\n- [ ] zadanie\n', hint: 'Lista zadań' },
  {
    label: 'Tabela',
    icon: 'pi pi-table',
    value: '\n| Kolumna 1 | Kolumna 2 |\n| --- | --- |\n| wartość | wartość |\n',
    hint: 'Tabela',
  },
  { label: 'Link', icon: 'pi pi-link', value: '[opis](https://)', hint: 'Odnośnik' },
  { label: 'Obraz', icon: 'pi pi-image', value: '![opis](https://)', hint: 'Obraz jako odnośnik' },
];

export function formatMarkdownSelection(
  tool: Pick<MarkdownTool, 'marker' | 'value'>,
  selected: string,
): MarkdownReplacement {
  if (tool.marker) {
    return {
      replacement: `${tool.marker}${selected}${tool.marker}`,
      selectedOffset: tool.marker.length,
      selectedLength: selected.length,
    };
  }
  const value = tool.value ?? '';
  if (/^\n?#{1,6} /.test(value)) {
    const marker = value.match(/#{1,6} /)?.[0] ?? '';
    return {
      replacement: `${marker}${selected}\n`,
      selectedOffset: marker.length,
      selectedLength: selected.length,
    };
  }
  if (value.includes('```')) {
    return {
      replacement: `\n\`\`\`\n${selected}\n\`\`\`\n`,
      selectedOffset: 5,
      selectedLength: selected.length,
    };
  }
  if (/^\n?> /.test(value)) return prefixLines(selected, '> ');
  if (value.includes('- [ ]')) return prefixLines(selected, '- [ ] ');
  if (value.includes('1. element')) return prefixLines(selected, '1. ');
  if (value.includes('- element')) return prefixLines(selected, '- ');
  if (value.startsWith('![')) {
    return {
      replacement: `![${selected}](https://)`,
      selectedOffset: 2,
      selectedLength: selected.length,
    };
  }
  if (value.startsWith('[')) {
    return {
      replacement: `[${selected}](https://)`,
      selectedOffset: 1,
      selectedLength: selected.length,
    };
  }
  return {
    replacement: `${value}${selected}`,
    selectedOffset: value.length,
    selectedLength: selected.length,
  };
}

function prefixLines(selected: string, prefix: string): MarkdownReplacement {
  const replacement = `${selected
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n')}\n`;
  return {
    replacement,
    selectedOffset: prefix.length,
    selectedLength: replacement.length - prefix.length - 1,
  };
}
