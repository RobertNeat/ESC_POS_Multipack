import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SplitButtonModule } from 'primeng/splitbutton';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { PrinterApiService } from '../../core/printer-api.service';
import { CharacterFontSize } from '../../core/printer.models';
import { CHARACTER_FONT_OPTIONS } from '../../shared/printer-options';
import { editTextField, toggleTextMarker } from '../../shared/text-editor';
import {
  type MarkdownEdit,
  toggleMarkdownCodeBlock,
  toggleMarkdownLinePrefix,
  toggleMarkdownLink,
} from '../../shared/markdown-editor';
import { markdownPreviewLines } from './markdown-preview';
import { formatMarkdownSelection, MARKDOWN_TOOLS, MarkdownTool } from './markdown-tools';

@Component({
  imports: [
    FormsModule,
    ButtonModule,
    CheckboxModule,
    SelectModule,
    SplitButtonModule,
    TextareaModule,
  ],
  templateUrl: './markdown.component.html',
  styleUrl: './markdown.component.css',
})
export class MarkdownComponent {
  private readonly api = inject(PrinterApiService);
  protected markdown =
    '# Zamówienie\n\n1. **Kawa**\n   - duża\n   - bez cukru\n2. _Herbata_\n\n> Dziękujemy i zapraszamy ponownie!';
  protected cut = true;
  protected sending = false;
  protected fontSize: CharacterFontSize = '12x24';
  protected readonly fontSizeOptions = CHARACTER_FONT_OPTIONS;
  protected readonly printOptions: MenuItem[] = [
    { label: 'Drukuj jako .txt', icon: 'pi pi-file', command: () => void this.printAsText() },
  ];
  protected readonly tools = MARKDOWN_TOOLS;
  protected applyTool(tool: MarkdownTool, input: HTMLTextAreaElement): void {
    const start = input.selectionStart ?? this.markdown.length;
    const end = input.selectionEnd ?? start;
    const selected = this.markdown.slice(start, end);
    if (tool.marker) {
      this.applyEdit(toggleTextMarker(this.markdown, start, end, tool.marker), input);
      return;
    }
    if (selected && tool.linePrefix) {
      this.applyEdit(toggleMarkdownLinePrefix(this.markdown, start, end, tool.linePrefix), input);
      return;
    }
    if (selected && tool.codeBlock) {
      this.applyEdit(toggleMarkdownCodeBlock(this.markdown, start, end), input);
      return;
    }
    if (selected && tool.reference) {
      this.applyEdit(
        toggleMarkdownLink(this.markdown, start, end, tool.reference === 'image'),
        input,
      );
      return;
    }

    const { replacement, selectedOffset, selectedLength } = selected
      ? formatMarkdownSelection(tool, selected)
      : { replacement: tool.value ?? '', selectedOffset: 0, selectedLength: 0 };
    if (this.markdown.length - (end - start) + replacement.length > 100000) return;
    editTextField(
      input,
      replacement,
      start + selectedOffset,
      start + selectedOffset + selectedLength,
    );
  }
  private applyEdit(edit: MarkdownEdit, input: HTMLTextAreaElement): void {
    const nextLength =
      this.markdown.length -
      (edit.replacementEnd - edit.replacementStart) +
      edit.replacement.length;
    if (nextLength > 100000) return;
    input.setSelectionRange(edit.replacementStart, edit.replacementEnd);
    editTextField(input, edit.replacement, edit.selectionStart, edit.selectionEnd);
  }
  protected hasHtml(): boolean {
    return /<\/?[a-z][^>]*>/i.test(this.markdown);
  }
  protected previewLines() {
    return markdownPreviewLines(this.markdown);
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
