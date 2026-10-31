import { inject, Injectable } from '@angular/core';
import { PrinterHttpClient } from './printer-http.client';
import { PrinterNotificationService } from './printer-notification.service';
import { PrinterSessionService } from './printer-session.service';
import { I18nService } from './i18n.service';
import { isConnectionFailure } from './printer-api.service';
import { OperationResult } from './printer.models';
import { PrintRasterTextRequest, RasterTextPreview, RenderRasterTextRequest } from './raster-text.models';

/**
 * Preview calls happen on every control change, so they must not surface a
 * success toast; errors are returned for the caller to render inline instead.
 */
@Injectable({ providedIn: 'root' })
export class RasterTextApiService {
  private readonly http = inject(PrinterHttpClient);
  private readonly notifications = inject(PrinterNotificationService);
  private readonly session = inject(PrinterSessionService);
  private readonly i18n = inject(I18nService);

  preview(request: RenderRasterTextRequest): Promise<RasterTextPreview> {
    return this.http.post<RasterTextPreview>('/raster-text/preview', request);
  }

  async print(request: PrintRasterTextRequest): Promise<OperationResult> {
    try {
      const result = await this.http.post<OperationResult>('/raster-text/print', request);
      this.session.markOnline();
      this.notifications.success(
        this.i18n.t('notification.rasterSent'),
        this.i18n.t('notification.processed', { count: result.processed }),
      );
      return result;
    } catch (error) {
      if (isConnectionFailure(error)) this.session.markOffline();
      this.notifications.failure(this.i18n.t('notification.operationFailed'), error);
      throw error;
    }
  }
}
