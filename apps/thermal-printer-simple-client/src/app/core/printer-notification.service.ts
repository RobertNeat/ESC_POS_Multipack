import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { I18nService } from './i18n.service';

@Injectable({ providedIn: 'root' })
export class PrinterNotificationService {
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(I18nService);

  success(summary: string, detail: string): void {
    this.messages.add({ severity: 'success', summary, detail, life: 3500 });
  }

  failure(summary: string, error: unknown): void {
    this.messages.add({
      severity: 'error',
      summary,
      detail: errorDetail(error, this.i18n.t('notification.unknownError')),
      life: 6500,
    });
  }
}

export function errorDetail(error: unknown, unknownError: string): string {
  if (error instanceof HttpErrorResponse) {
    const responseError: unknown = error.error;
    const responseMessage =
      typeof responseError === 'object' && responseError !== null && 'message' in responseError
        ? responseError.message
        : undefined;
    return typeof responseMessage === 'string' ? responseMessage : error.message;
  }
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return unknownError;
}
