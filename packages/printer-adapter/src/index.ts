export type PrinterBytes = Uint8Array;

export type ByteSource =
  PrinterBytes | readonly number[] | ArrayBuffer | ArrayBufferView;

export type PrinterTransportKind =
  "usb" | "lan" | "network" | "serial" | "virtual";

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

export interface PrinterInstructionsPayload {
  readonly type: "instructions";
  readonly instructions: readonly PrinterInstruction[];
}

export type PrintPayload =
  | PrinterRawPayload
  | PrinterTextPayload
  | PrinterCommandPayload
  | PrinterInstructionsPayload;

export type PrinterInstruction =
  | { readonly type: "horizontalTab" }
  | { readonly type: "lineFeed" }
  | {
      readonly type: "realTimeDrawerPulse";
      readonly pin: 2 | 5;
      readonly duration100ms: number;
    }
  | { readonly type: "characterSpacing"; readonly units: number }
  | { readonly type: "printMode"; readonly value: number }
  | { readonly type: "absolutePosition"; readonly units: number }
  | { readonly type: "userDefinedCharacterSet"; readonly enabled: boolean }
  | {
      readonly type: "defineUserDefinedCharacters";
      readonly firstCode: number;
      readonly characters: readonly UserDefinedCharacter[];
    }
  | {
      readonly type: "bitImage";
      readonly mode: 0 | 1 | 32 | 33;
      readonly width: number;
      readonly data: ByteSource;
    }
  | { readonly type: "underline"; readonly thickness: 0 | 1 | 2 }
  | { readonly type: "defaultLineSpacing" }
  | { readonly type: "lineSpacing"; readonly units: number }
  | { readonly type: "cancelUserDefinedCharacter"; readonly code: number }
  | { readonly type: "initialize" }
  | {
      readonly type: "buzzer";
      readonly count: number;
      readonly interval100ms: number;
    }
  | { readonly type: "horizontalTabs"; readonly columns: readonly number[] }
  | { readonly type: "emphasized"; readonly enabled: boolean }
  | { readonly type: "doubleStrike"; readonly enabled: boolean }
  | { readonly type: "feedDots"; readonly units: number }
  | { readonly type: "font"; readonly font: "A" | "B" }
  | { readonly type: "rotate90"; readonly enabled: boolean }
  | { readonly type: "relativePosition"; readonly units: number }
  | {
      readonly type: "justification";
      readonly value: "left" | "center" | "right";
    }
  | { readonly type: "panelButtons"; readonly enabled: boolean }
  | { readonly type: "feedLines"; readonly lines: number }
  | {
      readonly type: "drawerPulse";
      readonly pin: 2 | 5;
      readonly onTime2ms: number;
      readonly offTime2ms: number;
    }
  | { readonly type: "codeTable"; readonly table: number }
  | { readonly type: "upsideDown"; readonly enabled: boolean }
  | { readonly type: "legacyPartialCut"; readonly variant: "ESC i" | "ESC m" }
  | {
      readonly type: "printNvImage";
      readonly image: number;
      readonly mode: ImageScale;
    }
  | { readonly type: "defineNvImages"; readonly images: readonly NvImage[] }
  | {
      readonly type: "characterSize";
      readonly width: Scale1To8;
      readonly height: Scale1To8;
    }
  | { readonly type: "reverse"; readonly enabled: boolean }
  | {
      readonly type: "hriPosition";
      readonly position: "none" | "above" | "below" | "both";
    }
  | { readonly type: "leftMargin"; readonly units: number }
  | { readonly type: "cut"; readonly feedUnits?: number }
  | { readonly type: "hriFont"; readonly font: "A" | "B" }
  | { readonly type: "barcodeHeight"; readonly dots: number }
  | {
      readonly type: "barcode";
      readonly system: BarcodeSystem;
      readonly data: ByteSource;
      readonly format?: "lengthPrefixed" | "nulTerminated";
    }
  | {
      readonly type: "rasterImage";
      readonly mode: ImageScale;
      readonly widthBytes: number;
      readonly height: number;
      readonly data: ByteSource;
    }
  | { readonly type: "barcodeWidth"; readonly width: 2 | 3 | 4 | 5 | 6 }
  | { readonly type: "barcodeLeftSpacing"; readonly units: number }
  | { readonly type: "hanziPrintMode"; readonly value: number }
  | { readonly type: "hanziMode"; readonly enabled: boolean }
  | { readonly type: "hanziUnderline"; readonly thickness: 0 | 1 | 2 }
  | {
      readonly type: "hanziSpacing";
      readonly left: number;
      readonly right: number;
    }
  | {
      readonly type: "qrCode";
      readonly version: number;
      readonly errorCorrection: "L" | "M" | "Q" | "H";
      readonly moduleSize: number;
      readonly data: ByteSource;
    }
  | { readonly type: "hanziQuadruple"; readonly enabled: boolean }
  | { readonly type: "realTimeStatus"; readonly status: 1 | 2 | 3 | 4 };

export interface UserDefinedCharacter {
  readonly width: number;
  readonly data: ByteSource;
}

export interface NvImage {
  readonly widthBytes: number;
  readonly heightBytes: number;
  readonly data: ByteSource;
}

export type ImageScale =
  "normal" | "doubleWidth" | "doubleHeight" | "quadruple";
export type Scale1To8 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type BarcodeSystem =
  | "upcA"
  | "upcE"
  | "ean13"
  | "ean8"
  | "code39"
  | "itf"
  | "codabar"
  | "code93"
  | "code128";

export type PrinterAlignment = "left" | "center" | "right";

export interface PrinterTextStyle {
  readonly font?: "A" | "B";
  readonly emphasized?: boolean;
  readonly underline?: 0 | 1 | 2;
  readonly width?: Scale1To8;
  readonly height?: Scale1To8;
  readonly reverse?: boolean;
}

export interface PrintTextOptions {
  readonly alignment?: PrinterAlignment;
  readonly style?: PrinterTextStyle;
  readonly encoding?: string;
  readonly appendLineFeed?: boolean;
}

export interface PrintBarcodeRequest {
  readonly system: BarcodeSystem;
  readonly data: ByteSource;
  readonly alignment?: PrinterAlignment;
  readonly width?: 2 | 3 | 4 | 5 | 6;
  readonly height?: number;
  readonly hriPosition?: "none" | "above" | "below" | "both";
  readonly hriFont?: "A" | "B";
}

export interface PrintQrCodeRequest {
  readonly data: ByteSource;
  readonly alignment?: PrinterAlignment;
  readonly version?: number;
  readonly errorCorrection?: "L" | "M" | "Q" | "H";
  readonly moduleSize?: number;
}

export interface PrintRasterImageRequest {
  readonly data: ByteSource;
  readonly widthBytes: number;
  readonly height: number;
  readonly alignment?: PrinterAlignment;
  readonly scale?: ImageScale;
}

export interface CashDrawerPulseOptions {
  readonly pin?: 2 | 5;
  readonly onTime2ms?: number;
  readonly offTime2ms?: number;
}

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
  readonly operations: readonly PrinterOperationName[];
  readonly features: readonly PrinterCapability[];
}

export type PrinterOperationName =
  | "initialize"
  | "printText"
  | "printBarcode"
  | "printQrCode"
  | "printRasterImage"
  | "setAlignment"
  | "setTextStyle"
  | "feed"
  | "cut"
  | "openCashDrawer"
  | "configure"
  | "getStatus"
  | "printSelfTest"
  | "printCodePageTable"
  | "restoreFactorySettings";

export interface PrinterConfiguration {
  readonly printingMode?: "ascii" | "chinese";
  readonly autoCut?: boolean;
  readonly densityLevel?: 1 | 2 | 3 | 4;
  readonly defaultCharacterSize?: "9x17" | "12x24" | "9x24";
  readonly usbProductId?: string;
  readonly codePage?: string;
  readonly dhcp?: boolean;
  readonly usbInterfaceMode?: "printer" | "virtualCom";
  readonly paperWidthMm?: number;
  readonly buzzer?: boolean;
  readonly baudRate?: number;
  readonly characterSet?: string;
  readonly voice?: boolean;
  readonly usbVendorId?: string;
  readonly cutterPit?: boolean;
  readonly printSpeed?: number;
  readonly usbPortAssignment?: "fixed" | "random";
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

export interface DeviceActionRequest {
  readonly action: string;
  readonly command?: string;
}

export interface PrinterAdapter {
  initialize(): Promise<void>;
  printText(text: string, options?: PrintTextOptions): Promise<void>;
  printBarcode(request: PrintBarcodeRequest): Promise<void>;
  printQrCode(request: PrintQrCodeRequest): Promise<void>;
  printRasterImage(request: PrintRasterImageRequest): Promise<void>;
  setAlignment(alignment: PrinterAlignment): Promise<void>;
  setTextStyle(style: PrinterTextStyle): Promise<void>;
  feed(lines?: number): Promise<void>;
  cut(feedUnits?: number): Promise<void>;
  openCashDrawer(options?: CashDrawerPulseOptions): Promise<void>;
  getStatus(): Promise<PrinterStatus>;
  getCapabilities(): PrinterCapabilities;
  configure(config: PrinterConfiguration): Promise<void>;
  printSelfTest(): Promise<void>;
  printCodePageTable(): Promise<void>;
  restoreFactorySettings(): Promise<void>;
  close(): Promise<void>;
}

/** Escape hatch for adapter development and diagnostics; application code should use PrinterAdapter. */
export interface LowLevelPrinterAdapter extends PrinterAdapter {
  print(payload: PrintPayload): Promise<void>;
  execute(instructions: readonly PrinterInstruction[]): Promise<void>;
  configureRaw(config: DeviceConfig): Promise<void>;
  performAction(action: DeviceActionRequest): Promise<void>;
  raw(bytes: ByteSource): Promise<void>;
}

export function toPrinterBytes(bytes: ByteSource): PrinterBytes {
  if (bytes instanceof Uint8Array) {
    return bytes;
  }

  if (ArrayBuffer.isView(bytes)) {
    return new Uint8Array(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    );
  }

  if (bytes instanceof ArrayBuffer) {
    return new Uint8Array(bytes);
  }

  const normalized = bytes.map((byte) => {
    if (!Number.isInteger(byte) || byte < 0 || byte > 255) {
      throw new RangeError(
        `Printer byte must be an integer from 0 to 255. Received: ${byte}`
      );
    }

    return byte;
  });

  return Uint8Array.from(normalized);
}
