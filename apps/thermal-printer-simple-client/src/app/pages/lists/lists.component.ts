import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PrinterApiService } from '../../core/printer-api.service';
import { CharacterFontSize } from '../../core/printer.models';
import { CHARACTER_FONT_OPTIONS } from '../../shared/printer-options';
import { editTextField } from '../../shared/text-editor';
import { generateListMarkdown, ListItem, parseListMarkdown } from './list-markdown';

@Component({
  imports: [
    FormsModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    ToggleSwitchModule,
  ],
  templateUrl: './lists.component.html',
  styleUrl: './lists.component.css',
})
export class ListsComponent {
  private readonly api = inject(PrinterApiService);
  private nextId = 4;
  protected items: ListItem[] = [
    { id: 1, type: 'number', depth: 0, text: 'Kawa', task: false, checked: false },
    { id: 2, type: 'bullet', depth: 1, text: 'duża, bez cukru', task: false, checked: false },
    { id: 3, type: 'number', depth: 0, text: 'Herbata', task: false, checked: false },
  ];
  protected cut = true;
  protected sending = false;
  protected fontSize: CharacterFontSize = '12x24';
  protected readonly fontSizeOptions = CHARACTER_FONT_OPTIONS;
  protected markdownMode = false;
  protected markdown = '';
  protected readonly types = [
    { label: '1. Numerowana', value: 'number' },
    { label: '• Punktowana', value: 'bullet' },
  ];
  protected readonly depths = [0, 1, 2, 3].map((value) => ({
    label: value === 0 ? 'Główny' : `Poziom ${value}`,
    value,
  }));
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
  protected insertMarkdown(value: string, input: HTMLTextAreaElement): void {
    const start = input.selectionStart ?? this.markdown.length;
    const end = input.selectionEnd ?? start;
    const selected = this.markdown.slice(start, end);
    const prefix = start > 0 && !this.markdown.slice(0, start).endsWith('\n') ? '\n' : '';
    const marker = value.slice(0, value.indexOf(' ') + 1);
    const replacement = selected
      ? `${prefix}${selected
          .split('\n')
          .map((line) => marker + line)
          .join('\n')}\n`
      : `${prefix}${value}\n`;
    const selectionStart = start + prefix.length + (selected ? marker.length : value.length);
    const selectionEnd = selected ? start + replacement.length - 1 : selectionStart;
    editTextField(input, replacement, selectionStart, selectionEnd);
  }
  protected async print(): Promise<void> {
    const markdown = this.listMarkdown();
    if (!markdown || this.sending) return;
    this.sending = true;
    try {
      await this.api.printMarkdown(markdown, this.fontSize, this.cut, 'Lista została wysłana');
    } finally {
      this.sending = false;
    }
  }
}
