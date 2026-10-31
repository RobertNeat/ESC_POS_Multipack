import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PrinterHttpClient } from './printer-http.client';
import { PrinterPreferencesService } from './printer-preferences.service';

describe('PrinterHttpClient', () => {
  const http = { get: vi.fn(), post: vi.fn(), delete: vi.fn() };
  const preferences = { endpoint: () => '/api' };

  let client: PrinterHttpClient;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        PrinterHttpClient,
        { provide: HttpClient, useValue: http },
        { provide: PrinterPreferencesService, useValue: preferences },
      ],
    });
    client = TestBed.inject(PrinterHttpClient);
  });

  it('prefixes GET requests with the configured endpoint', async () => {
    http.get.mockReturnValueOnce(of({ ok: true }));

    await expect(client.get('/fonts')).resolves.toEqual({ ok: true });
    expect(http.get).toHaveBeenCalledWith('/api/fonts');
  });

  it('prefixes POST requests with the configured endpoint', async () => {
    http.post.mockReturnValueOnce(of({ ok: true }));

    await client.post('/raster-text/preview', { text: 'hi' });

    expect(http.post).toHaveBeenCalledWith('/api/raster-text/preview', { text: 'hi' });
  });

  it('sends FormData as the body for postForm without altering it', async () => {
    http.post.mockReturnValueOnce(of({ id: 'font-1' }));
    const form = new FormData();
    form.append('file', new File([new Uint8Array([0])], 'font.ttf'));

    await client.postForm('/fonts', form);

    expect(http.post).toHaveBeenCalledWith('/api/fonts', form);
  });

  it('prefixes DELETE requests with the configured endpoint', async () => {
    http.delete.mockReturnValueOnce(of(undefined));

    await client.delete('/fonts/font-1');

    expect(http.delete).toHaveBeenCalledWith('/api/fonts/font-1');
  });
});
