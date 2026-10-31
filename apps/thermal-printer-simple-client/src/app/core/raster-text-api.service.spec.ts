import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { RasterTextApiService } from './raster-text-api.service';
import { PrinterHttpClient } from './printer-http.client';
import { PrinterNotificationService } from './printer-notification.service';
import { PrinterSessionService } from './printer-session.service';
import { I18nService } from './i18n.service';
import { PrintRasterTextRequest, RenderRasterTextRequest } from './raster-text.models';

function fakeRequest(): RenderRasterTextRequest {
  return {
    text: 'Zażółć gęślą jaźń',
    fontId: 'built-in-geist-mono',
    fontSizePx: 18,
    bold: false,
    lineSpacing: 1.2,
    align: 'left',
    mode: 'antialiased',
    thresholdPercent: 45,
    ditherAlgorithm: 'floydSteinberg',
    allowMissingGlyphs: false,
  };
}

describe('RasterTextApiService', () => {
  const http = { post: vi.fn() };
  const notifications = { success: vi.fn(), failure: vi.fn() };
  const i18n = { t: vi.fn((key: string) => key) };

  let service: RasterTextApiService;
  let session: PrinterSessionService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        RasterTextApiService,
        PrinterSessionService,
        { provide: PrinterHttpClient, useValue: http },
        { provide: PrinterNotificationService, useValue: notifications },
        { provide: I18nService, useValue: i18n },
      ],
    });
    service = TestBed.inject(RasterTextApiService);
    session = TestBed.inject(PrinterSessionService);
    session.markOnline();
  });

  it('previews without touching notifications or connection state', async () => {
    const preview = { pngBase64: 'abc', widthDots: 576, heightDots: 22, lineCount: 1, missingCharacters: [] };
    http.post.mockResolvedValueOnce(preview);

    const result = await service.preview(fakeRequest());

    expect(result).toBe(preview);
    expect(http.post).toHaveBeenCalledWith('/raster-text/preview', fakeRequest());
    expect(notifications.success).not.toHaveBeenCalled();
    expect(notifications.failure).not.toHaveBeenCalled();
  });

  it('propagates a preview error without catching it', async () => {
    const error = new HttpErrorResponse({ status: 400, statusText: 'Bad Request' });
    http.post.mockRejectedValueOnce(error);

    await expect(service.preview(fakeRequest())).rejects.toBe(error);
    expect(notifications.failure).not.toHaveBeenCalled();
  });

  it('marks the printer online and reports success after a print', async () => {
    http.post.mockResolvedValueOnce({ status: 'ok', processed: 1 });
    session.markOffline();
    const request: PrintRasterTextRequest = { ...fakeRequest(), initialize: true, cut: false };

    await service.print(request);

    expect(http.post).toHaveBeenCalledWith('/raster-text/print', request);
    expect(session.connectionState()).toBe('online');
    expect(notifications.success).toHaveBeenCalled();
  });

  it('marks the printer offline and reports failure on a connectivity error', async () => {
    const error = new HttpErrorResponse({ status: 503, statusText: 'Unavailable' });
    http.post.mockRejectedValueOnce(error);
    const request: PrintRasterTextRequest = { ...fakeRequest(), initialize: true, cut: false };

    await expect(service.print(request)).rejects.toBe(error);

    expect(session.connectionState()).toBe('offline');
    expect(notifications.failure).toHaveBeenCalled();
  });

  it('does not mark the printer offline on a client validation error', async () => {
    const error = new HttpErrorResponse({ status: 400, statusText: 'Bad Request' });
    http.post.mockRejectedValueOnce(error);
    const request: PrintRasterTextRequest = { ...fakeRequest(), initialize: true, cut: false };

    await expect(service.print(request)).rejects.toBe(error);

    expect(session.connectionState()).toBe('online');
  });
});
