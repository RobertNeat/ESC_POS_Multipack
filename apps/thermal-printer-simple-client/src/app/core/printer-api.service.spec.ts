import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { PrinterApiService } from './printer-api.service';
import { PrinterHttpClient } from './printer-http.client';
import { PrinterNotificationService } from './printer-notification.service';
import { PrinterPreferencesService } from './printer-preferences.service';
import { PrinterSessionService } from './printer-session.service';

describe('PrinterApiService', () => {
  const http = { get: vi.fn(), post: vi.fn() };
  const notifications = { success: vi.fn(), failure: vi.fn() };
  const preferences = {
    endpoint: () => 'http://localhost:3000/api',
    textEncoding: () => 'windows1250' as const,
    setEndpoint: vi.fn(),
    setTextEncoding: vi.fn(),
  };

  let service: PrinterApiService;
  let session: PrinterSessionService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        PrinterApiService,
        PrinterSessionService,
        { provide: PrinterHttpClient, useValue: http },
        { provide: PrinterNotificationService, useValue: notifications },
        { provide: PrinterPreferencesService, useValue: preferences },
      ],
    });
    service = TestBed.inject(PrinterApiService);
    session = TestBed.inject(PrinterSessionService);
    session.markOnline();
  });

  it('does not mark the printer offline after a client validation error', async () => {
    http.post.mockRejectedValueOnce(
      new HttpErrorResponse({ status: 400, statusText: 'Bad Request' }),
    );

    await expect(service.cutPaper()).rejects.toBeInstanceOf(HttpErrorResponse);

    expect(session.connectionState()).toBe('online');
  });

  it('marks the printer offline after a gateway connectivity error', async () => {
    http.post.mockRejectedValueOnce(
      new HttpErrorResponse({ status: 503, statusText: 'Unavailable' }),
    );

    await expect(service.cutPaper()).rejects.toBeInstanceOf(HttpErrorResponse);

    expect(session.connectionState()).toBe('offline');
  });
});
