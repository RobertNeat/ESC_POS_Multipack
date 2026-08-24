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
import { Alignment, CharacterFontSize, TextStyle } from '../../core/printer.models';
import { MarkdownTextEditorComponent } from '../../shared/markdown-text-editor.component';
import { TYPEWRITER_MARKDOWN_TOOLS } from '../../shared/markdown-tools';
import {
  ALIGNMENT_OPTIONS,
  characterColumns,
  FONT_OPTIONS,
  PAPER_OPTIONS,
} from '../../shared/printer-options';

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
  templateUrl: './typewriter.component.html',
  styleUrl: './typewriter.component.css',
})
export class TypewriterComponent {
  private readonly api = inject(PrinterApiService);
  private readonly i18n = inject(I18nService);
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
  protected readonly markdownTools = TYPEWRITER_MARKDOWN_TOOLS;
  protected selectFont(size: CharacterFontSize): void {
    this.style = {
      ...this.style,
      font: this.fontOptions.find((option) => option.size === size)?.font ?? 'A',
    };
  }
  protected readonly scaleOptions = [1, 2, 3, 4].map((value) => ({ label: `×${value}`, value }));
  protected alignmentOptions() {
    return ALIGNMENT_OPTIONS.map((option) => ({
      ...option,
      label: this.i18n.t(option.labelKey),
    }));
  }
  protected maxChars(): number {
    return Math.floor(
      characterColumns(this.fontSize, this.paperWidth) / (this.markdownMode ? 1 : this.style.width),
    );
  }
  protected previewText(): string {
    return this.markdownMode ? this.line.replace(/\*\*|__|~~|`|_/g, '') : this.line;
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
        await this.api.printMarkdown(value, this.fontSize, false, 'notification.markdownLineSent');
      else await this.api.printLine(value, this.alignment, this.style, false);
      this.history = [...this.history, this.previewText()].slice(-5);
      this.line = '';
    } finally {
      this.sending = false;
    }
  }
}
