import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { PrinterApiService } from '../../core/printer-api.service';
import { I18nService } from '../../core/i18n.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { RawEncoding } from '../../core/printer.models';
import {
  decodeDecimalBytes,
  RawPayloadError,
  rawPayloadByteCount,
  validateRawPayload,
} from './raw-payload';

@Component({
  imports: [FormsModule, ButtonModule, SelectModule, TextareaModule, TranslatePipe],
  templateUrl: './raw.component.html',
  styleUrl: './raw.component.css',
})
export class RawComponent {
  private readonly api = inject(PrinterApiService);
  private readonly i18n = inject(I18nService);
  protected encoding: RawEncoding = 'hex';
  protected payload = '1b 40';
  protected sending = false;
  protected encodings() {
    return [
      { label: this.i18n.t('raw.hexBytes'), value: 'hex' },
      { label: this.i18n.t('raw.base64'), value: 'base64' },
      { label: this.i18n.t('raw.decimalBytes'), value: 'bytes' },
    ];
  }
  protected presets() {
    return [
      { label: this.i18n.t('raw.initialize'), hex: '1b 40' },
      { label: this.i18n.t('raw.lf'), hex: '0a' },
      { label: this.i18n.t('raw.cut'), hex: '1d 56 42 10' },
    ];
  }
  protected reference() {
    return [
      {
        hex: '1B 40',
        name: this.i18n.t('raw.initializeName'),
        description: this.i18n.t('raw.resetMode'),
      },
      {
        hex: '1B 45 01',
        name: this.i18n.t('raw.emphasizedOnName'),
        description: this.i18n.t('raw.boldOn'),
      },
      {
        hex: '1B 61 01',
        name: this.i18n.t('raw.centerName'),
        description: this.i18n.t('raw.centerText'),
      },
      {
        hex: '1D 56 42 10',
        name: this.i18n.t('raw.partialCutName'),
        description: this.i18n.t('raw.feedAndCut'),
      },
      {
        hex: '1B 70 00 40 50',
        name: this.i18n.t('raw.drawerPulseName'),
        description: this.i18n.t('raw.drawerPulse'),
      },
    ];
  }
  protected placeholder(): string {
    return this.encoding === 'hex'
      ? this.i18n.t('raw.hexExample')
      : this.encoding === 'base64'
        ? this.i18n.t('raw.base64Example')
        : this.i18n.t('raw.bytesExample');
  }
  protected validationError(): string | null {
    const error = validateRawPayload(this.encoding, this.payload);
    const keys: Record<RawPayloadError, Parameters<I18nService['t']>[0]> = {
      invalidHexCharacters: 'raw.error.invalidHex',
      incompleteHexByte: 'raw.error.invalidHex',
      invalidBase64: 'raw.error.invalidBase64',
      invalidByte: 'raw.error.invalidBytes',
    };
    return error ? this.i18n.t(keys[error]) : null;
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
