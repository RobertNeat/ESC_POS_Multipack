import type {
  PrinterBytes,
  PrinterTransportDescriptor,
} from '@esc-pos-multipack/printer-adapter';
import UsbAdapter from '@node-escpos/usb-adapter';
import {
  NodeEscposTransport,
  type NodeEscposDevice,
} from './node-escpos-transport.base';
import {
  asConnectivityError,
  PrinterConnectivityError,
} from './printer.errors';

/** USB transport using node-escpos device discovery or explicit identifiers. */
export class NodeEscposUsbTransport extends NodeEscposTransport {
  readonly descriptor: PrinterTransportDescriptor & { readonly kind: 'usb' };

  constructor(
    private readonly vendorId?: number,
    private readonly productId?: number,
    private readonly timeoutMs = 5_000,
  ) {
    super();
    this.descriptor = {
      kind: 'usb',
      id:
        vendorId === undefined
          ? 'auto'
          : `${hexId(vendorId)}:${hexId(productId ?? 0)}`,
      model: 'BisOffice POS-8370',
    };
  }

  protected createDevice(): NodeEscposDevice {
    return new UsbAdapter(this.vendorId, this.productId);
  }

  async request(
    bytes: PrinterBytes,
    responseLength = 1,
  ): Promise<PrinterBytes> {
    try {
      await this.write(bytes);
      const device = this.requireDevice();
      return await new Promise<PrinterBytes>((resolve, reject) => {
        const timer = setTimeout(
          () =>
            reject(new PrinterConnectivityError('Printer response timeout.')),
          this.timeoutMs,
        );
        device.read((data) => {
          clearTimeout(timer);
          resolve(Uint8Array.from(data.subarray(0, responseLength)));
        });
      });
    } catch (error) {
      try {
        await this.discardDevice();
      } catch {
        // Preserve the original request error.
      }
      throw asConnectivityError(error);
    }
  }
}

function hexId(value: number): string {
  return `0x${value.toString(16).padStart(4, '0')}`;
}
