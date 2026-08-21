import type { PrinterTransport } from '@esc-pos-multipack/printer-adapter';

/** Owns transport lifecycle and reconnect behavior for one adapter instance. */
export class PrinterConnection {
  private opened = false;

  constructor(
    private readonly transport: PrinterTransport,
    private readonly autoOpen: boolean,
  ) {}

  async run<T>(operation: () => Promise<T>, retry = false): Promise<T> {
    await this.ensureOpen();
    try {
      return await operation();
    } catch (error) {
      await this.reset();
      if (!retry) throw error;
    }

    await this.ensureOpen();
    try {
      return await operation();
    } catch (error) {
      await this.reset();
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.opened) await this.transport.close?.();
    this.opened = false;
  }

  private async ensureOpen(): Promise<void> {
    if (this.opened || !this.autoOpen) return;
    await this.transport.open?.();
    this.opened = true;
  }

  private async reset(): Promise<void> {
    this.opened = false;
    try {
      await this.transport.close?.();
    } catch {
      // The original I/O error is more useful than a secondary close failure.
    }
  }
}
