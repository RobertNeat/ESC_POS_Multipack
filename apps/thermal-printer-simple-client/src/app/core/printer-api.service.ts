import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { Alignment, ConfigurationOptions, ConnectionState, OperationResult, PrinterCapabilities, PrinterStatus, RasterPrintRequest, RawEncoding, TextEncoding, TextStyle } from './printer.models';

@Injectable({ providedIn: 'root' })
export class PrinterApiService {
  private readonly http = inject(HttpClient);
  private readonly messages = inject(MessageService);
  private readonly endpointSignal = signal(localStorage.getItem('printer-api-url') ?? 'http://localhost:3000/api');
  private readonly textEncodingSignal = signal<TextEncoding>(readTextEncoding());
  readonly connectionState = signal<ConnectionState>('checking');
  readonly status = signal<PrinterStatus | null>(null);
  readonly capabilities = signal<PrinterCapabilities | null>(null);
  readonly endpoint = this.endpointSignal.asReadonly();
  readonly textEncoding = this.textEncodingSignal.asReadonly();
  readonly model = computed(() => this.capabilities()?.model ?? 'POS-8370');

  setEndpoint(value: string): void {
    const normalized = value.trim().replace(/\/+$/, '');
    this.endpointSignal.set(normalized);
    localStorage.setItem('printer-api-url', normalized);
  }
  setTextEncoding(value: TextEncoding): void {
    this.textEncodingSignal.set(value);
    localStorage.setItem('printer-text-encoding', value);
  }
  async refreshStatus(showMessage = true): Promise<void> {
    this.connectionState.set('checking');
    try {
      const [status, capabilities] = await Promise.all([
        firstValueFrom(this.http.get<PrinterStatus>(this.url('/printer/status'))),
        firstValueFrom(this.http.get<PrinterCapabilities>(this.url('/printer/capabilities')))
      ]);
      this.status.set(status); this.capabilities.set(capabilities);
      this.connectionState.set(status.online ? 'online' : 'offline');
      if (showMessage) this.success('Połączenie aktywne', `${capabilities.model} odpowiada przez usługę.`);
    } catch (error) {
      this.status.set(null); this.connectionState.set('offline');
      if (showMessage) this.failure('Nie udało się połączyć', error);
    }
  }
  printLine(text: string, alignment: Alignment, style: TextStyle, cut: boolean): Promise<OperationResult> {
    return this.post('/printer/lines', { lines: [{ text, alignment, style }], encoding: this.textEncodingSignal(), initialize: true, cut }, 'Linia została wysłana');
  }
  printMarkdown(markdown: string, cut: boolean, success = 'Dokument został wysłany'): Promise<OperationResult> {
    return this.post('/printer/markdown', { markdown, encoding: this.textEncodingSignal(), initialize: true, cut }, success);
  }
  printText(text: string, cut: boolean): Promise<OperationResult> {
    return this.post('/printer/text', { text, encoding: this.textEncodingSignal(), initialize: true, cut }, 'Dokument tekstowy został wysłany');
  }
  cutPaper(): Promise<OperationResult> {
    return this.post('/printer/cut', {}, 'Papier został odcięty');
  }
  printRaw(encoding: RawEncoding, data: string | number[]): Promise<OperationResult> {
    return this.post('/printer/raw', { encoding, data }, 'Komendy ESC/POS zostały wysłane');
  }
  printRaster(request: RasterPrintRequest): Promise<OperationResult> {
    return this.post('/printer/raster', request, 'Bitmapa została wysłana do drukarki');
  }
  getConfigurationOptions(): Promise<ConfigurationOptions> {
    return firstValueFrom(this.http.get<ConfigurationOptions>(this.url('/printer/configuration/options')));
  }
  configure(entries: Array<{ setting: string; option: string }>): Promise<OperationResult> {
    return this.post('/printer/configuration/named', { entries }, 'Ustawienia zostały zapisane');
  }
  performAction(action: string, command?: string): Promise<OperationResult> {
    return this.post('/printer/actions', { action, ...(command ? { command } : {}) }, 'Akcja została wykonana');
  }
  private async post(path: string, body: unknown, message: string): Promise<OperationResult> {
    try {
      const result = await firstValueFrom(this.http.post<OperationResult>(this.url(path), body));
      this.connectionState.set('online'); this.success(message, `Przetworzono: ${result.processed}`); return result;
    } catch (error) {
      this.connectionState.set('offline'); this.failure('Operacja nie powiodła się', error); throw error;
    }
  }
  private url(path: string): string { return `${this.endpointSignal()}${path}`; }
  private success(summary: string, detail: string): void { this.messages.add({ severity: 'success', summary, detail, life: 3500 }); }
  private failure(summary: string, error: unknown): void {
    const detail = error instanceof HttpErrorResponse ? (error.error?.message ?? error.message) : error instanceof Error ? error.message : String(error);
    this.messages.add({ severity: 'error', summary, detail, life: 6500 });
  }
}

function readTextEncoding(): TextEncoding {
  const stored = localStorage.getItem('printer-text-encoding');
  return stored === 'cp852' || stored === 'cp3843' || stored === 'utf8' || stored === 'windows1250'
    ? stored
    : 'windows1250';
}
