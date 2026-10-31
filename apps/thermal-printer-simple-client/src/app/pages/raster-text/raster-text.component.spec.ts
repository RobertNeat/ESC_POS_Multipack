import { TestBed } from '@angular/core/testing';
import { RasterTextComponent } from './raster-text.component';
import { FontLibraryApiService } from '../../core/font-library-api.service';
import { RasterTextApiService } from '../../core/raster-text-api.service';
import { I18nService } from '../../core/i18n.service';
import { FontSummary, RasterTextPreview } from '../../core/raster-text.models';

function fakeFont(overrides: Partial<FontSummary> = {}): FontSummary {
  return {
    id: 'built-in-geist-mono',
    displayName: 'Geist Mono',
    originalFilename: 'GeistMono-Regular.ttf',
    familyName: 'Geist Mono',
    format: 'ttf',
    builtIn: true,
    hasBold: true,
    sizeBytes: 1024,
    uploadedAt: '1970-01-01T00:00:00.000Z',
    coverage: { ok: true, missingCharacters: [] },
    ...overrides,
  };
}

function fakePreview(overrides: Partial<RasterTextPreview> = {}): RasterTextPreview {
  return {
    pngBase64: 'abc',
    widthDots: 576,
    heightDots: 22,
    lineCount: 1,
    missingCharacters: [],
    ...overrides,
  };
}

describe('RasterTextComponent', () => {
  const fontsApi = { list: vi.fn(), upload: vi.fn(), delete: vi.fn() };
  const rasterApi = { preview: vi.fn(), print: vi.fn() };
  const i18n = { t: vi.fn((key: string) => key) };

  function createComponent(): RasterTextComponent {
    TestBed.configureTestingModule({
      providers: [
        { provide: FontLibraryApiService, useValue: fontsApi },
        { provide: RasterTextApiService, useValue: rasterApi },
        { provide: I18nService, useValue: i18n },
      ],
    });
    return TestBed.createComponent(RasterTextComponent).componentInstance;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    fontsApi.list.mockResolvedValue([fakeFont()]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('selects the built-in font by default once fonts load', async () => {
    rasterApi.preview.mockResolvedValue(fakePreview());
    const component = createComponent();

    await component.ngOnInit();

    expect(component['fontId']).toBe('built-in-geist-mono');
    expect(component['loadingFonts']).toBe(false);
  });

  it('does not render until both text and a font are present', async () => {
    fontsApi.list.mockResolvedValueOnce([]);
    const component = createComponent();

    await component.ngOnInit();

    expect(component['canRender']()).toBe(false);

    component['text'] = 'hello';
    expect(component['canRender']()).toBe(false);

    component['fontId'] = 'built-in-geist-mono';
    expect(component['canRender']()).toBe(true);
  });

  it('debounces preview requests so only the last one fires', async () => {
    rasterApi.preview.mockResolvedValue(fakePreview());
    const component = createComponent();
    await component.ngOnInit();
    rasterApi.preview.mockClear();

    component['text'] = 'a';
    component['schedulePreview']();
    component['text'] = 'ab';
    component['schedulePreview']();
    component['text'] = 'abc';
    component['schedulePreview']();

    await vi.advanceTimersByTimeAsync(300);

    expect(rasterApi.preview).toHaveBeenCalledTimes(1);
    expect(rasterApi.preview).toHaveBeenCalledWith(expect.objectContaining({ text: 'abc' }));
  });

  it('ignores a stale preview response that resolves after a newer request', async () => {
    const component = createComponent();
    await component.ngOnInit();

    let resolveFirst!: (value: RasterTextPreview) => void;
    rasterApi.preview.mockImplementationOnce(
      () => new Promise<RasterTextPreview>((resolve) => (resolveFirst = resolve)),
    );
    component['text'] = 'first';
    component['schedulePreview']();
    await vi.advanceTimersByTimeAsync(300);

    rasterApi.preview.mockResolvedValueOnce(fakePreview({ lineCount: 2 }));
    component['text'] = 'second';
    component['schedulePreview']();
    await vi.advanceTimersByTimeAsync(300);

    resolveFirst(fakePreview({ lineCount: 99 }));
    await Promise.resolve();
    await Promise.resolve();

    expect(component['preview']?.lineCount).toBe(2);
  });

  it('surfaces a preview error inline instead of throwing', async () => {
    const component = createComponent();
    await component.ngOnInit();

    rasterApi.preview.mockRejectedValueOnce(new Error('missing glyphs'));
    component['text'] = 'bad text';
    component['schedulePreview']();
    await vi.advanceTimersByTimeAsync(300);
    await Promise.resolve();

    expect(component['preview']).toBeUndefined();
    expect(component['previewError']).toBeDefined();
  });

  it('adds an uploaded font to the list and selects it', async () => {
    rasterApi.preview.mockResolvedValue(fakePreview());
    const component = createComponent();
    await component.ngOnInit();

    const uploaded = fakeFont({ id: 'font-2', displayName: 'Courier New', builtIn: false });
    fontsApi.upload.mockResolvedValueOnce(uploaded);
    const file = new File([new Uint8Array([0])], 'Courier New PSMT Regular.ttf');
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    await component['onFontUpload'](event);

    expect(component['fonts']).toContainEqual(uploaded);
    expect(component['fontId']).toBe('font-2');
  });

  it('removes a deleted font from the list and falls back to another font', async () => {
    const builtIn = fakeFont();
    const uploaded = fakeFont({ id: 'font-2', displayName: 'Courier New', builtIn: false });
    fontsApi.list.mockResolvedValueOnce([builtIn, uploaded]);
    rasterApi.preview.mockResolvedValue(fakePreview());
    const component = createComponent();
    await component.ngOnInit();
    component['fontId'] = 'font-2';

    fontsApi.delete.mockResolvedValueOnce(undefined);
    await component['deleteFont'](uploaded);

    expect(component['fonts']).toEqual([builtIn]);
    expect(component['fontId']).toBe('built-in-geist-mono');
  });

  it('refuses to delete a built-in font', async () => {
    rasterApi.preview.mockResolvedValue(fakePreview());
    const component = createComponent();
    await component.ngOnInit();

    await component['deleteFont'](fakeFont());

    expect(fontsApi.delete).not.toHaveBeenCalled();
  });

  it('does not print when nothing can be rendered', async () => {
    fontsApi.list.mockResolvedValueOnce([]);
    const component = createComponent();
    await component.ngOnInit();

    await component['print'](false);

    expect(rasterApi.print).not.toHaveBeenCalled();
  });

  it('prints with the current form state and cut flag', async () => {
    rasterApi.preview.mockResolvedValue(fakePreview());
    rasterApi.print.mockResolvedValueOnce({ status: 'ok', processed: 1 });
    const component = createComponent();
    await component.ngOnInit();
    component['text'] = 'hello';

    await component['print'](true);

    expect(rasterApi.print).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'hello', initialize: true, cut: true }),
    );
    expect(component['printing']).toBe(false);
  });
});
