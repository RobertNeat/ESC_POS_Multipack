import { I18nService } from '../core/i18n.service';
import { TranslationKey } from '../core/translations';

export type MarkdownToolId =
  | 'h1'
  | 'bold'
  | 'underline'
  | 'reverse'
  | 'inlineCode'
  | 'codeBlock'
  | 'quote'
  | 'rule'
  | 'bulletList'
  | 'numberedList'
  | 'taskList'
  | 'nestedList'
  | 'table'
  | 'link'
  | 'image';

export interface MarkdownTool {
  readonly id: MarkdownToolId;
  readonly label: string;
  readonly icon: string;
  readonly hint: string;
  readonly marker?: string;
  readonly value?: string;
  readonly linePrefix?: string;
  readonly codeBlock?: boolean;
  readonly reference?: 'link' | 'image';
}

interface MarkdownToolDefinition extends Omit<MarkdownTool, 'label' | 'hint' | 'value'> {
  readonly labelKey: TranslationKey;
  readonly hintKey: TranslationKey;
  readonly value?: string;
}

export const MARKDOWN_DOCUMENT_TOOLS: readonly MarkdownToolId[] = [
  'h1',
  'bold',
  'underline',
  'reverse',
  'inlineCode',
  'codeBlock',
  'quote',
  'rule',
  'bulletList',
  'numberedList',
  'taskList',
  'nestedList',
  'table',
  'link',
  'image',
];

export const TYPEWRITER_MARKDOWN_TOOLS: readonly MarkdownToolId[] = [
  'h1',
  'bold',
  'underline',
  'reverse',
  'inlineCode',
  'quote',
  'rule',
  'bulletList',
  'numberedList',
  'taskList',
  'link',
  'image',
];

export const LIST_MARKDOWN_TOOLS: readonly MarkdownToolId[] = [
  'bulletList',
  'numberedList',
  'taskList',
  'nestedList',
  'bold',
  'underline',
  'reverse',
];

const TOOL_DEFINITIONS: readonly MarkdownToolDefinition[] = [
  {
    id: 'h1',
    labelKey: 'tool.h1',
    hintKey: 'tool.headingHint',
    icon: 'pi pi-hashtag',
    value: '\n# {heading}\n',
    linePrefix: '# ',
  },
  {
    id: 'bold',
    labelKey: 'tool.bold',
    hintKey: 'tool.boldHint',
    icon: 'pi pi-bold',
    marker: '**',
  },
  {
    id: 'underline',
    labelKey: 'tool.underlineShort',
    hintKey: 'tool.underlineHint',
    icon: 'pi pi-italic',
    marker: '_',
  },
  {
    id: 'reverse',
    labelKey: 'tool.reverse',
    hintKey: 'tool.reverseHint',
    icon: 'pi pi-stop',
    marker: '~~',
  },
  {
    id: 'inlineCode',
    labelKey: 'tool.code',
    hintKey: 'tool.inlineCodeHint',
    icon: 'pi pi-code',
    marker: '`',
  },
  {
    id: 'codeBlock',
    labelKey: 'tool.codeBlock',
    hintKey: 'tool.codeBlockHint',
    icon: 'pi pi-code',
    value: '\n```\n{code}\n```\n',
    codeBlock: true,
  },
  {
    id: 'quote',
    labelKey: 'tool.quote',
    hintKey: 'tool.quoteHint',
    icon: 'pi pi-comment',
    value: '\n> {quote}\n',
    linePrefix: '> ',
  },
  {
    id: 'rule',
    labelKey: 'tool.rule',
    hintKey: 'tool.ruleHint',
    icon: 'pi pi-minus',
    value: '\n---\n',
  },
  {
    id: 'bulletList',
    labelKey: 'tool.list',
    hintKey: 'tool.bulletHint',
    icon: 'pi pi-list',
    value: '\n- {item}\n',
    linePrefix: '- ',
  },
  {
    id: 'numberedList',
    labelKey: 'tool.numberedList',
    hintKey: 'tool.numberedHint',
    icon: 'pi pi-sort-numeric-down',
    value: '\n1. {item}\n',
    linePrefix: '1. ',
  },
  {
    id: 'taskList',
    labelKey: 'tool.task',
    hintKey: 'tool.taskHint',
    icon: 'pi pi-check-square',
    value: '\n- [ ] {task}\n',
    linePrefix: '- [ ] ',
  },
  {
    id: 'nestedList',
    labelKey: 'tool.nested',
    hintKey: 'tool.nestedHint',
    icon: 'pi pi-level-down',
    value: '\n   - {subitem}\n',
    linePrefix: '   - ',
  },
  {
    id: 'table',
    labelKey: 'tool.table',
    hintKey: 'tool.tableHint',
    icon: 'pi pi-table',
    value: '\n| {column1} | {column2} |\n| --- | --- |\n| {value} | {value} |\n',
  },
  {
    id: 'link',
    labelKey: 'tool.link',
    hintKey: 'tool.linkHint',
    icon: 'pi pi-link',
    value: '[{description}](https://)',
    reference: 'link',
  },
  {
    id: 'image',
    labelKey: 'tool.image',
    hintKey: 'tool.imageHint',
    icon: 'pi pi-image',
    value: '![{description}](https://)',
    reference: 'image',
  },
];

export function localizedMarkdownTools(
  i18n: I18nService,
  enabled: readonly MarkdownToolId[],
): readonly MarkdownTool[] {
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
  const definitions = new Map(TOOL_DEFINITIONS.map((tool) => [tool.id, tool]));
  return enabled.flatMap((id) => {
    const tool = definitions.get(id);
    if (!tool) return [];
    return [
      {
        ...tool,
        label: i18n.t(tool.labelKey),
        hint: i18n.t(tool.hintKey, tool.id === 'h1' ? { level: 1 } : {}),
        value: tool.value?.replace(/\{(\w+)\}/g, (token, name: string) =>
          replacements[name] ? i18n.t(replacements[name]) : token,
        ),
      },
    ];
  });
}
