import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { PrinterApiService } from '../../core/printer-api.service';
import { I18nService } from '../../core/i18n.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { CharacterFontSize } from '../../core/printer.models';
import { MarkdownTextEditorComponent } from '../../shared/markdown-text-editor.component';
import { MARKDOWN_DOCUMENT_TOOLS } from '../../shared/markdown-tools';
import { characterColumns, CHARACTER_FONT_OPTIONS } from '../../shared/printer-options';
import { markdownPreviewLines } from './markdown-preview';

@Component({
  imports: [
    FormsModule,
    ButtonModule,
    CheckboxModule,
    SelectModule,
    TranslatePipe,
    MarkdownTextEditorComponent,
  ],
  templateUrl: './markdown.component.html',
  styleUrl: './markdown.component.css',
})
export class MarkdownComponent {
  private readonly api = inject(PrinterApiService);
  protected readonly i18n = inject(I18nService);
  protected markdown = `# ${this.i18n.t('example.order')}\n\n1. **${this.i18n.t('example.coffee')}**\n   - ${this.i18n.t('example.large')}\n   - ${this.i18n.t('example.noSugar')}\n2. _${this.i18n.t('example.tea')}_\n\n> ${this.i18n.t('example.thanks')}`;
  protected cut = true;
  protected sending = false;
  protected fontSize: CharacterFontSize = '12x24';
  protected readonly fontSizeOptions = CHARACTER_FONT_OPTIONS;
  protected readonly markdownTools = MARKDOWN_DOCUMENT_TOOLS;
  protected wrapColumn(): number {
    return characterColumns(this.fontSize);
  }
  protected hasHtml(): boolean {
    return /<\/?[a-z][^>]*>/i.test(this.markdown);
  }
  protected previewLines() {
    return markdownPreviewLines(this.markdown, this.wrapColumn());
  }
  protected async loadFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 100000) {
      this.markdown = '';
      return;
    }
    this.markdown = await file.text();
    input.value = '';
  }
  protected async print(): Promise<void> {
    if (!this.markdown.trim() || this.hasHtml() || this.sending) return;
    this.sending = true;
    try {
      await this.api.printMarkdown(this.markdown, this.fontSize, this.cut);
    } finally {
      this.sending = false;
    }
  }
  protected async printAsText(): Promise<void> {
    if (!this.markdown.trim() || this.sending) return;
    this.sending = true;
    try {
      await this.api.printText(this.markdown, this.fontSize, this.cut);
    } finally {
      this.sending = false;
    }
  }
}
