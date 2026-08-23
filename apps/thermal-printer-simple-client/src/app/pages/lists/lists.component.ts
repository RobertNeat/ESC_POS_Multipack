import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PrinterApiService } from '../../core/printer-api.service';
import { I18nService } from '../../core/i18n.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { CharacterFontSize } from '../../core/printer.models';
import { MarkdownTextEditorComponent } from '../../shared/markdown-text-editor.component';
import { LIST_MARKDOWN_TOOLS } from '../../shared/markdown-tools';
import { characterColumns, CHARACTER_FONT_OPTIONS } from '../../shared/printer-options';
import { generateListMarkdown, ListItem, parseListMarkdown } from './list-markdown';

@Component({
  imports: [
    FormsModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
    TranslatePipe,
    MarkdownTextEditorComponent,
  ],
  templateUrl: './lists.component.html',
  styleUrl: './lists.component.css',
})
export class ListsComponent {
  private readonly api = inject(PrinterApiService);
  private readonly i18n = inject(I18nService);
  private nextId = 4;
  protected items: ListItem[] = [
    {
      id: 1,
      type: 'number',
      depth: 0,
      text: this.i18n.t('example.coffee'),
      task: false,
      checked: false,
    },
    {
      id: 2,
      type: 'bullet',
      depth: 1,
      text: this.i18n.t('example.largeNoSugar'),
      task: false,
      checked: false,
    },
    {
      id: 3,
      type: 'number',
      depth: 0,
      text: this.i18n.t('example.tea'),
      task: false,
      checked: false,
    },
  ];
  protected cut = true;
  protected sending = false;
  protected fontSize: CharacterFontSize = '12x24';
  protected readonly fontSizeOptions = CHARACTER_FONT_OPTIONS;
  protected readonly markdownTools = LIST_MARKDOWN_TOOLS;
  protected markdownMode = false;
  protected markdown = '';
  protected types() {
    return [
      { label: this.i18n.t('lists.numbered'), value: 'number' },
      { label: this.i18n.t('lists.bulleted'), value: 'bullet' },
    ];
  }
  protected depths() {
    return [0, 1, 2, 3].map((value) => ({
      label: value === 0 ? this.i18n.t('lists.main') : this.i18n.t('lists.level', { level: value }),
      value,
    }));
  }
  protected add(): void {
    this.items.push({
      id: this.nextId++,
      type: 'bullet',
      depth: 0,
      text: '',
      task: false,
      checked: false,
    });
  }
  protected addNested(): void {
    const last = this.items.at(-1);
    this.items.push({
      id: this.nextId++,
      type: last?.type ?? 'bullet',
      depth: Math.min((last?.depth ?? 0) + 1, 3),
      text: '',
      task: false,
      checked: false,
    });
  }
  protected remove(index: number): void {
    this.items.splice(index, 1);
  }
  protected hasContent(): boolean {
    return this.listMarkdown().trim().length > 0;
  }
  protected generatedMarkdown(): string {
    return generateListMarkdown(this.items);
  }
  protected listMarkdown(): string {
    return this.markdownMode ? this.markdown : this.generatedMarkdown();
  }
  protected wrapColumn(): number {
    return characterColumns(this.fontSize);
  }
  protected changeMode(markdownMode: boolean): void {
    if (markdownMode) {
      this.markdown = this.generatedMarkdown();
      return;
    }
    const parsed = parseListMarkdown(this.markdown);
    if (parsed.length) {
      this.items = parsed;
      this.nextId = Math.max(...parsed.map((item) => item.id)) + 1;
    }
  }
  protected async print(): Promise<void> {
    const markdown = this.listMarkdown();
    if (!markdown || this.sending) return;
    this.sending = true;
    try {
      await this.api.printMarkdown(markdown, this.fontSize, this.cut, 'notification.listSent');
    } finally {
      this.sending = false;
    }
  }
}
