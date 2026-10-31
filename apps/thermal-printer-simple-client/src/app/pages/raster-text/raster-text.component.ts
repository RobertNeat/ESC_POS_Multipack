import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { FontLibraryApiService } from '../../core/font-library-api.service';
import { RasterTextApiService } from '../../core/raster-text-api.service';
import { errorDetail } from '../../core/printer-notification.service';
import { I18nService } from '../../core/i18n.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { Alignment } from '../../core/printer.models';
import { ALIGNMENT_OPTIONS } from '../../shared/printer-options';
import { DitherAlgorithm, FontSummary, RasterTextMode, RasterTextPreview } from '../../core/raster-text.models';
import {
  DEFAULT_FONT_SIZE_PX,
  DEFAULT_LINE_SPACING,
  DEFAULT_THRESHOLD_PERCENT,
  DITHER_ALGORITHM_OPTIONS,
  FONT_SIZE_PRESETS_PX,
  MAX_FONT_SIZE_PX,
  MAX_LINE_SPACING,
  MAX_THRESHOLD_PERCENT,
  MIN_FONT_SIZE_PX,
  MIN_LINE_SPACING,
  MIN_THRESHOLD_PERCENT,
  MODE_OPTIONS,
} from './raster-text-options';

const PREVIEW_DEBOUNCE_MS = 300;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

@Component({
  imports: [FormsModule, ButtonModule, CheckboxModule, SelectModule, InputTextModule, TranslatePipe],
  templateUrl: './raster-text.component.html',
  styleUrl: './raster-text.component.css',
})
export class RasterTextComponent implements OnInit, OnDestroy {
  private readonly fontsApi = inject(FontLibraryApiService);
  private readonly rasterApi = inject(RasterTextApiService);
  private readonly i18n = inject(I18nService);
  private debounceHandle?: ReturnType<typeof setTimeout>;
  private requestSequence = 0;

  protected fonts: FontSummary[] = [];
  protected loadingFonts = true;
  protected uploading = false;
  protected deletingFontId?: string;

  protected text = '';
  protected fontId = '';
  protected fontSizePx = DEFAULT_FONT_SIZE_PX;
  protected bold = false;
  protected lineSpacing = DEFAULT_LINE_SPACING;
  protected align: Alignment = 'left';
  protected mode: RasterTextMode = 'antialiased';
  protected thresholdPercent = DEFAULT_THRESHOLD_PERCENT;
  protected ditherAlgorithm: DitherAlgorithm = 'floydSteinberg';
  protected allowMissingGlyphs = false;

  protected previewing = false;
  protected printing = false;
  protected cutting = false;
  protected preview?: RasterTextPreview;
  protected previewError?: string;

  protected readonly fontSizePresets = FONT_SIZE_PRESETS_PX;
  protected readonly minFontSizePx = MIN_FONT_SIZE_PX;
  protected readonly maxFontSizePx = MAX_FONT_SIZE_PX;
  protected readonly minThresholdPercent = MIN_THRESHOLD_PERCENT;
  protected readonly maxThresholdPercent = MAX_THRESHOLD_PERCENT;
  protected readonly minLineSpacing = MIN_LINE_SPACING;
  protected readonly maxLineSpacing = MAX_LINE_SPACING;

  protected alignmentOptions() {
    return ALIGNMENT_OPTIONS.map((option) => ({ ...option, label: this.i18n.t(option.labelKey) }));
  }
  protected modeOptions() {
    return MODE_OPTIONS.map((option) => ({ ...option, label: this.i18n.t(option.labelKey) }));
  }
  protected ditherAlgorithmOptions() {
    return DITHER_ALGORITHM_OPTIONS.map((option) => ({ ...option, label: this.i18n.t(option.labelKey) }));
  }

  async ngOnInit(): Promise<void> {
    await this.reloadFonts(true);
  }

  ngOnDestroy(): void {
    if (this.debounceHandle !== undefined) clearTimeout(this.debounceHandle);
  }

  protected selectedFont(): FontSummary | undefined {
    return this.fonts.find((font) => font.id === this.fontId);
  }

  protected schedulePreview(): void {
    if (this.debounceHandle !== undefined) clearTimeout(this.debounceHandle);
    this.debounceHandle = setTimeout(() => void this.runPreview(), PREVIEW_DEBOUNCE_MS);
  }

  protected async onFontUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || file.size > MAX_UPLOAD_BYTES) return;
    this.uploading = true;
    try {
      const font = await this.fontsApi.upload(file);
      this.fonts = [...this.fonts, font];
      this.fontId = font.id;
      this.schedulePreview();
    } catch {
      // notification already shown by the API service
    } finally {
      this.uploading = false;
    }
  }

  protected async deleteFont(font: FontSummary): Promise<void> {
    if (font.builtIn || this.deletingFontId) return;
    this.deletingFontId = font.id;
    try {
      await this.fontsApi.delete(font.id);
      this.fonts = this.fonts.filter((entry) => entry.id !== font.id);
      if (this.fontId === font.id) {
        this.fontId = this.fonts[0]?.id ?? '';
        this.schedulePreview();
      }
    } catch {
      // notification already shown by the API service
    } finally {
      this.deletingFontId = undefined;
    }
  }

  protected async print(cut: boolean): Promise<void> {
    if (!this.canRender() || this.printing) return;
    this.printing = true;
    this.cutting = cut;
    try {
      await this.rasterApi.print({ ...this.buildRequest(), initialize: true, cut });
    } finally {
      this.printing = false;
      this.cutting = false;
    }
  }

  protected canRender(): boolean {
    return this.text.trim().length > 0 && this.fontId.length > 0;
  }

  private async reloadFonts(selectDefault: boolean): Promise<void> {
    this.loadingFonts = true;
    try {
      this.fonts = await this.fontsApi.list();
      if (selectDefault && !this.fontId) {
        this.fontId = this.fonts.find((font) => font.builtIn)?.id ?? this.fonts[0]?.id ?? '';
      }
      if (this.fontId) this.schedulePreview();
    } finally {
      this.loadingFonts = false;
    }
  }

  private buildRequest() {
    return {
      text: this.text,
      fontId: this.fontId,
      fontSizePx: this.fontSizePx,
      bold: this.bold,
      lineSpacing: this.lineSpacing,
      align: this.align,
      mode: this.mode,
      thresholdPercent: this.thresholdPercent,
      ditherAlgorithm: this.ditherAlgorithm,
      allowMissingGlyphs: this.allowMissingGlyphs,
    };
  }

  private async runPreview(): Promise<void> {
    if (!this.canRender()) {
      this.preview = undefined;
      this.previewError = undefined;
      return;
    }
    const sequence = ++this.requestSequence;
    this.previewing = true;
    try {
      const result = await this.rasterApi.preview(this.buildRequest());
      if (sequence !== this.requestSequence) return;
      this.preview = result;
      this.previewError = undefined;
    } catch (error) {
      if (sequence !== this.requestSequence) return;
      this.preview = undefined;
      this.previewError =
        error instanceof HttpErrorResponse
          ? errorDetail(error, this.i18n.t('notification.unknownError'))
          : this.i18n.t('notification.unknownError');
    } finally {
      if (sequence === this.requestSequence) this.previewing = false;
    }
  }
}
