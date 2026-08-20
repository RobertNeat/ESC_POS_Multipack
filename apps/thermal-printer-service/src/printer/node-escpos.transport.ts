import type {
  PrinterBytes,
  PrinterTransport,
  PrinterTransportDescriptor,
} from '@esc-pos-multipack/printer-adapter';
import NetworkAdapter from '@node-escpos/network-adapter';
import UsbAdapter from '@node-escpos/usb-adapter';

type Callback = (error: Error | null) => void;

interface NodeEscposDevice {
  open(callback?: Callback): NodeEscposDevice;
  write(data: Buffer | string, callback?: Callback): NodeEscposDevice;
  close(callback?: Callback): NodeEscposDevice;
  read(callback?: (data: Buffer) => void): unknown;
}

abstract class NodeEscposTransport implements PrinterTransport {
  abstract readonly descriptor: PrinterTransportDescriptor & {
    readonly kind: 'usb' | 'lan';
  };

  protected device?: NodeEscposDevice;

  protected abstract createDevice(): NodeEscposDevice;

  async open(): Promise<void> {
    if (this.device) return;
    const device = this.createDevice();
    this.device = device;
    try {
      await callbackOperation((callback) => device.open(callback));
    } catch (error) {
      try {
        await this.discardDevice(device);
      } catch {
        // Preserve the original connection error.
      }
      throw error;
    }
  }

  async write(bytes: PrinterBytes): Promise<void> {
    const device = this.requireDevice();
    try {
      await callbackOperation((callback) =>
        device.write(Buffer.from(bytes), callback),
      );
    } catch (error) {
      try {
        await this.discardDevice(device);
      } catch {
        // Preserve the original write error.
      }
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.discardDevice();
  }

  protected requireDevice(): NodeEscposDevice {
    if (!this.device) {
      throw new Error('Printer transport is not open.');
    }
    return this.device;
  }

  protected async discardDevice(expected?: NodeEscposDevice): Promise<void> {
    const device = this.device;
    if (!device || (expected && device !== expected)) return;
    this.device = undefined;
    await callbackOperation((callback) => device.close(callback));
  }
}

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
        reject(new Error('Printer response timeout.'));
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
      throw error;
    }
  }

  override async close(): Promise<void> {
    this.rejectPending(new Error('Printer transport closed.'));
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
          () => reject(new Error('Printer response timeout.')),
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
      throw error;
    }
  }
}

function callbackOperation(
  operation: (callback: Callback) => unknown,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    operation((error) => {
      if (settled) return;
      settled = true;
      if (error) reject(error);
      else resolve();
    });
  });
}

function hexId(value: number): string {
  return `0x${value.toString(16).padStart(4, '0')}`;
}

function asError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}
