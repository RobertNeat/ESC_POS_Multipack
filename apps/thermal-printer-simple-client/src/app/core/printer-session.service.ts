import { computed, Injectable, signal } from '@angular/core';
import { ConnectionState, PrinterCapabilities, PrinterStatus } from './printer.models';

@Injectable({ providedIn: 'root' })
export class PrinterSessionService {
  readonly connectionState = signal<ConnectionState>('checking');
  readonly status = signal<PrinterStatus | null>(null);
  readonly capabilities = signal<PrinterCapabilities | null>(null);
  readonly model = computed(() => this.capabilities()?.model ?? 'POS-8370');

  startChecking(): void {
    this.connectionState.set('checking');
  }

  update(status: PrinterStatus, capabilities: PrinterCapabilities): void {
    this.status.set(status);
    this.capabilities.set(capabilities);
    this.connectionState.set(status.online ? 'online' : 'offline');
  }

  markOnline(): void {
    this.connectionState.set('online');
  }

  markOffline(clearStatus = false): void {
    this.connectionState.set('offline');
    if (clearStatus) {
      this.status.set(null);
    }
  }
}
