import type { PrinterBytes } from './bytes.js';

export type PrinterTransportKind =
  'usb' | 'lan' | 'network' | 'serial' | 'virtual';

export interface PrinterTransportDescriptor {
  readonly kind: PrinterTransportKind;
  readonly id?: string;
  readonly model?: string;
  readonly address?: string;
  readonly port?: number;
}

/** Transport-level dependency implemented by USB, network or test adapters. */
export interface PrinterTransport {
  readonly descriptor: PrinterTransportDescriptor;
  open?(): Promise<void>;
  close?(): Promise<void>;
  write(bytes: PrinterBytes): Promise<void>;
  request?(bytes: PrinterBytes, responseLength?: number): Promise<PrinterBytes>;
}
