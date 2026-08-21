import { TestBed } from '@angular/core/testing';
import { PrinterPreferencesService } from './printer-preferences.service';

describe('PrinterPreferencesService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('normalizes and persists the API endpoint', () => {
    const service = TestBed.inject(PrinterPreferencesService);

    service.setEndpoint(' http://printer.local/api/// ');

    expect(service.endpoint()).toBe('http://printer.local/api');
    expect(localStorage.getItem('printer-api-url')).toBe('http://printer.local/api');
  });

  it('falls back to Windows-1250 for an unsupported stored encoding', () => {
    localStorage.setItem('printer-text-encoding', 'unsupported');

    const service = TestBed.inject(PrinterPreferencesService);

    expect(service.textEncoding()).toBe('windows1250');
  });
});
