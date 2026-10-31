import { TestBed } from '@angular/core/testing';
import { FontLibraryApiService } from './font-library-api.service';
import { PrinterHttpClient } from './printer-http.client';
import { PrinterNotificationService } from './printer-notification.service';
import { I18nService } from './i18n.service';
import { FontSummary } from './raster-text.models';

function fakeFont(overrides: Partial<FontSummary> = {}): FontSummary {
  return {
    id: 'font-1',
    displayName: 'Geist Mono',
    originalFilename: 'GeistMono-Regular.ttf',
    familyName: 'Geist Mono',
    format: 'ttf',
    builtIn: false,
    hasBold: false,
    sizeBytes: 1024,
    uploadedAt: '2026-01-01T00:00:00.000Z',
    coverage: { ok: true, missingCharacters: [] },
    ...overrides,
  };
}

describe('FontLibraryApiService', () => {
  const http = { get: vi.fn(), postForm: vi.fn(), delete: vi.fn() };
  const notifications = { success: vi.fn(), failure: vi.fn() };
  const i18n = { t: vi.fn((key: string) => key) };

  let service: FontLibraryApiService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        FontLibraryApiService,
        { provide: PrinterHttpClient, useValue: http },
        { provide: PrinterNotificationService, useValue: notifications },
        { provide: I18nService, useValue: i18n },
      ],
    });
    service = TestBed.inject(FontLibraryApiService);
  });

  it('unwraps the fonts array from the list response', async () => {
    const font = fakeFont();
    http.get.mockResolvedValueOnce({ fonts: [font] });

    await expect(service.list()).resolves.toEqual([font]);
    expect(http.get).toHaveBeenCalledWith('/fonts');
  });

  it('uploads a font as multipart form data and reports success', async () => {
    const font = fakeFont({ id: 'font-2' });
    http.postForm.mockResolvedValueOnce(font);
    const file = new File([new Uint8Array([0, 1, 2])], 'Courier New PSMT Regular.ttf');

    const result = await service.upload(file);

    expect(result).toBe(font);
    const [path, body] = http.postForm.mock.calls[0];
    expect(path).toBe('/fonts');
    expect(body).toBeInstanceOf(FormData);
    const uploadedFile = (body as FormData).get('file') as File;
    expect(uploadedFile.name).toBe(file.name);
    expect(uploadedFile.size).toBe(file.size);
    expect((body as FormData).has('displayName')).toBe(false);
    expect(notifications.success).toHaveBeenCalled();
  });

  it('includes displayName in the upload form only when provided', async () => {
    http.postForm.mockResolvedValueOnce(fakeFont());
    const file = new File([new Uint8Array([0])], 'font.ttf');

    await service.upload(file, 'My Font');

    const body = http.postForm.mock.calls[0][1] as FormData;
    expect(body.get('displayName')).toBe('My Font');
  });

  it('reports a notification and rethrows on upload failure', async () => {
    const error = new Error('too big');
    http.postForm.mockRejectedValueOnce(error);
    const file = new File([new Uint8Array([0])], 'font.ttf');

    await expect(service.upload(file)).rejects.toBe(error);
    expect(notifications.failure).toHaveBeenCalled();
  });

  it('deletes a font by URL-encoded id and reports success', async () => {
    http.delete.mockResolvedValueOnce(undefined);

    await service.delete('font with spaces');

    expect(http.delete).toHaveBeenCalledWith('/fonts/font%20with%20spaces');
    expect(notifications.success).toHaveBeenCalled();
  });

  it('reports a notification and rethrows on delete failure', async () => {
    const error = new Error('in use');
    http.delete.mockRejectedValueOnce(error);

    await expect(service.delete('font-1')).rejects.toBe(error);
    expect(notifications.failure).toHaveBeenCalled();
  });
});
