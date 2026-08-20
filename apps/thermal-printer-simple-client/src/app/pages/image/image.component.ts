import { AfterViewInit, Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { PrinterApiService } from '../../core/printer-api.service';
import { Alignment, RasterScale } from '../../core/printer.models';
import {
  bytesToBase64,
  ColorAdjustments,
  DitherMethod,
  MonochromeRaster,
  rasterizeMonochrome,
} from './image-processor';

type FitMode = 'original' | 'shrink' | 'fit' | 'stretch' | 'double';

@Component({
  imports: [FormsModule, ButtonModule, CheckboxModule, SelectModule],
  template: `
    <div class="page-head">
      <div><p class="eyebrow">Raster ESC/POS</p><h1>Drukowanie obrazu</h1><p class="lead">Dostosuj kolor, wybierz dithering i wyślij gotową bitmapę 1-bit bezpośrednio do drukarki.</p></div>
      @if (sourceName) { <span class="badge"><i class="pi pi-image"></i>{{ sourceName }}</span> }
    </div>

    <div class="image-workspace">
      <section class="controls">
        <div class="panel panel-pad upload" [class.dragging]="dragging" (dragover)="onDragOver($event)" (dragleave)="dragging=false" (drop)="onDrop($event)">
          <input #fileInput type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp" (change)="onFileSelected($event)" hidden>
          <div class="upload-icon"><i class="pi pi-upload"></i></div>
          <div><h2 class="section-title">Obraz źródłowy</h2><p class="section-subtitle">PNG, JPEG, WebP, GIF lub BMP · maks. 20 MB</p></div>
          <p-button [label]="sourceImage ? 'Zmień obraz' : 'Wybierz obraz'" icon="pi pi-folder-open" severity="secondary" [outlined]="true" (onClick)="fileInput.click()" />
        </div>

        @if (sourceImage) {
          <div class="panel panel-pad settings">
            <div class="section-row"><div><h2 class="section-title">Korekcja obrazu</h2><p class="section-subtitle">Zmiany są od razu widoczne na symulowanym papierze</p></div><button class="text-button" type="button" (click)="resetAdjustments()">Resetuj</button></div>
            <div class="sliders">
              @for (control of adjustmentControls; track control.key) {
                <div class="slider-control"><span><label [for]="'adjustment-' + control.key">{{ control.label }}</label><button type="button" class="value-reset" title="Kliknij, aby przywrócić wartość domyślną" [attr.aria-label]="'Resetuj: ' + control.label" (click)="resetAdjustment(control.key)"><output [for]="'adjustment-' + control.key">{{ adjustmentLabel(control.key) }}</output></button></span><input [id]="'adjustment-' + control.key" type="range" [min]="control.min" [max]="control.max" [step]="control.step" [(ngModel)]="adjustments[control.key]" (input)="scheduleRender()"></div>
              }
            </div>
            <div class="inline-options">
              <label class="check"><p-checkbox [(ngModel)]="adjustments.invert" [binary]="true" inputId="invert" (onChange)="scheduleRender()" /><span>Odwróć czerń i biel</span></label>
              <div class="field"><label for="dither">Dithering</label><p-select inputId="dither" [options]="ditherOptions" [(ngModel)]="dither" optionLabel="label" optionValue="value" (onChange)="scheduleRender()" /></div>
            </div>
          </div>

          <div class="panel panel-pad settings">
            <h2 class="section-title">Dopasowanie do papieru</h2><p class="section-subtitle">Rozmiar wyjściowy jest liczony w punktach drukarki (203 dpi)</p>
            <div class="choice-grid fit-grid">
              @for (option of fitOptions; track option.value) {
                <button type="button" [class.active]="fitMode===option.value" (click)="setFit(option.value)"><i [class]="option.icon"></i><strong>{{ option.label }}</strong><small>{{ option.description }}</small></button>
              }
            </div>
            <div class="print-options">
              <div class="field"><label for="paper">Papier</label><p-select inputId="paper" [options]="paperOptions" [(ngModel)]="paperWidth" optionLabel="label" optionValue="dots" (onChange)="scheduleRender()" /></div>
              <div class="field"><label for="alignment">Wyrównanie</label><p-select inputId="alignment" [options]="alignmentOptions" [(ngModel)]="alignment" optionLabel="label" optionValue="value" /></div>
              <div class="field"><label for="scale">Skala ESC/POS</label><p-select inputId="scale" [options]="scaleOptions" [(ngModel)]="scale" optionLabel="label" optionValue="value" /></div>
            </div>
          </div>
        }
      </section>

      <aside class="preview-column">
        <div class="panel preview-panel">
          <div class="preview-head"><div><h2 class="section-title">Podgląd wydruku</h2><p class="section-subtitle">Dokładny raster 1-bit wysyłany do urządzenia</p></div>@if(processing){<i class="pi pi-spin pi-spinner"></i>}</div>
          <div class="preview-stage">
            <div class="preview-paper" [class.align-left]="alignment==='left'" [class.align-right]="alignment==='right'">
              @if (!sourceImage) { <div class="empty"><i class="pi pi-image"></i><strong>Wczytaj obraz</strong><span>Tutaj pojawi się podgląd ditheringu</span></div> }
              <canvas #previewCanvas [hidden]="!sourceImage" [style.width.%]="previewWidthPercent()"></canvas>
            </div>
          </div>
          @if (raster) {
            <div class="raster-meta"><span><strong>{{ raster.width }} × {{ raster.height }}</strong> punktów</span><span><strong>{{ raster.bytes.length }}</strong> B</span><span><strong>{{ blackPercent() }}%</strong> czerni</span></div>
            @if (effectiveWidth() > paperWidth) { <div class="notice warning"><i class="pi pi-exclamation-triangle"></i> Szerokość po skali ({{ effectiveWidth() }} pkt) przekracza papier {{ paperWidth }} pkt i zostanie przycięta przez drukarkę.</div> }
            <div class="print-actions">
              <p-button label="Drukuj" icon="pi pi-print" [loading]="printing && !cutting" [disabled]="processing || printing" (onClick)="print(false)" />
              <p-button label="Drukuj i utnij" icon="pi pi-minus" severity="secondary" [outlined]="true" [loading]="cutting" [disabled]="processing || printing" (onClick)="print(true)" />
            </div>
          }
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .image-workspace{display:grid;grid-template-columns:minmax(0,1fr) minmax(390px,520px);gap:26px;align-items:start}.controls{display:grid;gap:16px}.upload{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;border-style:dashed}.upload.dragging{border-color:var(--accent);background:var(--accent-soft)}.upload-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:11px;background:var(--surface-2);color:var(--accent)}.upload .section-subtitle{margin:0}.settings{display:grid;gap:18px}.section-row{display:flex;justify-content:space-between;gap:20px}.text-button{align-self:start;border:0;background:transparent;color:var(--accent);font-size:11px;font-weight:700;cursor:pointer}.sliders{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:17px 24px}.slider-control{display:grid;gap:7px;color:#4e4f4a;font-size:11px;font-weight:700}.slider-control>span{display:flex;align-items:center;justify-content:space-between}.value-reset{margin:-4px;padding:4px;border:0;border-radius:5px;background:transparent;color:var(--accent);font:600 10px var(--mono);cursor:pointer}.value-reset:hover{background:var(--accent-soft)}input[type=range]{width:100%;accent-color:var(--accent)}.inline-options{display:grid;grid-template-columns:1fr 220px;align-items:end;gap:20px;padding-top:2px}.check{display:flex;align-items:center;gap:9px;padding-bottom:9px;color:#4e4f4a;font-size:12px;font-weight:650}.choice-grid{display:grid;gap:8px}.fit-grid{grid-template-columns:repeat(5,minmax(0,1fr))}.choice-grid button{min-height:94px;padding:12px 8px;border:1px solid var(--line);border-radius:10px;background:white;color:var(--ink);cursor:pointer;text-align:center}.choice-grid button:hover{border-color:#c8a092}.choice-grid button.active{border-color:var(--accent);background:var(--accent-soft);box-shadow:0 0 0 1px var(--accent)}.choice-grid i,.choice-grid strong,.choice-grid small{display:block}.choice-grid i{margin-bottom:8px;color:var(--accent)}.choice-grid strong{font-size:10px}.choice-grid small{margin-top:4px;color:var(--muted);font-size:8px;line-height:1.3}.print-options{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.preview-column{position:sticky;top:98px}.preview-panel{overflow:hidden}.preview-head{padding:22px 24px 0;display:flex;justify-content:space-between}.preview-stage{margin-top:4px;padding:28px;background:#e9e9e4;border-block:1px solid var(--line)}.preview-paper{width:100%;min-height:470px;display:flex;justify-content:center;align-items:flex-start;overflow:hidden;padding:26px 0 60px;background:#fffef9;box-shadow:0 16px 35px rgba(40,38,32,.13);position:relative}.preview-paper.align-left{justify-content:flex-start}.preview-paper.align-right{justify-content:flex-end}.preview-paper:after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:18px;background:linear-gradient(135deg,transparent 7px,#e9e9e4 0) 0 0/14px 14px repeat-x}.preview-paper canvas{height:auto;image-rendering:pixelated;flex:none}.empty{margin:auto;display:grid;justify-items:center;gap:8px;color:var(--muted)}.empty i{font-size:30px}.empty strong{font-size:13px}.empty span{font-size:10px}.raster-meta{display:flex;justify-content:space-around;gap:12px;padding:17px 24px;color:var(--muted);font-size:10px;border-bottom:1px solid var(--line)}.raster-meta strong{color:var(--ink);font-family:var(--mono)}.warning{margin:16px 22px 0;border-color:#d49a36;background:#fff8e5;color:#795b22}.warning i{margin-right:6px}.print-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:20px 24px}.print-actions p-button::ng-deep button{width:100%}@media(max-width:1050px){.image-workspace{grid-template-columns:1fr}.preview-column{position:static}.fit-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:620px){.upload{grid-template-columns:auto 1fr}.upload p-button{grid-column:1/-1}.sliders,.inline-options,.print-options{grid-template-columns:1fr}.fit-grid{grid-template-columns:repeat(2,1fr)}.print-actions{grid-template-columns:1fr}}
  `],
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
  protected readonly adjustmentControls: Array<{ key: Exclude<keyof ColorAdjustments, 'invert'>; label: string; min: number; max: number; step: number }> = [
    { key: 'brightness', label: 'Jasność', min: -100, max: 100, step: 1 },
    { key: 'contrast', label: 'Kontrast', min: -100, max: 100, step: 1 },
    { key: 'saturation', label: 'Nasycenie', min: -100, max: 100, step: 1 },
    { key: 'gamma', label: 'Gamma', min: 0.2, max: 3, step: 0.1 },
    { key: 'hue', label: 'Odcień', min: -180, max: 180, step: 1 },
    { key: 'threshold', label: 'Próg czerni', min: 0, max: 255, step: 1 },
  ];
  protected readonly ditherOptions = [
    { label: 'Bez ditheringu', value: 'none' }, { label: 'Floyd–Steinberg', value: 'floydSteinberg' },
    { label: 'Atkinson', value: 'atkinson' }, { label: 'Stucki', value: 'stucki' },
    { label: 'Burkes', value: 'burkes' }, { label: 'Sierra Lite', value: 'sierraLite' },
  ];
  protected readonly fitOptions: Array<{ value: FitMode; label: string; description: string; icon: string }> = [
    { value: 'original', label: '1:1', description: 'Oryginalna liczba pikseli', icon: 'pi pi-stop' },
    { value: 'shrink', label: 'Zmniejsz', description: 'Tylko gdy obraz jest za szeroki', icon: 'pi pi-arrow-down-right' },
    { value: 'fit', label: 'Dopasuj', description: 'Pełna szerokość, zachowaj proporcje', icon: 'pi pi-expand' },
    { value: 'stretch', label: 'Rozciągnij', description: 'Pełna szerokość, stała wysokość', icon: 'pi pi-arrows-h' },
    { value: 'double', label: 'Powiększ 2×', description: 'Dwa punkty na piksel', icon: 'pi pi-search-plus' },
  ];
  protected readonly paperOptions = [{ label: '80 mm · 576 pkt', dots: 576 }, { label: '58 mm · 384 pkt', dots: 384 }];
  protected readonly alignmentOptions = [{ label: 'Do lewej', value: 'left' }, { label: 'Wyśrodkuj', value: 'center' }, { label: 'Do prawej', value: 'right' }];
  protected readonly scaleOptions = [{ label: 'Normalna', value: 'normal' }, { label: '2× szerokość', value: 'doubleWidth' }, { label: '2× wysokość', value: 'doubleHeight' }, { label: '2× oba wymiary', value: 'quadruple' }];

  ngAfterViewInit(): void { if (this.sourceImage) this.scheduleRender(); }
  ngOnDestroy(): void { if (this.renderFrame !== undefined) cancelAnimationFrame(this.renderFrame); }

  protected onDragOver(event: DragEvent): void { event.preventDefault(); this.dragging = true; }
  protected onDrop(event: DragEvent): void { event.preventDefault(); this.dragging = false; const file = event.dataTransfer?.files[0]; if (file) void this.loadFile(file); }
  protected onFileSelected(event: Event): void { const input = event.target as HTMLInputElement; const file = input.files?.[0]; if (file) void this.loadFile(file); input.value = ''; }
  protected resetAdjustments(): void { this.adjustments = defaultAdjustments(); this.dither = 'floydSteinberg'; this.scheduleRender(); }
  protected resetAdjustment(key: Exclude<keyof ColorAdjustments, 'invert'>): void { this.adjustments[key] = defaultAdjustments()[key]; this.scheduleRender(); }
  protected setFit(mode: FitMode): void { this.fitMode = mode; this.scheduleRender(); }
  protected adjustmentLabel(key: Exclude<keyof ColorAdjustments, 'invert'>): string { const value = this.adjustments[key]; return key === 'gamma' ? value.toFixed(1) : key === 'threshold' ? String(value) : `${value > 0 ? '+' : ''}${value}${key === 'hue' ? '°' : '%'}`; }
  protected previewWidthPercent(): number { return this.raster ? (this.raster.width / this.paperWidth) * 100 * widthScale(this.scale) : 100; }
  protected effectiveWidth(): number { return (this.raster?.width ?? 0) * widthScale(this.scale); }
  protected blackPercent(): string { return ((this.raster?.blackRatio ?? 0) * 100).toFixed(1); }

  protected scheduleRender(): void {
    if (!this.sourceImage || !this.previewCanvas) return;
    if (this.renderFrame !== undefined) cancelAnimationFrame(this.renderFrame);
    this.processing = true;
    this.renderFrame = requestAnimationFrame(() => { this.renderFrame = undefined; this.render(); });
  }

  protected async print(cut: boolean): Promise<void> {
    if (!this.raster || this.printing) return;
    this.printing = true; this.cutting = cut;
    try {
      await this.api.printRaster({ data: bytesToBase64(this.raster.bytes), widthBytes: this.raster.widthBytes, height: this.raster.height, alignment: this.alignment, scale: this.scale, initialize: true, cut });
    } finally { this.printing = false; this.cutting = false; }
  }

  private async loadFile(file: File): Promise<void> {
    if (!file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) return;
    const url = URL.createObjectURL(file);
    try {
      const loaded = await loadImage(url);
      this.sourceImage = loaded; this.sourceName = file.name; this.scheduleRender();
    } finally { URL.revokeObjectURL(url); }
  }

  private render(): void {
    const source = this.sourceImage;
    const canvas = this.previewCanvas?.nativeElement;
    if (!source || !canvas) { this.processing = false; return; }
    const dimensions = outputDimensions(source.naturalWidth, source.naturalHeight, this.paperWidth, this.fitMode);
    const work = document.createElement('canvas'); work.width = dimensions.width; work.height = dimensions.height;
    const context = work.getContext('2d', { willReadFrequently: true });
    if (!context) { this.processing = false; return; }
    context.fillStyle = '#fff'; context.fillRect(0, 0, work.width, work.height);
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, work.width, work.height);
    this.raster = rasterizeMonochrome(context.getImageData(0, 0, work.width, work.height), this.adjustments, this.dither);
    canvas.width = this.raster.width; canvas.height = this.raster.height;
    const previewContext = canvas.getContext('2d');
    if (previewContext) {
      const preview = previewContext.createImageData(
        this.raster.width,
        this.raster.height,
      );
      preview.data.set(this.raster.pixels);
      previewContext.putImageData(preview, 0, 0);
    }
    this.processing = false;
  }
}

function defaultAdjustments(): ColorAdjustments { return { brightness: 0, contrast: 0, saturation: 0, gamma: 1, hue: 0, threshold: 128, invert: false }; }
function loadImage(url: string): Promise<HTMLImageElement> { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('Nie udało się odczytać obrazu.')); image.src = url; }); }
function widthScale(scale: RasterScale): number { return scale === 'doubleWidth' || scale === 'quadruple' ? 2 : 1; }
function outputDimensions(width: number, height: number, paper: number, mode: FitMode): { width: number; height: number } {
  let outputWidth = width; let outputHeight = height;
  if (mode === 'fit') { outputWidth = paper; outputHeight = height * (paper / width); }
  if (mode === 'shrink' && width > paper) { outputWidth = paper; outputHeight = height * (paper / width); }
  if (mode === 'stretch') outputWidth = paper;
  if (mode === 'double') { outputWidth = width * 2; outputHeight = height * 2; }
  const limit = Math.min(1, 1024 / outputWidth, 4095 / outputHeight);
  return { width: Math.max(1, Math.round(outputWidth * limit)), height: Math.max(1, Math.round(outputHeight * limit)) };
}
