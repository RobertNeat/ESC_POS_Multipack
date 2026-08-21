import {
  type ByteSource,
  type PrintQrCodeRequest,
  type PrintRasterImageRequest,
  type PrintTextOptions,
  type PrinterFontRole,
  type PrinterAlignment,
  type PrinterCapabilities,
  type PrinterStatus,
  type PrinterTransport,
  toPrinterBytes,
} from '@esc-pos-multipack/printer-adapter';
import {
  mapPos8370Configuration,
  type Pos8370Configuration,
} from './configuration.js';
import type {
  Pos8370ActionRequest,
  Pos8370CashDrawerPulseOptions,
  Pos8370DeviceConfig,
  Pos8370LowLevelAdapter,
  Pos8370PrintBarcodeRequest,
  Pos8370PrintPayload,
  Pos8370TextStyle,
} from './driver-contract.js';
import { encodePos8370Instruction, ESC_POS } from './esc-pos-commands.js';
import type { Pos8370Instruction } from './esc-pos-instruction.js';
import { PrinterConnection } from './printer-connection.js';
import { PrinterTaskQueue } from './printer-task-queue.js';
import { parsePos8370Status } from './status.js';
import { PrinterSettingsRepository } from './settings.js';
import { encodePos8370Text } from './text-encoding.js';

export interface Pos8370AdapterOptions {
  readonly transport: Pos8370Transport;
  readonly settingsRepository?: PrinterSettingsRepository;
  readonly textEncoder?: TextEncoder;
  readonly autoOpen?: boolean;
}

export interface Pos8370Transport extends PrinterTransport {
  readonly descriptor: PrinterTransport['descriptor'] & {
    readonly kind: 'usb' | 'lan';
  };
}

export function createPos8370Adapter(
  options: Pos8370AdapterOptions,
): Pos8370Adapter {
  return new Pos8370Adapter(options);
}

export class Pos8370Adapter implements Pos8370LowLevelAdapter {
  private readonly textEncoder: TextEncoder;
  private readonly connection: PrinterConnection;
  private readonly tasks = new PrinterTaskQueue();

  constructor(private readonly options: Pos8370AdapterOptions) {
    const transportKind: string = options.transport.descriptor.kind;
    if (transportKind !== 'usb' && transportKind !== 'lan') {
      throw new TypeError(
        `POS-8370 supports only USB or LAN transport. Received: ${transportKind}`,
      );
    }
    this.textEncoder = options.textEncoder ?? new TextEncoder();
    this.connection = new PrinterConnection(
      options.transport,
      options.autoOpen !== false,
    );
  }

  async printText(
    text: string,
    options: PrintTextOptions<Pos8370TextStyle> = {},
  ): Promise<void> {
    return this.tasks.run(async () => {
      if (options.alignment) await this.setAlignmentNow(options.alignment);
      if (options.style) await this.setTextStyleNow(options.style);
      const encoding = effectiveTextEncoding(
        options.encoding,
        options.style?.font,
      );
      await this.selectCodeTableForEncodingNow(encoding);
      const content = options.appendLineFeed === false ? text : `${text}\n`;
      await this.rawNow(this.encodeText(content, encoding));
    });
  }

  async printBarcode(request: Pos8370PrintBarcodeRequest): Promise<void> {
    return this.tasks.run(() => this.executeNow(barcodeInstructions(request)));
  }

  async printQrCode(request: PrintQrCodeRequest): Promise<void> {
    return this.tasks.run(async () => {
      if (request.alignment) await this.setAlignmentNow(request.alignment);
      await this.executeNow([
        {
          type: 'qrCode',
          version: request.version ?? 0,
          errorCorrection: request.errorCorrection ?? 'M',
          moduleSize: request.moduleSize ?? 3,
          data: request.data,
        },
      ]);
    });
  }

  async printRasterImage(request: PrintRasterImageRequest): Promise<void> {
    return this.tasks.run(async () => {
      if (request.alignment) await this.setAlignmentNow(request.alignment);
      await this.executeNow([
        {
          type: 'rasterImage',
          mode: request.scale ?? 'normal',
          widthBytes: request.widthBytes,
          height: request.height,
          data: request.data,
        },
      ]);
    });
  }

  async setAlignment(alignment: PrinterAlignment): Promise<void> {
    return this.tasks.run(() => this.setAlignmentNow(alignment));
  }

  async setTextStyle(style: Pos8370TextStyle): Promise<void> {
    return this.tasks.run(() => this.setTextStyleNow(style));
  }

  async feed(lines = 1): Promise<void> {
    return this.tasks.run(() =>
      this.executeNow([{ type: 'feedLines', lines }]),
    );
  }

  async openCashDrawer(
    options: Pos8370CashDrawerPulseOptions = {},
  ): Promise<void> {
    return this.tasks.run(() =>
      this.executeNow([
        {
          type: 'drawerPulse',
          pin: options.pin ?? 2,
          onTime2ms: options.onTime2ms ?? 64,
          offTime2ms: options.offTime2ms ?? 80,
        },
      ]),
    );
  }

  async print(payload: Pos8370PrintPayload): Promise<void> {
    return this.tasks.run(async () => {
      if (payload.type === 'raw') {
        await this.rawNow(payload.bytes);
        return;
      }

      if (payload.type === 'commands') {
        for (const command of payload.commands) {
          await this.rawNow(command);
        }
        return;
      }

      if (payload.type === 'instructions') {
        await this.executeNow(payload.instructions);
        return;
      }

      const text =
        payload.appendLineFeed === false ? payload.text : `${payload.text}\n`;
      await this.selectCodeTableForEncodingNow(payload.encoding);
      await this.rawNow(this.encodeText(text, payload.encoding));
    });
  }

  async getStatus(): Promise<PrinterStatus> {
    return this.tasks.run(() => this.getStatusNow());
  }

  getCapabilities(): PrinterCapabilities {
    return {
      model: 'BisOffice POS-8370',
      paperWidthsMm: [58, 80],
      dpi: 203,
      operations: [...SUPPORTED_OPERATIONS],
      features: [
        { name: 'text', supported: true },
        { name: 'qr', supported: true },
        { name: 'barcode', supported: true },
        { name: 'rasterBitmap', supported: true },
        {
          name: 'status',
          supported: this.options.transport.request !== undefined,
        },
        {
          name: 'settingsFromRawBytesJson',
          supported: Boolean(this.options.settingsRepository),
        },
        {
          name: 'capturedDeviceActions',
          supported: Boolean(this.options.settingsRepository),
        },
      ],
    };
  }

  async execute(instructions: readonly Pos8370Instruction[]): Promise<void> {
    return this.tasks.run(() => this.executeNow(instructions));
  }

  async performAction(request: Pos8370ActionRequest): Promise<void> {
    return this.tasks.run(() => this.performActionNow(request));
  }

  async configure(config: Pos8370Configuration): Promise<void> {
    return this.tasks.run(() =>
      this.configureRawNow({ entries: mapPos8370Configuration(config) }),
    );
  }

  async configureRaw(config: Pos8370DeviceConfig): Promise<void> {
    return this.tasks.run(() => this.configureRawNow(config));
  }

  async raw(bytes: ByteSource): Promise<void> {
    return this.tasks.run(() => this.rawNow(bytes));
  }

  async initialize(): Promise<void> {
    return this.tasks.run(() => this.rawNow(ESC_POS.initialize));
  }

  async cut(feedUnits?: number): Promise<void> {
    return this.tasks.run(() => this.executeNow([{ type: 'cut', feedUnits }]));
  }

  async printSelfTest(): Promise<void> {
    return this.tasks.run(() =>
      this.performActionNow({ action: 'Print SelfTest' }),
    );
  }

  async printCodePageTable(): Promise<void> {
    return this.tasks.run(() =>
      this.performActionNow({ action: 'Print Default Page' }),
    );
  }

  async restoreFactorySettings(): Promise<void> {
    return this.tasks.run(() =>
      this.performActionNow({ action: 'Restore factory' }),
    );
  }

  async close(): Promise<void> {
    return this.tasks.run(() => this.connection.close());
  }

  private async getStatusNow(): Promise<PrinterStatus> {
    if (!this.options.transport.request) {
      await this.connection.run(() => Promise.resolve());
      return {
        online: true,
      };
    }

    return this.connection.run(async () => {
      // A transport generally has one response stream; keep request/response pairs ordered.
      const printer = await this.requestStatusByte(1);
      const offline = await this.requestStatusByte(2);
      const error = await this.requestStatusByte(3);
      const paper = await this.requestStatusByte(4);

      return parsePos8370Status({ printer, offline, error, paper });
    }, true);
  }

  private async executeNow(
    instructions: readonly Pos8370Instruction[],
  ): Promise<void> {
    for (const instruction of instructions) {
      await this.rawNow(encodePos8370Instruction(instruction));
    }
  }

  private async performActionNow(request: Pos8370ActionRequest): Promise<void> {
    if (!this.options.settingsRepository) {
      throw new Error(
        'POS-8370 settings repository is required for captured device actions.',
      );
    }
    for (const command of this.options.settingsRepository.getActionCommands(
      request.action,
      request.command,
    )) {
      await this.rawNow(command);
    }
  }

  private async configureRawNow(config: Pos8370DeviceConfig): Promise<void> {
    for (const entry of config.entries) {
      if (isRawConfigEntry(entry)) {
        await this.rawNow(entry.bytes);
        continue;
      }

      if (!this.options.settingsRepository) {
        throw new Error(
          'POS-8370 settings repository is required for named configuration entries.',
        );
      }

      await this.rawNow(
        this.options.settingsRepository.getCommandBytes(
          entry.setting,
          entry.option,
        ),
      );
    }
  }

  private async rawNow(bytes: ByteSource): Promise<void> {
    const printerBytes = toPrinterBytes(bytes);
    await this.connection.run(() => this.options.transport.write(printerBytes));
  }

  private setAlignmentNow(alignment: PrinterAlignment): Promise<void> {
    return this.executeNow([{ type: 'justification', value: alignment }]);
  }

  private setTextStyleNow(style: Pos8370TextStyle): Promise<void> {
    return this.executeNow(textStyleInstructions(style));
  }

  private async requestStatusByte(n: 1 | 2 | 3 | 4): Promise<number> {
    const response = await this.options.transport.request?.(
      ESC_POS.realTimeStatus(n),
      1,
    );
    return response?.[0] ?? 0;
  }

  private encodeText(text: string, encoding?: string): Uint8Array {
    if (!encoding || encoding.toLowerCase().replace(/[-_]/g, '') === 'utf8') {
      return this.textEncoder.encode(text);
    }
    return encodePos8370Text(text, encoding);
  }

  private async selectCodeTableForEncodingNow(
    encoding?: string,
  ): Promise<void> {
    const table = codeTableForEncoding(encoding);
    if (table !== undefined) {
      await this.executeNow([{ type: 'codeTable', table }]);
    }
  }
}

const SUPPORTED_OPERATIONS = [
  'initialize',
  'printText',
  'printBarcode',
  'printQrCode',
  'printRasterImage',
  'setAlignment',
  'setTextStyle',
  'feed',
  'cut',
  'openCashDrawer',
  'configure',
  'getStatus',
  'printSelfTest',
  'printCodePageTable',
  'restoreFactorySettings',
] as const;

function isRawConfigEntry(
  entry: Pos8370DeviceConfig['entries'][number],
): entry is Pos8370DeviceConfig['entries'][number] & {
  readonly bytes: ByteSource;
} {
  return 'bytes' in entry;
}

function codeTableForEncoding(encoding?: string): number | undefined {
  const normalized = encoding?.toLowerCase().replace(/[-_]/g, '');
  if (
    normalized === 'cp852' ||
    normalized === 'ibm852' ||
    normalized === 'oem852'
  )
    return 0x12;
  if (
    normalized === 'windows1250' ||
    normalized === 'win1250' ||
    normalized === 'cp1250'
  )
    return 0x48;
  if (
    normalized === 'cp3843' ||
    normalized === 'pc3843' ||
    normalized === 'mazovia'
  )
    return 0x4c;
  return undefined;
}

function effectiveTextEncoding(
  requested: string | undefined,
  font: Pos8370TextStyle['font'],
): string | undefined {
  // POS-8370 exposes its extended Windows-1250 and PC3843 pages only through
  // persistent configuration. Compact fonts reliably support the runtime-
  // selectable OEM852 table, so encode and select it as one atomic choice.
  return font === 'B' || font === 'specialB' ? 'cp852' : requested;
}

function barcodeInstructions(
  request: Pos8370PrintBarcodeRequest,
): readonly Pos8370Instruction[] {
  const instructions: Pos8370Instruction[] = [];
  if (request.alignment)
    instructions.push({ type: 'justification', value: request.alignment });
  if (request.width)
    instructions.push({ type: 'barcodeWidth', width: request.width });
  if (request.height !== undefined)
    instructions.push({ type: 'barcodeHeight', dots: request.height });
  if (request.hriPosition)
    instructions.push({ type: 'hriPosition', position: request.hriPosition });
  if (request.hriFont) {
    instructions.push({
      type: 'hriFont',
      font: pos8370HriFont(request.hriFont),
    });
  }
  instructions.push({
    type: 'barcode',
    system: request.system,
    data: request.data,
  });
  return instructions;
}

function textStyleInstructions(
  style: Pos8370TextStyle,
): readonly Pos8370Instruction[] {
  const instructions: Pos8370Instruction[] = [];
  if (style.font)
    instructions.push({ type: 'font', font: pos8370Font(style.font) });
  if (style.emphasized !== undefined)
    instructions.push({ type: 'emphasized', enabled: style.emphasized });
  if (style.underline !== undefined)
    instructions.push({ type: 'underline', thickness: style.underline });
  if (style.width !== undefined || style.height !== undefined) {
    instructions.push({
      type: 'characterSize',
      width: style.width ?? 1,
      height: style.height ?? 1,
    });
  }
  if (style.reverse !== undefined)
    instructions.push({ type: 'reverse', enabled: style.reverse });
  return instructions;
}

function pos8370Font(
  font: PrinterFontRole | 'A' | 'B' | 'specialB',
): 'A' | 'B' | 'specialB' {
  if (font === 'primary') return 'A';
  if (font === 'secondary') return 'B';
  return font;
}

function pos8370HriFont(font: PrinterFontRole | 'A' | 'B'): 'A' | 'B' {
  if (font === 'primary') return 'A';
  if (font === 'secondary') return 'B';
  return font;
}
