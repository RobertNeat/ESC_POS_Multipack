import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class PrinterNotificationService {
  private readonly messages = inject(MessageService);

  success(summary: string, detail: string): void {
    this.messages.add({ severity: 'success', summary, detail, life: 3500 });
  }

  failure(summary: string, error: unknown): void {
    this.messages.add({
      severity: 'error',
      summary,
      detail: errorDetail(error),
      life: 6500,
    });
  }
}

export function errorDetail(error: unknown): string {
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
  return 'Wystąpił nieznany błąd.';
}
