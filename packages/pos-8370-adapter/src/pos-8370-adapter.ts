import {
  ByteSource,
  CashDrawerPulseOptions,
  DeviceConfig,
  DeviceRawConfigEntry,
  DeviceActionRequest,
  LowLevelPrinterAdapter,
  PrintPayload,
  PrintBarcodeRequest,
  PrintQrCodeRequest,
  PrintRasterImageRequest,
  PrintTextOptions,
  PrinterAdapter,
  PrinterAlignment,
  PrinterCapabilities,
  PrinterConfiguration,
  PrinterInstruction,
  PrinterStatus,
  PrinterTextStyle,
  PrinterTransport,
  toPrinterBytes
} from "@esc-pos-multipack/printer-adapter";
import { encodePos8370Instruction, ESC_POS } from "./esc-pos-commands.js";
import { parsePos8370Status } from "./status.js";
import { PrinterSettingsRepository } from "./settings.js";
import { encodePos8370Text } from "./text-encoding.js";

export interface Pos8370AdapterOptions {
  readonly transport: Pos8370Transport;
  readonly settingsRepository?: PrinterSettingsRepository;
  readonly textEncoder?: TextEncoder;
  readonly autoOpen?: boolean;
}

export interface Pos8370Transport extends PrinterTransport {
  readonly descriptor: PrinterTransport["descriptor"] & { readonly kind: "usb" | "lan" };
}

export function createPos8370Adapter(options: Pos8370AdapterOptions): PrinterAdapter {
  return new Pos8370Adapter(options);
}

export class Pos8370Adapter implements LowLevelPrinterAdapter {
  private readonly textEncoder: TextEncoder;
  private opened = false;

  constructor(private readonly options: Pos8370AdapterOptions) {
    if (options.transport.descriptor.kind !== "usb" && options.transport.descriptor.kind !== "lan") {
      throw new TypeError(`POS-8370 supports only USB or LAN transport. Received: ${options.transport.descriptor.kind}`);
    }
    this.textEncoder = options.textEncoder ?? new TextEncoder();
  }

  async printText(text: string, options: PrintTextOptions = {}): Promise<void> {
    if (options.alignment) await this.setAlignment(options.alignment);
    if (options.style) await this.setTextStyle(options.style);
    const encoding = effectiveTextEncoding(options.encoding, options.style?.font);
    await this.selectCodeTableForEncoding(encoding);
    const content = options.appendLineFeed === false ? text : `${text}\n`;
    await this.raw(this.encodeText(content, encoding));
  }

  async printBarcode(request: PrintBarcodeRequest): Promise<void> {
    const instructions: PrinterInstruction[] = [];
    if (request.alignment) instructions.push({ type: "justification", value: request.alignment });
    if (request.width) instructions.push({ type: "barcodeWidth", width: request.width });
    if (request.height !== undefined) instructions.push({ type: "barcodeHeight", dots: request.height });
    if (request.hriPosition) instructions.push({ type: "hriPosition", position: request.hriPosition });
    if (request.hriFont) instructions.push({ type: "hriFont", font: request.hriFont });
    instructions.push({ type: "barcode", system: request.system, data: request.data });
    await this.execute(instructions);
  }

  async printQrCode(request: PrintQrCodeRequest): Promise<void> {
    if (request.alignment) await this.setAlignment(request.alignment);
    await this.execute([{
      type: "qrCode",
      version: request.version ?? 0,
      errorCorrection: request.errorCorrection ?? "M",
      moduleSize: request.moduleSize ?? 3,
      data: request.data
    }]);
  }

  async printRasterImage(request: PrintRasterImageRequest): Promise<void> {
    if (request.alignment) await this.setAlignment(request.alignment);
    await this.execute([{
      type: "rasterImage",
      mode: request.scale ?? "normal",
      widthBytes: request.widthBytes,
      height: request.height,
      data: request.data
    }]);
  }

  async setAlignment(alignment: PrinterAlignment): Promise<void> {
    await this.execute([{ type: "justification", value: alignment }]);
  }

  async setTextStyle(style: PrinterTextStyle): Promise<void> {
    const instructions: PrinterInstruction[] = [];
    if (style.font) instructions.push({ type: "font", font: style.font });
    if (style.emphasized !== undefined) instructions.push({ type: "emphasized", enabled: style.emphasized });
    if (style.underline !== undefined) instructions.push({ type: "underline", thickness: style.underline });
    if (style.width !== undefined || style.height !== undefined) {
      instructions.push({ type: "characterSize", width: style.width ?? 1, height: style.height ?? 1 });
    }
    if (style.reverse !== undefined) instructions.push({ type: "reverse", enabled: style.reverse });
    await this.execute(instructions);
  }

  async feed(lines = 1): Promise<void> {
    await this.execute([{ type: "feedLines", lines }]);
  }

  async openCashDrawer(options: CashDrawerPulseOptions = {}): Promise<void> {
    await this.execute([{
      type: "drawerPulse",
      pin: options.pin ?? 2,
      onTime2ms: options.onTime2ms ?? 64,
      offTime2ms: options.offTime2ms ?? 80
    }]);
  }

  async print(payload: PrintPayload): Promise<void> {
    await this.ensureOpen();

    if (payload.type === "raw") {
      await this.raw(payload.bytes);
      return;
    }

    if (payload.type === "commands") {
      for (const command of payload.commands) {
        await this.raw(command);
      }

      return;
    }

    if (payload.type === "instructions") {
      await this.execute(payload.instructions);
      return;
    }

    const text = payload.appendLineFeed === false ? payload.text : `${payload.text}\n`;
    await this.selectCodeTableForEncoding(payload.encoding);
    await this.raw(this.encodeText(text, payload.encoding));
  }

  async getStatus(): Promise<PrinterStatus> {
    if (!this.options.transport.request) {
      await this.ensureOpen();
      return {
        online: true
      };
    }

    return this.withConnection(async () => {
      // A transport generally has one response stream; keep request/response pairs ordered.
      const printer = await this.requestStatusByte(1);
      const offline = await this.requestStatusByte(2);
      const error = await this.requestStatusByte(3);
      const paper = await this.requestStatusByte(4);

      return parsePos8370Status({ printer, offline, error, paper });
    }, true);
  }

  getCapabilities(): PrinterCapabilities {
    return {
      model: "BisOffice POS-8370",
      paperWidthsMm: [58, 80],
      dpi: 203,
      operations: [...SUPPORTED_OPERATIONS],
      features: [
        { name: "text", supported: true },
        { name: "qr", supported: true },
        { name: "barcode", supported: true },
        { name: "rasterBitmap", supported: true },
        { name: "status", supported: Boolean(this.options.transport.request) },
        { name: "settingsFromRawBytesJson", supported: Boolean(this.options.settingsRepository) },
        { name: "capturedDeviceActions", supported: Boolean(this.options.settingsRepository) }
      ]
    };
  }

  async execute(instructions: readonly PrinterInstruction[]): Promise<void> {
    await this.ensureOpen();
    for (const instruction of instructions) {
      await this.raw(encodePos8370Instruction(instruction));
    }
  }

  async performAction(request: DeviceActionRequest): Promise<void> {
    await this.ensureOpen();
    if (!this.options.settingsRepository) {
      throw new Error("POS-8370 settings repository is required for captured device actions.");
    }
    for (const command of this.options.settingsRepository.getActionCommands(request.action, request.command)) {
      await this.raw(command);
    }
  }

  async configure(config: PrinterConfiguration): Promise<void> {
    const entries = configurationEntries(config);
    await this.configureRaw({ entries });
  }

  async configureRaw(config: DeviceConfig): Promise<void> {
    await this.ensureOpen();

    for (const entry of config.entries) {
      if (isRawConfigEntry(entry)) {
        await this.raw(entry.bytes);
        continue;
      }

      if (!this.options.settingsRepository) {
        throw new Error("POS-8370 settings repository is required for named configuration entries.");
      }

      await this.raw(this.options.settingsRepository.getCommandBytes(entry.setting, entry.option));
    }
  }

  async raw(bytes: ByteSource): Promise<void> {
    const printerBytes = toPrinterBytes(bytes);
    await this.withConnection(() => this.options.transport.write(printerBytes));
  }

  async initialize(): Promise<void> {
    await this.raw(ESC_POS.initialize);
  }

  async cut(feedUnits?: number): Promise<void> {
    await this.execute([{ type: "cut", feedUnits }]);
  }

  async printSelfTest(): Promise<void> {
    await this.performAction({ action: "Print SelfTest" });
  }

  async printCodePageTable(): Promise<void> {
    await this.performAction({ action: "Print Default Page" });
  }

  async restoreFactorySettings(): Promise<void> {
    await this.performAction({ action: "Restore factory" });
  }

  async close(): Promise<void> {
    if (this.opened && this.options.transport.close) {
      await this.options.transport.close();
    }

    this.opened = false;
  }

  private async requestStatusByte(n: 1 | 2 | 3 | 4): Promise<number> {
    const response = await this.options.transport.request?.(ESC_POS.realTimeStatus(n), 1);
    return response?.[0] ?? 0;
  }

  private encodeText(text: string, encoding?: string): Uint8Array {
    if (!encoding || encoding.toLowerCase().replace(/[-_]/g, "") === "utf8") {
      return this.textEncoder.encode(text);
    }
    return encodePos8370Text(text, encoding);
  }

  private async selectCodeTableForEncoding(encoding?: string): Promise<void> {
    const table = codeTableForEncoding(encoding);
    if (table !== undefined) {
      await this.execute([{ type: "codeTable", table }]);
    }
  }

  private async ensureOpen(): Promise<void> {
    if (this.opened || this.options.autoOpen === false) {
      return;
    }

    if (this.options.transport.open) {
      await this.options.transport.open();
    }

    this.opened = true;
  }

  private async withConnection<T>(operation: () => Promise<T>, retry = false): Promise<T> {
    await this.ensureOpen();
    try {
      return await operation();
    } catch (error) {
      await this.resetConnection();
      if (!retry) throw error;
    }

    await this.ensureOpen();
    try {
      return await operation();
    } catch (error) {
      await this.resetConnection();
      throw error;
    }
  }

  private async resetConnection(): Promise<void> {
    this.opened = false;
    try {
      await this.options.transport.close?.();
    } catch {
      // Preserve the original I/O error. A failed close must not keep the adapter open.
    }
  }
}

const SUPPORTED_OPERATIONS = [
  "initialize", "printText", "printBarcode", "printQrCode", "printRasterImage",
  "setAlignment", "setTextStyle", "feed", "cut", "openCashDrawer", "configure",
  "getStatus", "printSelfTest", "printCodePageTable", "restoreFactorySettings"
] as const;

function configurationEntries(config: PrinterConfiguration): DeviceConfig["entries"] {
  const entries: { setting: string; option: string }[] = [];
  const add = (setting: string, option: string | number | undefined): void => {
    if (option !== undefined) entries.push({ setting, option: String(option) });
  };

  add("Set Printing mode", config.printingMode && ({ ascii: "ASCII", chinese: "Chinese" } as const)[config.printingMode]);
  add("Cutting Setting", booleanOption(config.autoCut));
  add("Set Density Level", config.densityLevel && ({ 1: "Level1_Light", 2: "Level2_Light", 3: "Level3_Dark", 4: "Level4_Dark" } as const)[config.densityLevel]);
  add("Set Default Char", config.defaultCharacterSize && `ASCII:${config.defaultCharacterSize}`);
  add("USB PID Set", config.usbProductId);
  add("Set Default Page", config.codePage);
  add("Setting DHCP", config.dhcp === undefined ? undefined : config.dhcp ? "ENABLE" : "DISABLE");
  add("USB Type", config.usbInterfaceMode && ({ printer: "PRINTER", virtualCom: "VCOM" } as const)[config.usbInterfaceMode]);
  add("Print width", config.paperWidthMm === undefined ? undefined : `${config.paperWidthMm}mm`);
  add("Set up the buzzer", booleanOption(config.buzzer));
  add("Set Printer Baud", config.baudRate);
  add("Set Font", config.characterSet);
  add("Set Voice swith", booleanOption(config.voice));
  add("USB VID Set", config.usbVendorId);
  add("Enable Cutter(PIT)", booleanOption(config.cutterPit));
  add("Setting speed", config.printSpeed);
  add("USB Port", config.usbPortAssignment && ({ fixed: "Fix USB", random: "Random USB" } as const)[config.usbPortAssignment]);
  return entries;
}

function booleanOption(value: boolean | undefined): string | undefined {
  return value === undefined ? undefined : value ? "ON" : "OFF";
}

function isRawConfigEntry(entry: DeviceConfig["entries"][number]): entry is DeviceRawConfigEntry {
  return "bytes" in entry;
}

function codeTableForEncoding(encoding?: string): number | undefined {
  const normalized = encoding?.toLowerCase().replace(/[-_]/g, "");
  if (normalized === "cp852" || normalized === "ibm852" || normalized === "oem852") return 0x12;
  if (normalized === "windows1250" || normalized === "win1250" || normalized === "cp1250") return 0x48;
  if (normalized === "cp3843" || normalized === "pc3843" || normalized === "mazovia") return 0x4c;
  return undefined;
}

function effectiveTextEncoding(
  requested: string | undefined,
  font: PrinterTextStyle["font"],
): string | undefined {
  // POS-8370 exposes its extended Windows-1250 and PC3843 pages only through
  // persistent configuration. Compact fonts reliably support the runtime-
  // selectable OEM852 table, so encode and select it as one atomic choice.
  return font === "B" || font === "specialB" ? "cp852" : requested;
}
