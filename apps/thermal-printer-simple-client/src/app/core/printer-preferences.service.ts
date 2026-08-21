import { Injectable, signal } from '@angular/core';
import { TextEncoding } from './printer.models';

const DEFAULT_ENDPOINT = '/api';
const ENDPOINT_KEY = 'printer-api-url';
const TEXT_ENCODING_KEY = 'printer-text-encoding';

@Injectable({ providedIn: 'root' })
export class PrinterPreferencesService {
  private readonly endpointSignal = signal(localStorage.getItem(ENDPOINT_KEY) ?? DEFAULT_ENDPOINT);
  private readonly textEncodingSignal = signal<TextEncoding>(readTextEncoding());

  readonly endpoint = this.endpointSignal.asReadonly();
  readonly textEncoding = this.textEncodingSignal.asReadonly();

  setEndpoint(value: string): void {
    const normalized = value.trim().replace(/\/+$/, '');
    this.endpointSignal.set(normalized);
    localStorage.setItem(ENDPOINT_KEY, normalized);
  }

  setTextEncoding(value: TextEncoding): void {
    this.textEncodingSignal.set(value);
    localStorage.setItem(TEXT_ENCODING_KEY, value);
  }
}

function readTextEncoding(): TextEncoding {
  const stored = localStorage.getItem(TEXT_ENCODING_KEY);
  return stored === 'cp852' || stored === 'cp3843' || stored === 'utf8' || stored === 'windows1250'
    ? stored
    : 'windows1250';
}
