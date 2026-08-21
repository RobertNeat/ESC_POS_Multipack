import type {
  PrinterBytes,
  PrinterTransportDescriptor,
} from '@esc-pos-multipack/printer-adapter';
import NetworkAdapter from '@node-escpos/network-adapter';
import {
  NodeEscposTransport,
  type NodeEscposDevice,
} from './node-escpos-transport.base';
import {
  asConnectivityError,
  PrinterConnectivityError,
} from './printer.errors';

/** TCP transport with ordered response buffering for status requests. */
export class NodeEscposLanTransport extends NodeEscposTransport {
  readonly descriptor: PrinterTransportDescriptor & { readonly kind: 'lan' };
  private readonly pendingReads: Array<{
    length: number;
    resolve: (value: PrinterBytes) => void;
    reject: (error: Error) => void;
    timer: NodeJS.Timeout;
  }> = [];
  private received = Buffer.alloc(0);

  constructor(
    private readonly host: string,
    private readonly port = 9100,
    private readonly timeoutMs = 5_000,
  ) {
    super();
    this.descriptor = {
      kind: 'lan',
      id: `${host}:${port}`,
      model: 'BisOffice POS-8370',
      address: host,
      port,
    };
  }

  protected createDevice(): NodeEscposDevice {
    return new NetworkAdapter(this.host, this.port, this.timeoutMs);
  }

  override async open(): Promise<void> {
    await super.open();
    this.received = Buffer.alloc(0);
    this.requireDevice().read((data) => this.acceptData(data));
  }

  async request(
    bytes: PrinterBytes,
    responseLength = 1,
  ): Promise<PrinterBytes> {
    const response = new Promise<PrinterBytes>((resolve, reject) => {
      const timer = setTimeout(() => {
        const index = this.pendingReads.findIndex(
          (pending) => pending.resolve === resolve,
        );
        if (index >= 0) this.pendingReads.splice(index, 1);
        reject(new PrinterConnectivityError('Printer response timeout.'));
      }, this.timeoutMs);
      this.pendingReads.push({
        length: responseLength,
        resolve,
        reject,
        timer,
      });
    });
    try {
      await this.write(bytes);
      return await response;
    } catch (error) {
      this.rejectPending(asError(error));
      try {
        await this.discardDevice();
      } catch {
        // Preserve the original request error.
      }
      throw asConnectivityError(error);
    }
  }

  override async close(): Promise<void> {
    this.rejectPending(
      new PrinterConnectivityError('Printer transport closed.'),
    );
    this.received = Buffer.alloc(0);
    await super.close();
  }

  private acceptData(data: Buffer): void {
    this.received = Buffer.concat([this.received, data]);
    while (this.pendingReads.length > 0) {
      const pending = this.pendingReads[0];
      if (this.received.length < pending.length) return;
      this.pendingReads.shift();
      clearTimeout(pending.timer);
      const response = this.received.subarray(0, pending.length);
      this.received = this.received.subarray(pending.length);
      pending.resolve(Uint8Array.from(response));
    }
  }

  private rejectPending(error: Error): void {
    for (const pending of this.pendingReads.splice(0)) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
  }
}

function asError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}
