import { AfterViewInit, Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { PrinterApiService } from '../../core/printer-api.service';
import { Alignment, RasterScale } from '../../core/printer.models';
import { ALIGNMENT_OPTIONS, PAPER_OPTIONS } from '../../shared/printer-options';
import {
  bytesToBase64,
  ColorAdjustments,
  DitherMethod,
  MonochromeRaster,
  rasterizeMonochrome,
} from './image-processor';
import {
  defaultAdjustments,
  FitMode,
  loadImage,
  outputDimensions,
  rasterWidthScale,
} from './image-layout';
import {
  ADJUSTMENT_CONTROLS,
  AdjustmentKey,
  DITHER_OPTIONS,
  FIT_OPTIONS,
  RASTER_SCALE_OPTIONS,
} from './image-options';

@Component({
  imports: [FormsModule, ButtonModule, CheckboxModule, SelectModule],
  templateUrl: './image.component.html',
  styleUrl: './image.component.css',
})
export class ImageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('previewCanvas') private previewCanvas?: ElementRef<HTMLCanvasElement>;
  private readonly api = inject(PrinterApiService);
  private renderFrame?: number;
  protected sourceImage?: HTMLImageElement;
  protected sourceName = '';
  protected dragging = false;
  protected processing = false;
  protected printing = false;
  protected cutting = false;
  protected raster?: MonochromeRaster;
  protected paperWidth = 576;
  protected fitMode: FitMode = 'fit';
  protected alignment: Alignment = 'center';
  protected scale: RasterScale = 'normal';
  protected dither: DitherMethod = 'floydSteinberg';
  protected adjustments: ColorAdjustments = defaultAdjustments();
  protected readonly adjustmentControls = ADJUSTMENT_CONTROLS;
  protected readonly ditherOptions = DITHER_OPTIONS;
  protected readonly fitOptions = FIT_OPTIONS;
  protected readonly paperOptions = [...PAPER_OPTIONS].reverse().map((option) => ({
    label: `${option.label} · ${option.dots} pkt`,
    dots: option.dots,
  }));
  protected readonly alignmentOptions = ALIGNMENT_OPTIONS;
  protected readonly scaleOptions = RASTER_SCALE_OPTIONS;

  ngAfterViewInit(): void {
    if (this.sourceImage) this.scheduleRender();
  }
  ngOnDestroy(): void {
    if (this.renderFrame !== undefined) cancelAnimationFrame(this.renderFrame);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging = true;
  }
  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) void this.loadFile(file);
  }
  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) void this.loadFile(file);
    input.value = '';
  }
  protected resetAdjustments(): void {
    this.adjustments = defaultAdjustments();
    this.dither = 'floydSteinberg';
    this.scheduleRender();
  }
  protected resetAdjustment(key: AdjustmentKey): void {
    this.adjustments[key] = defaultAdjustments()[key];
    this.scheduleRender();
  }
  protected setFit(mode: FitMode): void {
    this.fitMode = mode;
    this.scheduleRender();
  }
  protected adjustmentLabel(key: AdjustmentKey): string {
    const value = this.adjustments[key];
    return key === 'gamma'
      ? value.toFixed(1)
      : key === 'threshold'
        ? String(value)
        : `${value > 0 ? '+' : ''}${value}${key === 'hue' ? '°' : '%'}`;
  }
  protected previewWidthPercent(): number {
    return this.raster
      ? (this.raster.width / this.paperWidth) * 100 * rasterWidthScale(this.scale)
      : 100;
  }
  protected effectiveWidth(): number {
    return (this.raster?.width ?? 0) * rasterWidthScale(this.scale);
  }
  protected blackPercent(): string {
    return ((this.raster?.blackRatio ?? 0) * 100).toFixed(1);
  }

  protected scheduleRender(): void {
    if (!this.sourceImage || !this.previewCanvas) return;
    if (this.renderFrame !== undefined) cancelAnimationFrame(this.renderFrame);
    this.processing = true;
    this.renderFrame = requestAnimationFrame(() => {
      this.renderFrame = undefined;
      this.render();
    });
  }

  protected async print(cut: boolean): Promise<void> {
    if (!this.raster || this.printing) return;
    this.printing = true;
    this.cutting = cut;
    try {
      await this.api.printRaster({
        data: bytesToBase64(this.raster.bytes),
        widthBytes: this.raster.widthBytes,
        height: this.raster.height,
        alignment: this.alignment,
        scale: this.scale,
        initialize: true,
        cut,
      });
    } finally {
      this.printing = false;
      this.cutting = false;
    }
  }

  private async loadFile(file: File): Promise<void> {
    if (!file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) return;
    const url = URL.createObjectURL(file);
    try {
      const loaded = await loadImage(url);
      this.sourceImage = loaded;
      this.sourceName = file.name;
      this.scheduleRender();
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  private render(): void {
    const source = this.sourceImage;
    const canvas = this.previewCanvas?.nativeElement;
    if (!source || !canvas) {
      this.processing = false;
      return;
    }
    const dimensions = outputDimensions(
      source.naturalWidth,
      source.naturalHeight,
      this.paperWidth,
      this.fitMode,
    );
    const work = document.createElement('canvas');
    work.width = dimensions.width;
    work.height = dimensions.height;
    const context = work.getContext('2d', { willReadFrequently: true });
    if (!context) {
      this.processing = false;
      return;
    }
    context.fillStyle = '#fff';
    context.fillRect(0, 0, work.width, work.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, work.width, work.height);
    this.raster = rasterizeMonochrome(
      context.getImageData(0, 0, work.width, work.height),
      this.adjustments,
      this.dither,
    );
    canvas.width = this.raster.width;
    canvas.height = this.raster.height;
    const previewContext = canvas.getContext('2d');
    if (previewContext) {
      const preview = previewContext.createImageData(this.raster.width, this.raster.height);
      preview.data.set(this.raster.pixels);
      previewContext.putImageData(preview, 0, 0);
    }
    this.processing = false;
  }
}
