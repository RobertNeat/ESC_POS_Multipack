export type PrinterBytes = Uint8Array;

export type ByteSource = PrinterBytes | readonly number[] | ArrayBuffer | ArrayBufferView;

export type PrinterTransportKind = "usb" | "network" | "serial" | "virtual";

export interface PrinterTransportDescriptor {
  readonly kind: PrinterTransportKind;
  readonly id?: string;
  readonly model?: string;
  readonly address?: string;
  readonly port?: number;
}

export interface PrinterTransport {
  readonly descriptor: PrinterTransportDescriptor;
  open?(): Promise<void>;
  close?(): Promise<void>;
  write(bytes: PrinterBytes): Promise<void>;
  request?(bytes: PrinterBytes, responseLength?: number): Promise<PrinterBytes>;
}

export interface PrinterRawPayload {
  readonly type: "raw";
  readonly bytes: ByteSource;
}

export interface PrinterTextPayload {
  readonly type: "text";
  readonly text: string;
  readonly encoding?: string;
  readonly appendLineFeed?: boolean;
}

export interface PrinterCommandPayload {
  readonly type: "commands";
  readonly commands: readonly ByteSource[];
}

export type PrintPayload = PrinterRawPayload | PrinterTextPayload | PrinterCommandPayload;

export interface PrinterStatus {
  readonly online: boolean;
  readonly coverOpen?: boolean;
  readonly paperNearEnd?: boolean;
  readonly paperOut?: boolean;
  readonly drawerOpen?: boolean;
  readonly cutterError?: boolean;
  readonly recoverableError?: boolean;
  readonly unrecoverableError?: boolean;
  readonly headOrVoltageError?: boolean;
  readonly raw?: Record<string, number>;
}

export interface PrinterCapability {
  readonly name: string;
  readonly supported: boolean;
  readonly values?: readonly string[];
}

export interface PrinterCapabilities {
  readonly model: string;
  readonly paperWidthsMm: readonly number[];
  readonly dpi: number;
  readonly commands: readonly string[];
  readonly features: readonly PrinterCapability[];
}

export interface DeviceConfigEntry {
  readonly setting: string;
  readonly option: string;
}

export interface DeviceRawConfigEntry {
  readonly setting: string;
  readonly option: string;
  readonly bytes: ByteSource;
}

export interface DeviceConfig {
  readonly entries: readonly (DeviceConfigEntry | DeviceRawConfigEntry)[];
}

export interface PrinterAdapter {
  print(payload: PrintPayload): Promise<void>;
  getStatus(): Promise<PrinterStatus>;
  getCapabilities(): PrinterCapabilities;
  configure(config: DeviceConfig): Promise<void>;
  raw(bytes: ByteSource): Promise<void>;
}

export function toPrinterBytes(bytes: ByteSource): PrinterBytes {
  if (bytes instanceof Uint8Array) {
    return bytes;
  }

  if (ArrayBuffer.isView(bytes)) {
    return new Uint8Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  }

  if (bytes instanceof ArrayBuffer) {
    return new Uint8Array(bytes);
  }

  const normalized = bytes.map((byte) => {
    if (!Number.isInteger(byte) || byte < 0 || byte > 255) {
      throw new RangeError(`Printer byte must be an integer from 0 to 255. Received: ${byte}`);
    }

    return byte;
  });

  return Uint8Array.from(normalized);
}
