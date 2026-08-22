import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PrinterHttpClient } from './printer-http.client';
import { I18nService } from './i18n.service';
import { TranslationKey } from './translations';
import {
  Alignment,
  CharacterFontSize,
  ConfigurationOptions,
  OperationResult,
  PrinterCapabilities,
  PrinterStatus,
  RasterPrintRequest,
  RawEncoding,
  TextEncoding,
  TextStyle,
} from './printer.models';
import { PrinterNotificationService } from './printer-notification.service';
import { PrinterPreferencesService } from './printer-preferences.service';
import { PrinterSessionService } from './printer-session.service';

/**
 * Application-facing facade for printer use cases.
 * Transport, session state, preferences and UI notifications live in focused services.
 */
@Injectable({ providedIn: 'root' })
export class PrinterApiService {
  private readonly http = inject(PrinterHttpClient);
  private readonly notifications = inject(PrinterNotificationService);
  private readonly preferences = inject(PrinterPreferencesService);
  private readonly session = inject(PrinterSessionService);
  private readonly i18n = inject(I18nService);

  readonly connectionState = this.session.connectionState;
  readonly status = this.session.status;
  readonly capabilities = this.session.capabilities;
  readonly model = this.session.model;
  readonly endpoint = this.preferences.endpoint;
  readonly textEncoding = this.preferences.textEncoding;

  setEndpoint(value: string): void {
    this.preferences.setEndpoint(value);
  }

  setTextEncoding(value: TextEncoding): void {
    this.preferences.setTextEncoding(value);
  }

  async refreshStatus(showMessage = true): Promise<void> {
    this.session.startChecking();
    try {
      const [status, capabilities] = await Promise.all([
        this.http.get<PrinterStatus>('/printer/status'),
        this.http.get<PrinterCapabilities>('/printer/capabilities'),
      ]);
      this.session.update(status, capabilities);
      if (showMessage) {
        this.notifications.success(
          this.i18n.t('notification.connectionActive'),
          this.i18n.t('notification.connectionDetail', { model: capabilities.model }),
        );
      }
    } catch (error) {
      this.session.markOffline(true);
      if (showMessage) {
        this.notifications.failure(this.i18n.t('notification.connectionFailed'), error);
      }
    }
  }

  printLine(
    text: string,
    alignment: Alignment,
    style: TextStyle,
    cut: boolean,
  ): Promise<OperationResult> {
    return this.post(
      '/printer/lines',
      {
        lines: [{ text, alignment, style }],
        encoding: this.textEncoding(),
        initialize: true,
        cut,
      },
      'notification.lineSent',
    );
  }

  printMarkdown(
    markdown: string,
    fontSize: CharacterFontSize,
    cut: boolean,
    success: TranslationKey = 'notification.documentSent',
  ): Promise<OperationResult> {
    return this.post(
      '/printer/markdown',
      {
        markdown,
        fontSize,
        encoding: this.textEncoding(),
        initialize: true,
        cut,
      },
      success,
    );
  }

  printText(text: string, fontSize: CharacterFontSize, cut: boolean): Promise<OperationResult> {
    return this.post(
      '/printer/text',
      {
        text,
        fontSize,
        encoding: this.textEncoding(),
        initialize: true,
        cut,
      },
      'notification.textDocumentSent',
    );
  }

  cutPaper(): Promise<OperationResult> {
    return this.post('/printer/cut', {}, 'notification.paperCut');
  }

  printRaw(encoding: RawEncoding, data: string | number[]): Promise<OperationResult> {
    return this.post('/printer/raw', { encoding, data }, 'notification.rawSent');
  }

  printRaster(request: RasterPrintRequest): Promise<OperationResult> {
    return this.post('/printer/raster', request, 'notification.rasterSent');
  }

  getConfigurationOptions(): Promise<ConfigurationOptions> {
    return this.http.get('/printer/configuration/options');
  }

  configure(entries: Array<{ setting: string; option: string }>): Promise<OperationResult> {
    return this.post('/printer/configuration/named', { entries }, 'notification.settingsSaved');
  }

  performAction(action: string, command?: string): Promise<OperationResult> {
    return this.post(
      '/printer/actions',
      { action, ...(command ? { command } : {}) },
      'notification.actionDone',
    );
  }

  private async post(
    path: string,
    body: unknown,
    successMessage: TranslationKey,
  ): Promise<OperationResult> {
    try {
      const result = await this.http.post<OperationResult>(path, body);
      this.session.markOnline();
      this.notifications.success(
        this.i18n.t(successMessage),
        this.i18n.t('notification.processed', { count: result.processed }),
      );
      return result;
    } catch (error) {
      if (isConnectionFailure(error)) {
        this.session.markOffline();
      }
      this.notifications.failure(this.i18n.t('notification.operationFailed'), error);
      throw error;
    }
  }
}

/** A client validation error (4xx) does not imply loss of printer connectivity. */
export function isConnectionFailure(error: unknown): boolean {
  return (
    error instanceof HttpErrorResponse &&
    (error.status === 0 || [502, 503, 504].includes(error.status))
  );
}
