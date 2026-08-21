import type {
  ByteSource,
  PrintBarcodeRequest,
  ReceiptPrinterAdapter,
  PrinterFontRole,
  PrinterTextStyle,
} from '@esc-pos-multipack/printer-adapter';
import type {
  Pos8370Configuration,
  Pos8370NamedConfigEntry,
} from './configuration.js';
import type { Pos8370Instruction } from './esc-pos-instruction.js';

export type Pos8370PrintPayload =
  | { readonly type: 'raw'; readonly bytes: ByteSource }
  | { readonly type: 'commands'; readonly commands: readonly ByteSource[] }
  | {
      readonly type: 'text';
      readonly text: string;
      readonly encoding?: string;
      readonly appendLineFeed?: boolean;
    }
  | {
      readonly type: 'instructions';
      readonly instructions: readonly Pos8370Instruction[];
    };

export type Pos8370ConfigEntry =
  | Pos8370NamedConfigEntry
  | {
      readonly setting: string;
      readonly option: string;
      readonly bytes: ByteSource;
    };

export interface Pos8370DeviceConfig {
  readonly entries: readonly Pos8370ConfigEntry[];
}

export interface Pos8370ActionRequest {
  readonly action: string;
  readonly command?: string;
}

export interface Pos8370Configurator {
  configure(config: Pos8370Configuration): Promise<void>;
}

export interface Pos8370Diagnostics {
  printSelfTest(): Promise<void>;
  printCodePageTable(): Promise<void>;
  restoreFactorySettings(): Promise<void>;
}

export type Pos8370Font = 'A' | 'B' | 'specialB';
export type Pos8370TextStyle = PrinterTextStyle<PrinterFontRole | Pos8370Font>;

export interface Pos8370PrintBarcodeRequest extends Omit<
  PrintBarcodeRequest,
  'hriFont'
> {
  readonly hriFont?: PrinterFontRole | 'A' | 'B';
}

/** Physical pulse values exposed only by the POS-8370 driver surface. */
export interface Pos8370CashDrawerPulseOptions {
  readonly pin?: 2 | 5;
  readonly onTime2ms?: number;
  readonly offTime2ms?: number;
}

/** Driver-only surface. Application services should prefer the high-level methods. */
export interface Pos8370LowLevelAdapter
  extends
    ReceiptPrinterAdapter<Pos8370TextStyle>,
    Pos8370Configurator,
    Pos8370Diagnostics {
  printBarcode(request: Pos8370PrintBarcodeRequest): Promise<void>;
  openCashDrawer(options?: Pos8370CashDrawerPulseOptions): Promise<void>;
  print(payload: Pos8370PrintPayload): Promise<void>;
  execute(instructions: readonly Pos8370Instruction[]): Promise<void>;
  configureRaw(config: Pos8370DeviceConfig): Promise<void>;
  performAction(action: Pos8370ActionRequest): Promise<void>;
  raw(bytes: ByteSource): Promise<void>;
}
