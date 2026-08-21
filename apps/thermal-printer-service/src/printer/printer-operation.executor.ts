import type { Pos8370LowLevelAdapter } from '@esc-pos-multipack/pos-8370-adapter/low-level';
import { Inject, Injectable } from '@nestjs/common';
import { PrinterErrorMapper } from './printer.errors';
import { PrinterOperationQueue } from './printer-operation.queue';
import { PRINTER_ADAPTER } from './printer.tokens';

@Injectable()
export class PrinterOperationExecutor {
  constructor(
    private readonly queue: PrinterOperationQueue,
    private readonly errors: PrinterErrorMapper,
    @Inject(PRINTER_ADAPTER)
    private readonly adapter: Pos8370LowLevelAdapter,
  ) {}

  input<T>(operation: () => Promise<T>): Promise<T> {
    return this.queue.enqueue(async () => {
      try {
        return await operation();
      } catch (error) {
        this.errors.input(error);
      }
    });
  }

  transport<T>(operation: () => Promise<T>): Promise<T> {
    return this.queue.enqueue(async () => {
      try {
        return await operation();
      } catch (error) {
        this.errors.transport(error);
      }
    });
  }

  queued<T>(operation: () => Promise<T>): Promise<T> {
    return this.queue.enqueue(operation);
  }

  shutdown(): Promise<void> {
    return this.queue.enqueue(() => this.adapter.close());
  }
}
