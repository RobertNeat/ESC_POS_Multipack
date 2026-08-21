import type {
  PrinterBytes,
  PrinterTransport,
  PrinterTransportDescriptor,
} from '@esc-pos-multipack/printer-adapter';
import {
  asConnectivityError,
  PrinterConnectivityError,
} from './printer.errors';

export type NodeEscposCallback = (error: Error | null) => void;

export interface NodeEscposDevice {
  open(callback?: NodeEscposCallback): NodeEscposDevice;
  write(data: Buffer | string, callback?: NodeEscposCallback): NodeEscposDevice;
  close(callback?: NodeEscposCallback): NodeEscposDevice;
  read(callback?: (data: Buffer) => void): unknown;
}

/** Shared lifecycle and error handling for node-escpos transports. */
export abstract class NodeEscposTransport implements PrinterTransport {
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
      throw asConnectivityError(error);
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
      throw asConnectivityError(error);
    }
  }

  async close(): Promise<void> {
    await this.discardDevice();
  }

  protected requireDevice(): NodeEscposDevice {
    if (!this.device) {
      throw new PrinterConnectivityError('Printer transport is not open.');
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

function callbackOperation(
  operation: (callback: NodeEscposCallback) => unknown,
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
