import {
  ByteSource,
  DeviceConfig,
  DeviceRawConfigEntry,
  PrintPayload,
  PrinterAdapter,
  PrinterCapabilities,
  PrinterStatus,
  PrinterTransport,
  toPrinterBytes
} from "@esc-pos-multipack/printer-adapter";
import { ESC_POS } from "./esc-pos-commands.js";
import { parsePos8370Status } from "./status.js";
import { PrinterSettingsRepository } from "./settings.js";

export interface Pos8370AdapterOptions {
  readonly transport: PrinterTransport;
  readonly settingsRepository?: PrinterSettingsRepository;
  readonly textEncoder?: TextEncoder;
  readonly autoOpen?: boolean;
}

export class Pos8370Adapter implements PrinterAdapter {
  private readonly textEncoder: TextEncoder;
  private opened = false;

  constructor(private readonly options: Pos8370AdapterOptions) {
    this.textEncoder = options.textEncoder ?? new TextEncoder();
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

    const text = payload.appendLineFeed === false ? payload.text : `${payload.text}\n`;
    await this.raw(this.textEncoder.encode(text));
  }

  async getStatus(): Promise<PrinterStatus> {
    await this.ensureOpen();

    if (!this.options.transport.request) {
      return {
        online: true
      };
    }

    const [printer, offline, error, paper] = await Promise.all([
      this.requestStatusByte(1),
      this.requestStatusByte(2),
      this.requestStatusByte(3),
      this.requestStatusByte(4)
    ]);

    return parsePos8370Status({ printer, offline, error, paper });
  }

  getCapabilities(): PrinterCapabilities {
    return {
      model: "BisOffice POS-8370",
      paperWidthsMm: [58, 80],
      dpi: 203,
      commands: [
        "ESC @",
        "ESC ! n",
        "ESC B n t",
        "ESC M n",
        "ESC a n",
        "ESC Z",
        "GS V",
        "GS k",
        "GS v 0",
        "DLE EOT n",
        "FS &",
        "FS ."
      ],
      features: [
        { name: "text", supported: true },
        { name: "raw", supported: true },
        { name: "qr", supported: true },
        { name: "barcode", supported: true },
        { name: "rasterBitmap", supported: true },
        { name: "status", supported: Boolean(this.options.transport.request) },
        { name: "settingsFromRawBytesJson", supported: Boolean(this.options.settingsRepository) }
      ]
    };
  }

  async configure(config: DeviceConfig): Promise<void> {
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
    await this.ensureOpen();
    await this.options.transport.write(toPrinterBytes(bytes));
  }

  async initialize(): Promise<void> {
    await this.raw(ESC_POS.initialize);
  }

  async cut(mode: "full" | "partial" = "full"): Promise<void> {
    await this.raw(mode === "full" ? ESC_POS.fullCut : ESC_POS.partialCut);
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

  private async ensureOpen(): Promise<void> {
    if (this.opened || this.options.autoOpen === false) {
      return;
    }

    if (this.options.transport.open) {
      await this.options.transport.open();
    }

    this.opened = true;
  }
}

function isRawConfigEntry(entry: DeviceConfig["entries"][number]): entry is DeviceRawConfigEntry {
  return "bytes" in entry;
}

