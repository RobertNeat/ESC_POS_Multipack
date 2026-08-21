import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { PrinterApiService } from '../../core/printer-api.service';
import { RawEncoding } from '../../core/printer.models';
import { decodeDecimalBytes, rawPayloadByteCount, validateRawPayload } from './raw-payload';

@Component({
  imports: [FormsModule, ButtonModule, SelectModule, TextareaModule],
  templateUrl: './raw.component.html',
  styleUrl: './raw.component.css',
})
export class RawComponent {
  private readonly api = inject(PrinterApiService);
  protected encoding: RawEncoding = 'hex';
  protected payload = '1b 40';
  protected sending = false;
  protected readonly encodings = [
    { label: 'HEX — bajty szesnastkowe', value: 'hex' },
    { label: 'Base64', value: 'base64' },
    { label: 'Bajty dziesiętne', value: 'bytes' },
  ];
  protected readonly presets = [
    { label: 'Inicjalizacja', hex: '1b 40' },
    { label: 'LF', hex: '0a' },
    { label: 'Cięcie', hex: '1d 56 42 10' },
  ];
  protected readonly reference = [
    { hex: '1B 40', name: 'Initialize', description: 'Resetuje bieżący tryb drukowania' },
    { hex: '1B 45 01', name: 'Emphasized ON', description: 'Włącza druk pogrubiony' },
    { hex: '1B 61 01', name: 'Center', description: 'Wyrównuje tekst do środka' },
    { hex: '1D 56 42 10', name: 'Partial cut', description: 'Podaje papier i uruchamia nóż' },
    { hex: '1B 70 00 40 50', name: 'Drawer pulse', description: 'Impuls szuflady kasowej' },
  ];
  protected placeholder(): string {
    return this.encoding === 'hex'
      ? 'np. 1b 40 48 65 6c 6c 6f 0a'
      : this.encoding === 'base64'
        ? 'np. G0BIZWxsbwo='
        : 'np. 27, 64, 10';
  }
  protected validationError(): string | null {
    return validateRawPayload(this.encoding, this.payload);
  }
  protected byteCount(): number {
    return rawPayloadByteCount(this.encoding, this.payload);
  }
  protected usePreset(hex: string): void {
    this.encoding = 'hex';
    this.payload = hex.toLowerCase();
  }
  protected async send(): Promise<void> {
    if (this.validationError() || !this.payload.trim() || this.sending) return;
    this.sending = true;
    try {
      const data = this.encoding === 'bytes' ? decodeDecimalBytes(this.payload) : this.payload;
      await this.api.printRaw(this.encoding, data);
    } finally {
      this.sending = false;
    }
  }
}
