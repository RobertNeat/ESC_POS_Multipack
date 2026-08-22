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

type MarkdownToolDefinition = Omit<MarkdownTool, 'label' | 'hint'>;

const MARKDOWN_TOOLS: readonly MarkdownToolDefinition[] = [
  {
    icon: 'pi pi-hashtag',
    value: '\n# {heading}\n',
    linePrefix: '# ',
  },
  {
    icon: 'pi pi-hashtag',
    value: '\n## {heading}\n',
    linePrefix: '## ',
  },
  {
    icon: 'pi pi-hashtag',
    value: '\n### {heading}\n',
    linePrefix: '### ',
  },
  {
    icon: 'pi pi-hashtag',
    value: '\n#### {heading}\n',
    linePrefix: '#### ',
  },
  {
    icon: 'pi pi-hashtag',
    value: '\n##### {heading}\n',
    linePrefix: '##### ',
  },
  {
    icon: 'pi pi-hashtag',
    value: '\n###### {heading}\n',
    linePrefix: '###### ',
  },
  { icon: 'pi pi-bold', marker: '**' },
  { icon: 'pi pi-italic', marker: '_' },
  { icon: 'pi pi-stop', marker: '~~' },
  { icon: 'pi pi-code', marker: '`' },
  {
    icon: 'pi pi-code',
    value: '\n```\n{code}\n```\n',
    codeBlock: true,
  },
  {
    icon: 'pi pi-comment',
    value: '\n> {quote}\n',
    linePrefix: '> ',
  },
  { icon: 'pi pi-minus', value: '\n---\n' },
  {
    icon: 'pi pi-list',
    value: '\n- {item}\n  - {subitem}\n',
    linePrefix: '- ',
  },
  {
    icon: 'pi pi-sort-numeric-down',
    value: '\n1. {item}\n   1. {subitem}\n',
    linePrefix: '1. ',
  },
  {
    icon: 'pi pi-check-square',
    value: '\n- [ ] {task}\n',
    linePrefix: '- [ ] ',
  },
  {
    icon: 'pi pi-table',
    value: '\n| {column1} | {column2} |\n| --- | --- |\n| {value} | {value} |\n',
  },
  {
    icon: 'pi pi-link',
    value: '[{description}](https://)',
    reference: 'link',
  },
  {
    icon: 'pi pi-image',
    value: '![{description}](https://)',
    reference: 'image',
  },
];

const LABEL_KEYS: readonly TranslationKey[] = [
  'tool.h1',
  'tool.h2',
  'tool.h3',
  'tool.h4',
  'tool.h5',
  'tool.h6',
  'tool.bold',
  'tool.underlineShort',
  'tool.reverse',
  'tool.code',
  'tool.codeBlock',
  'tool.quote',
  'tool.rule',
  'tool.list',
  'tool.numberedList',
  'tool.task',
  'tool.table',
  'tool.link',
  'tool.image',
];

const HINT_KEYS: readonly TranslationKey[] = [
  'tool.headingHint',
  'tool.headingHint',
  'tool.headingHint',
  'tool.headingHint',
  'tool.headingHint',
  'tool.headingHint',
  'tool.boldHint',
  'tool.underlineHint',
  'tool.reverseHint',
  'tool.inlineCodeHint',
  'tool.codeBlockHint',
  'tool.quoteHint',
  'tool.ruleHint',
  'tool.bulletHint',
  'tool.numberedHint',
  'tool.taskHint',
  'tool.tableHint',
  'tool.linkHint',
  'tool.imageHint',
];

export function localizedMarkdownTools(i18n: I18nService): readonly MarkdownTool[] {
  const replacements: Readonly<Record<string, TranslationKey>> = {
    heading: 'tool.headingPlaceholder',
    code: 'tool.codePlaceholder',
    quote: 'tool.quotePlaceholder',
    item: 'tool.itemPlaceholder',
    subitem: 'tool.subitemPlaceholder',
    task: 'tool.taskPlaceholder',
    column1: 'tool.column1',
    column2: 'tool.column2',
    value: 'tool.valuePlaceholder',
    description: 'tool.descriptionPlaceholder',
  };
  return MARKDOWN_TOOLS.map((tool, index) => {
    const value = tool.value?.replace(/\{(\w+)\}/g, (token, name: string) =>
      replacements[name] ? i18n.t(replacements[name]) : token,
    );
    return {
      ...tool,
      label: i18n.t(LABEL_KEYS[index]),
      hint: i18n.t(HINT_KEYS[index], index < 6 ? { level: index + 1 } : {}),
      value,
    };
  });
}

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
import { I18nService } from '../../core/i18n.service';
import { TranslationKey } from '../../core/translations';
