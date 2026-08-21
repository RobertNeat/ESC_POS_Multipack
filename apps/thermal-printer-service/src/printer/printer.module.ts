import { readFileSync } from 'node:fs';
import type { PrinterTransport } from '@esc-pos-multipack/printer-adapter';
import {
  InMemoryPrinterSettingsRepository,
  type PrinterSettingsRepository,
} from '@esc-pos-multipack/pos-8370-adapter';
import { Pos8370Adapter } from '@esc-pos-multipack/pos-8370-adapter/low-level';
import { Module } from '@nestjs/common';
import { MarkdownPrinter } from './markdown-printer';
import {
  NodeEscposLanTransport,
  NodeEscposUsbTransport,
} from './node-escpos.transport';
import { PrinterController } from './printer.controller';
import { PrinterConfigurationCatalog } from './printer-configuration.catalog';
import { PrinterErrorMapper } from './printer.errors';
import { PrinterOperationExecutor } from './printer-operation.executor';
import { PrinterOperationQueue } from './printer-operation.queue';
import { PrinterPayloadDecoder } from './printer-payload.decoder';
import { PrinterPrintJobRunner } from './printer-print-job.runner';
import { PrinterService } from './printer.service';
import { PRINTER_ADAPTER, PRINTER_SETTINGS } from './printer.tokens';

@Module({
  controllers: [PrinterController],
  providers: [
    MarkdownPrinter,
    PrinterConfigurationCatalog,
    PrinterErrorMapper,
    PrinterOperationExecutor,
    PrinterOperationQueue,
    PrinterPayloadDecoder,
    PrinterPrintJobRunner,
    {
      provide: PRINTER_SETTINGS,
      useFactory: loadSettings,
    },
    {
      provide: PRINTER_ADAPTER,
      inject: [PRINTER_SETTINGS],
      useFactory: (settings: PrinterSettingsRepository) =>
        new Pos8370Adapter({
          transport: createTransport(),
          settingsRepository: settings,
        }),
    },
    PrinterService,
  ],
  exports: [PrinterService],
})
export class PrinterModule {}

function loadSettings(): PrinterSettingsRepository {
  const mappingPath =
    require.resolve('@esc-pos-multipack/pos-8370-adapter/assets/POS-8370_command_mappings.json');
  const value: unknown = JSON.parse(readFileSync(mappingPath, 'utf8'));
  return InMemoryPrinterSettingsRepository.fromJson(value);
}

function createTransport(): PrinterTransport & {
  readonly descriptor: PrinterTransport['descriptor'] & {
    readonly kind: 'usb' | 'lan';
  };
} {
  const kind = (process.env.PRINTER_TRANSPORT ?? 'lan').toLowerCase();
  const timeout = positiveInteger(process.env.PRINTER_TIMEOUT_MS, 5_000);
  if (kind === 'lan') {
    return new NodeEscposLanTransport(
      process.env.PRINTER_HOST ?? '192.168.1.100',
      positiveInteger(process.env.PRINTER_PORT, 9100),
      timeout,
    );
  }
  if (kind === 'usb') {
    const vendorId = optionalUsbId(process.env.PRINTER_USB_VENDOR_ID);
    const productId = optionalUsbId(process.env.PRINTER_USB_PRODUCT_ID);
    if ((vendorId === undefined) !== (productId === undefined)) {
      throw new Error(
        'PRINTER_USB_VENDOR_ID and PRINTER_USB_PRODUCT_ID must be set together.',
      );
    }
    return new NodeEscposUsbTransport(vendorId, productId, timeout);
  }
  throw new Error(`Unsupported PRINTER_TRANSPORT: ${kind}. Use lan or usb.`);
}

function positiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65_535) {
    throw new Error(`Expected a positive integer, received: ${value}`);
  }
  return parsed;
}

function optionalUsbId(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const parsed = Number.parseInt(value, value.startsWith('0x') ? 16 : 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 0xffff) {
    throw new Error(`Invalid USB identifier: ${value}`);
  }
  return parsed;
}
