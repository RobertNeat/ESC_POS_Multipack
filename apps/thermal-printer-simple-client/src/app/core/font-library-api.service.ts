import { inject, Injectable } from '@angular/core';
import { PrinterHttpClient } from './printer-http.client';
import { PrinterNotificationService } from './printer-notification.service';
import { I18nService } from './i18n.service';
import { FontSummary } from './raster-text.models';

@Injectable({ providedIn: 'root' })
export class FontLibraryApiService {
  private readonly http = inject(PrinterHttpClient);
  private readonly notifications = inject(PrinterNotificationService);
  private readonly i18n = inject(I18nService);

  list(): Promise<FontSummary[]> {
    return this.http.get<{ fonts: FontSummary[] }>('/fonts').then((response) => response.fonts);
  }

  async upload(file: File, displayName?: string): Promise<FontSummary> {
    const form = new FormData();
    form.append('file', file, file.name);
    if (displayName) form.append('displayName', displayName);
    try {
      const font = await this.http.postForm<FontSummary>('/fonts', form);
      this.notifications.success(
        this.i18n.t('fonts.uploaded'),
        this.i18n.t('fonts.uploadedDetail', { name: font.displayName }),
      );
      return font;
    } catch (error) {
      this.notifications.failure(this.i18n.t('fonts.uploadFailed'), error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.http.delete(`/fonts/${encodeURIComponent(id)}`);
      this.notifications.success(this.i18n.t('fonts.deleted'), this.i18n.t('fonts.deletedDetail'));
    } catch (error) {
      this.notifications.failure(this.i18n.t('fonts.deleteFailed'), error);
      throw error;
    }
  }
}
