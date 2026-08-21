import type { Pos8370LowLevelAdapter } from '@esc-pos-multipack/pos-8370-adapter/low-level';
import { Inject, Injectable } from '@nestjs/common';
import { PrinterOperationExecutor } from './printer-operation.executor';
import { NORMAL_TEXT_STYLE } from './printer-text-style';
import { PRINTER_ADAPTER } from './printer.tokens';

export interface PrintJobOptions {
  readonly initialize: boolean;
  readonly cut: boolean;
}

@Injectable()
export class PrinterPrintJobRunner {
  constructor(
    @Inject(PRINTER_ADAPTER)
    private readonly adapter: Pos8370LowLevelAdapter,
    private readonly executor: PrinterOperationExecutor,
  ) {}

  text<T>(options: PrintJobOptions, print: () => Promise<T>): Promise<T> {
    return this.run(options, print, async () => {
      await this.adapter.setAlignment('left');
      await this.adapter.setTextStyle(NORMAL_TEXT_STYLE);
    });
  }

  raster<T>(options: PrintJobOptions, print: () => Promise<T>): Promise<T> {
    return this.run(options, print, () => this.adapter.setAlignment('left'));
  }

  private transport<T>(operation: () => Promise<T>): Promise<T> {
    return this.executor.transport(operation);
  }

  private run<T>(
    options: PrintJobOptions,
    print: () => Promise<T>,
    reset: () => Promise<void>,
  ): Promise<T> {
    return this.transport(async () => {
      if (options.initialize) await this.adapter.initialize();

      let result: T | undefined;
      let printError: unknown;
      try {
        result = await print();
      } catch (error) {
        printError = error;
      }

      try {
        await reset();
      } catch (resetError) {
        if (printError === undefined) throw resetError;
      }

      if (printError !== undefined) {
        throw printError instanceof Error
          ? printError
          : new Error(
              typeof printError === 'string'
                ? printError
                : 'Unknown printer operation error.',
            );
      }
      if (options.cut) await this.adapter.cut();
      return result as T;
    });
  }
}
