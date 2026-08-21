import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PrinterApiService } from '../../core/printer-api.service';
import { Alignment, CharacterFontSize, TextStyle } from '../../core/printer.models';
import { ALIGNMENT_OPTIONS, FONT_OPTIONS, PAPER_OPTIONS } from '../../shared/printer-options';
import { toggleMarkdownLinePrefix, toggleMarkdownLink } from '../../shared/markdown-editor';
import { editTextField, toggleTextMarker } from '../../shared/text-editor';

@Component({
  imports: [
    FormsModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
  ],
  templateUrl: './typewriter.component.html',
  styleUrl: './typewriter.component.css',
})
export class TypewriterComponent {
  private readonly api = inject(PrinterApiService);
  protected line = '';
  protected markdownMode = true;
  protected paperWidth = 80;
  protected alignment: Alignment = 'left';
  protected sending = false;
  protected cutting = false;
  protected history: string[] = [];
  protected fontSize: CharacterFontSize = '12x24';
  protected style: TextStyle = {
    font: 'A',
    emphasized: false,
    underline: 0,
    width: 1,
    height: 1,
    reverse: false,
  };
  protected readonly paperOptions = PAPER_OPTIONS.map((option) => ({
    label: option.label,
    value: option.millimeters,
  }));
  protected readonly fontOptions = FONT_OPTIONS;
  protected selectFont(size: CharacterFontSize): void {
    this.style = {
      ...this.style,
      font: this.fontOptions.find((option) => option.size === size)?.font ?? 'A',
    };
  }
  protected readonly scaleOptions = [1, 2, 3, 4].map((value) => ({ label: `×${value}`, value }));
  protected readonly alignmentOptions = ALIGNMENT_OPTIONS;
  protected maxChars(): number {
    return Math.floor(
      (this.paperWidth === 80
        ? this.style.font === 'A'
          ? 48
          : 64
        : this.style.font === 'A'
          ? 32
          : 42) / (this.markdownMode ? 1 : this.style.width),
    );
  }
  protected previewText(): string {
    return this.markdownMode ? this.line.replace(/\*\*|__|~~|`|_/g, '') : this.line;
  }
  protected wrap(marker: string, input: HTMLInputElement): void {
    const start = input.selectionStart ?? this.line.length;
    const end = this.excludeTrailingSpace(start, input.selectionEnd ?? start);
    const edit = toggleTextMarker(this.line, start, end, marker);
    this.replaceRange(
      edit.replacement,
      edit.replacementStart,
      edit.replacementEnd,
      input,
      edit.selectionStart,
      edit.selectionEnd,
    );
  }
  protected wrapCode(input: HTMLInputElement): void {
    this.wrap(String.fromCharCode(96), input);
  }
  protected wrapReference(input: HTMLInputElement, image = false): void {
    const start = input.selectionStart ?? this.line.length;
    const end = this.excludeTrailingSpace(start, input.selectionEnd ?? start);
    const edit = toggleMarkdownLink(this.line, start, end, image);
    this.replaceRange(
      edit.replacement,
      edit.replacementStart,
      edit.replacementEnd,
      input,
      edit.selectionStart,
      edit.selectionEnd,
    );
  }
  protected toggleLinePrefix(prefix: string, input: HTMLInputElement): void {
    const start = input.selectionStart ?? this.line.length;
    const end = input.selectionEnd ?? start;
    if (start === end) {
      this.insert(prefix, input);
      return;
    }
    const edit = toggleMarkdownLinePrefix(this.line, start, end, prefix);
    this.replaceRange(
      edit.replacement,
      edit.replacementStart,
      edit.replacementEnd,
      input,
      edit.selectionStart,
      edit.selectionEnd,
    );
  }
  protected insert(value: string, input: HTMLInputElement): void {
    const start = input.selectionStart ?? this.line.length;
    const end = input.selectionEnd ?? start;
    const selected = this.line.slice(start, end);
    const replacement = selected ? `${value}${selected}` : value;
    this.replaceRange(
      replacement,
      start,
      end,
      input,
      start + value.length,
      start + replacement.length,
    );
  }
  protected replace(value: string, input: HTMLInputElement): void {
    this.replaceRange(value, 0, this.line.length, input, value.length, value.length);
  }
  private replaceRange(
    value: string,
    start: number,
    end: number,
    input: HTMLInputElement,
    selectionStart: number,
    selectionEnd: number,
  ): void {
    const next = `${this.line.slice(0, start)}${value}${this.line.slice(end)}`;
    if (next.length > this.maxChars()) return;
    input.setSelectionRange(start, end);
    editTextField(input, value, selectionStart, selectionEnd);
  }
  private excludeTrailingSpace(start: number, end: number): number {
    return end > start && this.line[end - 1] === ' ' && end < this.line.length ? end - 1 : end;
  }
  protected async cutPaper(): Promise<void> {
    if (this.cutting || this.sending) return;
    this.cutting = true;
    try {
      await this.api.cutPaper();
      this.history = [];
    } finally {
      this.cutting = false;
    }
  }
  protected async send(): Promise<void> {
    const value = this.line.trim();
    if (!value || this.sending) return;
    this.sending = true;
    try {
      if (this.markdownMode)
        await this.api.printMarkdown(value, this.fontSize, false, 'Linia Markdown została wysłana');
      else await this.api.printLine(value, this.alignment, this.style, false);
      this.history = [...this.history, this.previewText()].slice(-5);
      this.line = '';
    } finally {
      this.sending = false;
    }
  }
}
