import { ByteSource, PrinterBytes, toPrinterBytes } from "@esc-pos-multipack/printer-adapter";

export interface Pos8370SettingOptionDefinition {
  readonly label: string;
  readonly rawBytes: ByteSource;
}

export interface Pos8370SettingDefinition {
  readonly title: string;
  readonly description?: string;
  readonly options: readonly Pos8370SettingOptionDefinition[];
}

export interface Pos8370SettingsDocument {
  readonly settings: readonly Pos8370SettingDefinition[];
}

type LegacyMockSetting = {
  readonly title: string;
  readonly description?: string;
  readonly option: readonly string[];
};

type JsonRecord = Record<string, unknown>;

export interface PrinterSettingsRepository {
  getCommandBytes(setting: string, option: string): PrinterBytes;
  listSettings(): readonly Pos8370SettingDefinition[];
}

export class InMemoryPrinterSettingsRepository implements PrinterSettingsRepository {
  private readonly bySetting = new Map<string, Map<string, PrinterBytes>>();

  constructor(private readonly settings: readonly Pos8370SettingDefinition[]) {
    for (const setting of settings) {
      const options = new Map<string, PrinterBytes>();

      for (const option of setting.options) {
        options.set(normalizeKey(option.label), toPrinterBytes(option.rawBytes));
      }

      this.bySetting.set(normalizeKey(setting.title), options);
    }
  }

  static fromJson(value: unknown): InMemoryPrinterSettingsRepository {
    const document = parseSettingsDocument(value);
    return new InMemoryPrinterSettingsRepository(document.settings);
  }

  getCommandBytes(setting: string, option: string): PrinterBytes {
    const options = this.bySetting.get(normalizeKey(setting));

    if (!options) {
      throw new Error(`Unknown POS-8370 setting: ${setting}`);
    }

    const bytes = options.get(normalizeKey(option));

    if (!bytes) {
      throw new Error(`Unknown POS-8370 option "${option}" for setting "${setting}"`);
    }

    return bytes;
  }

  listSettings(): readonly Pos8370SettingDefinition[] {
    return this.settings;
  }
}

export function parseSettingsDocument(value: unknown): Pos8370SettingsDocument {
  if (Array.isArray(value)) {
    return fromLegacyMock(value as readonly LegacyMockSetting[]);
  }

  if (!isRecord(value) || !Array.isArray(value.settings)) {
    throw new TypeError("Printer settings JSON must be an array or an object with a settings array.");
  }

  return {
    settings: value.settings.map(parseSetting)
  };
}

function fromLegacyMock(items: readonly LegacyMockSetting[]): Pos8370SettingsDocument {
  return {
    settings: items.map((item) => {
      if (!item || typeof item.title !== "string" || !Array.isArray(item.option)) {
        throw new TypeError("Legacy printer settings entries must contain title and option array.");
      }

      return {
        title: item.title,
        description: item.description,
        options: item.option.map((label) => ({
          label,
          rawBytes: []
        }))
      };
    })
  };
}

function parseSetting(value: unknown): Pos8370SettingDefinition {
  if (!isRecord(value) || typeof value.title !== "string" || !Array.isArray(value.options)) {
    throw new TypeError("Printer setting must contain title and options array.");
  }

  return {
    title: value.title,
    description: typeof value.description === "string" ? value.description : undefined,
    options: value.options.map(parseOption)
  };
}

function parseOption(value: unknown): Pos8370SettingOptionDefinition {
  if (!isRecord(value) || typeof value.label !== "string") {
    throw new TypeError("Printer setting option must contain label.");
  }

  const rawBytes = value.rawBytes ?? value.bytes ?? value.commandBytes;

  if (rawBytes === undefined) {
    throw new TypeError(`Printer setting option "${value.label}" must contain rawBytes.`);
  }

  return {
    label: value.label,
    rawBytes: parseByteSource(rawBytes)
  };
}

function parseByteSource(value: unknown): ByteSource {
  if (Array.isArray(value)) {
    return value.map((byte) => {
      if (typeof byte !== "number") {
        throw new TypeError("Byte arrays may contain only numbers.");
      }

      return byte;
    });
  }

  if (typeof value === "string") {
    const tokens = value.trim().split(/[\s,]+/).filter(Boolean);
    return tokens.map((token) => Number.parseInt(token.replace(/^0x/i, ""), 16));
  }

  throw new TypeError("rawBytes must be a byte array or a hexadecimal string.");
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}
