import { ByteSource, PrinterBytes, toPrinterBytes } from "@esc-pos-multipack/printer-adapter";

export interface Pos8370SettingOptionDefinition {
  readonly id: string;
  readonly label: string;
  readonly rawBytes: ByteSource;
}

export interface Pos8370SettingDefinition {
  readonly title: string;
  readonly description?: string;
  readonly options: readonly Pos8370SettingOptionDefinition[];
}

export interface Pos8370SettingsDocument {
  readonly printer?: string;
  readonly settings: readonly Pos8370SettingDefinition[];
  readonly actions: readonly Pos8370ActionDefinition[];
}

export interface Pos8370ActionCommandDefinition {
  readonly id: string;
  readonly label: string;
  readonly rawBytes: ByteSource;
}

export interface Pos8370ActionDefinition {
  readonly title: string;
  readonly description?: string;
  readonly commands: readonly Pos8370ActionCommandDefinition[];
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
  getActionCommands(action: string, command?: string): readonly PrinterBytes[];
  listActions(): readonly Pos8370ActionDefinition[];
}

export class InMemoryPrinterSettingsRepository implements PrinterSettingsRepository {
  private readonly bySetting = new Map<string, Map<string, PrinterBytes>>();
  private readonly byAction = new Map<string, Map<string, PrinterBytes>>();

  constructor(
    private readonly settings: readonly Pos8370SettingDefinition[],
    private readonly actions: readonly Pos8370ActionDefinition[] = []
  ) {
    for (const setting of settings) {
      const options = new Map<string, PrinterBytes>();
      const labelCounts = new Map<string, number>();
      for (const option of setting.options) {
        const key = normalizeKey(option.label);
        labelCounts.set(key, (labelCounts.get(key) ?? 0) + 1);
      }

      for (const option of setting.options) {
        const bytes = toPrinterBytes(option.rawBytes);
        options.set(normalizeKey(option.id), bytes);
        const labelKey = normalizeKey(option.label);
        if (labelCounts.get(labelKey) === 1) {
          options.set(labelKey, bytes);
        }
      }

      this.bySetting.set(normalizeKey(setting.title), options);
    }

    for (const action of actions) {
      const commands = new Map<string, PrinterBytes>();
      for (const command of action.commands) {
        const bytes = toPrinterBytes(command.rawBytes);
        commands.set(normalizeKey(command.id), bytes);
        commands.set(normalizeKey(command.label), bytes);
      }
      this.byAction.set(normalizeKey(action.title), commands);
    }
  }

  static fromJson(value: unknown): InMemoryPrinterSettingsRepository {
    const document = parseSettingsDocument(value);
    return new InMemoryPrinterSettingsRepository(document.settings, document.actions);
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

  getActionCommands(action: string, command?: string): readonly PrinterBytes[] {
    const commands = this.byAction.get(normalizeKey(action));
    if (!commands) {
      throw new Error(`Unknown POS-8370 action: ${action}`);
    }
    if (command !== undefined) {
      const bytes = commands.get(normalizeKey(command));
      if (!bytes) {
        throw new Error(`Unknown POS-8370 command "${command}" for action "${action}"`);
      }
      return [bytes];
    }

    const definition = this.actions.find((item) => normalizeKey(item.title) === normalizeKey(action));
    return definition?.commands.map((item) => toPrinterBytes(item.rawBytes)) ?? [];
  }

  listActions(): readonly Pos8370ActionDefinition[] {
    return this.actions;
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
    printer: typeof value.printer === "string" ? value.printer : undefined,
    settings: value.settings.map(parseSetting),
    actions: Array.isArray(value.buttons) ? value.buttons.map(parseAction) : []
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
        options: item.option.map((label, index) => ({
          id: createId(label, index),
          label,
          rawBytes: []
        }))
      };
    }),
    actions: []
  };
}

function parseSetting(value: unknown): Pos8370SettingDefinition {
  if (!isRecord(value) || typeof value.title !== "string" || !Array.isArray(value.options)) {
    throw new TypeError("Printer setting must contain title and options array.");
  }

  return {
    title: value.title,
    description: typeof value.description === "string" ? value.description : undefined,
    options: value.options.map((option, index) => parseOption(option, index))
  };
}

function parseOption(value: unknown, index: number): Pos8370SettingOptionDefinition {
  if (!isRecord(value) || typeof value.label !== "string") {
    throw new TypeError("Printer setting option must contain label.");
  }

  const rawBytes = value.commandHex ?? value.rawBytes ?? value.bytes ?? value.commandBytes;

  if (rawBytes === undefined) {
    throw new TypeError(`Printer setting option "${value.label}" must contain commandHex or rawBytes.`);
  }

  return {
    id: typeof value.id === "string" ? value.id : createId(value.label, index),
    label: value.label,
    rawBytes: parseByteSource(rawBytes)
  };
}

function parseAction(value: unknown): Pos8370ActionDefinition {
  if (!isRecord(value) || typeof value.title !== "string" || !Array.isArray(value.commands)) {
    throw new TypeError("Printer action must contain title and commands array.");
  }
  return {
    title: value.title,
    description: typeof value.description === "string" ? value.description : undefined,
    commands: value.commands.map((command, index) => {
      const parsed = parseOption(command, index);
      return parsed;
    })
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
    return tokens.map((token) => {
      if (!/^(?:0x)?[0-9a-f]{1,2}$/i.test(token)) {
        throw new TypeError(`Invalid hexadecimal byte: ${token}`);
      }
      return Number.parseInt(token.replace(/^0x/i, ""), 16);
    });
  }

  throw new TypeError("rawBytes must be a byte array or a hexadecimal string.");
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function createId(label: string, index: number): string {
  return `${normalizeKey(label).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "option"}-${index + 1}`;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}
