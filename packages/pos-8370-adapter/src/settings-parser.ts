import {
  type PrinterBytes,
  toPrinterBytes,
} from '@esc-pos-multipack/printer-adapter';

import {
  assertUniqueIds,
  countKeys,
  createSlug,
  normalizeKey,
} from './settings-identifiers.js';
import type {
  Pos8370ActionDefinition,
  Pos8370SettingDefinition,
  Pos8370SettingOptionDefinition,
  Pos8370SettingsDocument,
} from './settings-model.js';

export function parseSettingsDocument(value: unknown): Pos8370SettingsDocument {
  if (Array.isArray(value)) {
    throw new Error(
      'Legacy POS-8370 settings arrays are unsupported because they contain no command bytes.',
    );
  }
  if (!isRecord(value) || !Array.isArray(value.settings)) {
    throw new Error(
      'POS-8370 settings document must contain a settings array.',
    );
  }

  const settings = value.settings.map((entry, index) =>
    parseSetting(entry, index),
  );
  const actionEntries = Array.isArray(value.buttons) ? value.buttons : [];
  const actions = actionEntries.map((entry, index) =>
    parseAction(entry, index),
  );
  assertUniqueIds(settings, 'setting');
  assertUniqueIds(actions, 'action');

  return {
    printer: typeof value.printer === 'string' ? value.printer : undefined,
    settings,
    actions,
  };
}

function parseSetting(value: unknown, index: number): Pos8370SettingDefinition {
  if (
    !isRecord(value) ||
    typeof value.title !== 'string' ||
    !Array.isArray(value.options)
  ) {
    throw new Error(`Invalid POS-8370 setting at index ${index}.`);
  }

  const options = parseCommands(value.options, `setting "${value.title}"`);
  assertUniqueIds(options, `option in setting "${value.title}"`);
  return {
    id: readId(value, value.title),
    title: value.title,
    description:
      typeof value.description === 'string' ? value.description : undefined,
    options,
  };
}

function parseAction(value: unknown, index: number): Pos8370ActionDefinition {
  if (
    !isRecord(value) ||
    typeof value.title !== 'string' ||
    !Array.isArray(value.commands)
  ) {
    throw new Error(`Invalid POS-8370 action at index ${index}.`);
  }

  const commands = parseCommands(value.commands, `action "${value.title}"`);
  assertUniqueIds(commands, `command in action "${value.title}"`);
  return {
    id: readId(value, value.title),
    title: value.title,
    description:
      typeof value.description === 'string' ? value.description : undefined,
    commands,
  };
}

function parseCommands(
  values: readonly unknown[],
  context: string,
): readonly Pos8370SettingOptionDefinition[] {
  const parsed = values.map((entry, index) =>
    parseCommand(entry, index, context),
  );
  const labelCounts = countKeys(parsed.map(({ label }) => label));

  return parsed.map(({ id, label, rawBytes }) => ({
    id:
      id ??
      stableCommandId(
        label,
        rawBytes,
        (labelCounts.get(normalizeKey(label)) ?? 0) > 1,
      ),
    label,
    rawBytes,
  }));
}

function parseCommand(
  value: unknown,
  index: number,
  context: string,
): {
  readonly id?: string;
  readonly label: string;
  readonly rawBytes: PrinterBytes;
} {
  if (!isRecord(value) || typeof value.label !== 'string') {
    throw new Error(
      `Invalid POS-8370 command at index ${index} in ${context}.`,
    );
  }

  const rawValue =
    value.commandHex ?? value.rawBytes ?? value.bytes ?? value.commandBytes;
  return {
    id: value.id === undefined ? undefined : requireId(value.id, context),
    label: value.label,
    rawBytes: parseByteSource(rawValue, `${context}, command "${value.label}"`),
  };
}

function parseByteSource(value: unknown, context: string): PrinterBytes {
  if (Array.isArray(value)) {
    if (!value.every((byte) => typeof byte === 'number')) {
      throw new Error(`Invalid byte array in ${context}.`);
    }
    return toPrinterBytes(value);
  }
  if (typeof value !== 'string') {
    throw new Error(`Missing command bytes in ${context}.`);
  }

  const tokens = value.trim().split(/\s+/u).filter(Boolean);
  if (
    tokens.length === 0 ||
    !tokens.every((token) => /^(?:0x)?[0-9a-f]{2}$/iu.test(token))
  ) {
    throw new Error(`Invalid hexadecimal command bytes in ${context}.`);
  }
  return toPrinterBytes(
    tokens.map((token) => Number.parseInt(token.replace(/^0x/iu, ''), 16)),
  );
}

function stableCommandId(
  label: string,
  bytes: PrinterBytes,
  duplicateLabel: boolean,
): string {
  const labelId = createSlug(label);
  return duplicateLabel ? `${labelId}-${byteFingerprint(bytes)}` : labelId;
}

function byteFingerprint(bytes: PrinterBytes): string {
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function readId(
  value: Readonly<Record<string, unknown>>,
  fallback: string,
): string {
  return value.id === undefined
    ? createSlug(fallback)
    : requireId(value.id, fallback);
}

function requireId(value: unknown, context: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid POS-8370 id in ${context}.`);
  }
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
