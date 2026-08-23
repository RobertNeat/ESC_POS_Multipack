import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { I18nService } from '../core/i18n.service';
import {
  type MarkdownEdit,
  toggleMarkdownCodeBlock,
  toggleMarkdownLinePrefix,
  toggleMarkdownLink,
} from './markdown-editor';
import { localizedMarkdownTools, MarkdownTool, MarkdownToolId } from './markdown-tools';
import { editTextField, toggleTextMarker } from './text-editor';

@Component({
  selector: 'app-markdown-text-editor',
  imports: [FormsModule, InputTextModule, TextareaModule],
  templateUrl: './markdown-text-editor.component.html',
  styleUrl: './markdown-text-editor.component.css',
})
export class MarkdownTextEditorComponent {
  private readonly i18n = inject(I18nService);

  @Input() value = '';
  @Output() readonly valueChange = new EventEmitter<string>();
  @Input() enabledTools: readonly MarkdownToolId[] = [];
  @Input() multiline = true;
  @Input() rows = 20;
  @Input() maxLength = 100000;
  @Input() wrapColumn?: number;
  @Input() placeholder = '';
  @Input() ariaLabel = '';
  @Input() spellcheck = false;
  @Input() prefix = '';
  @Input() showCount = false;
  @Output() readonly enterPressed = new EventEmitter<void>();

  protected tools(): readonly MarkdownTool[] {
    return localizedMarkdownTools(this.i18n, this.enabledTools);
  }

  protected updateValue(value: string): void {
    this.value = value;
    this.valueChange.emit(value);
  }

  protected wrapColumnTitle(): string {
    return this.i18n.t('editor.wrapColumn', { column: this.wrapColumn ?? '' });
  }

  protected applyTool(tool: MarkdownTool, input: HTMLInputElement | HTMLTextAreaElement): void {
    const start = input.selectionStart ?? this.value.length;
    const end = input.selectionEnd ?? start;
    const selected = this.value.slice(start, end);
    if (tool.marker) {
      this.applyEdit(toggleTextMarker(this.value, start, end, tool.marker), input);
      return;
    }
    if (selected && tool.linePrefix) {
      this.applyEdit(toggleMarkdownLinePrefix(this.value, start, end, tool.linePrefix), input);
      return;
    }
    if (selected && tool.codeBlock) {
      this.applyEdit(toggleMarkdownCodeBlock(this.value, start, end), input);
      return;
    }
    if (selected && tool.reference) {
      this.applyEdit(toggleMarkdownLink(this.value, start, end, tool.reference === 'image'), input);
      return;
    }

    if (!this.multiline && tool.linePrefix) {
      this.applyEdit(toggleMarkdownLinePrefix(this.value, start, end, tool.linePrefix), input);
      return;
    }

    const toolValue = this.multiline ? (tool.value ?? '') : (tool.value ?? '').trim();
    const replacement = selected && this.multiline ? `${toolValue}${selected}` : toolValue;
    if (this.value.length - (end - start) + replacement.length > this.maxLength) return;
    const selectedStart = start + (selected && this.multiline ? toolValue.length : 0);
    editTextField(input, replacement, selectedStart, selectedStart + selected.length);
  }

  private applyEdit(edit: MarkdownEdit, input: HTMLInputElement | HTMLTextAreaElement): void {
    const nextLength =
      this.value.length - (edit.replacementEnd - edit.replacementStart) + edit.replacement.length;
    if (nextLength > this.maxLength) return;
    input.setSelectionRange(edit.replacementStart, edit.replacementEnd);
    editTextField(input, edit.replacement, edit.selectionStart, edit.selectionEnd);
  }
}
