import {
  type PrinterBytes,
  toPrinterBytes,
} from '@esc-pos-multipack/printer-adapter';

import { countKeys, normalizeKey } from './settings-identifiers.js';
import type {
  Pos8370ActionCommandDefinition,
  Pos8370ActionDefinition,
  Pos8370ActionView,
  Pos8370SettingDefinition,
  Pos8370SettingView,
  Pos8370SettingsDocument,
} from './settings-model.js';
import { parseSettingsDocument } from './settings-parser.js';

export interface PrinterSettingsRepository {
  getCommandBytes(settingId: string, optionId: string): PrinterBytes;
  listSettings(): readonly Pos8370SettingView[];
  getActionCommands(
    actionId: string,
    commandId?: string,
  ): readonly PrinterBytes[];
  listActions(): readonly Pos8370ActionView[];
}

export class InMemoryPrinterSettingsRepository implements PrinterSettingsRepository {
  private readonly bySetting = new Map<
    string,
    ReadonlyMap<string, PrinterBytes>
  >();
  private readonly byAction = new Map<
    string,
    ReadonlyMap<string, PrinterBytes>
  >();
  private readonly settingViews: readonly Pos8370SettingView[];
  private readonly actionViews: readonly Pos8370ActionView[];

  constructor(private readonly document: Pos8370SettingsDocument) {
    this.indexSettings(document.settings);
    this.indexActions(document.actions);
    this.settingViews = document.settings.map(toSettingView);
    this.actionViews = document.actions.map(toActionView);
  }

  static fromJson(value: unknown): InMemoryPrinterSettingsRepository {
    return new InMemoryPrinterSettingsRepository(parseSettingsDocument(value));
  }

  getCommandBytes(settingId: string, optionId: string): PrinterBytes {
    const command = this.bySetting
      .get(normalizeKey(settingId))
      ?.get(normalizeKey(optionId));
    if (!command) {
      throw new Error(
        `Unknown POS-8370 setting option: "${settingId}" / "${optionId}".`,
      );
    }
    return command;
  }

  listSettings(): readonly Pos8370SettingView[] {
    return this.settingViews;
  }

  getActionCommands(
    actionId: string,
    commandId?: string,
  ): readonly PrinterBytes[] {
    const commands = this.byAction.get(normalizeKey(actionId));
    if (!commands) {
      throw new Error(`Unknown POS-8370 action: "${actionId}".`);
    }
    if (commandId !== undefined) {
      const command = commands.get(normalizeKey(commandId));
      if (!command) {
        throw new Error(
          `Unknown POS-8370 action command: "${actionId}" / "${commandId}".`,
        );
      }
      return [command];
    }

    const action = this.document.actions.find((entry) =>
      matchesIdentifier(entry, actionId),
    );
    if (!action) {
      throw new Error(`Unknown POS-8370 action: "${actionId}".`);
    }
    return action.commands.map(({ rawBytes }) => toPrinterBytes(rawBytes));
  }

  listActions(): readonly Pos8370ActionView[] {
    return this.actionViews;
  }

  private indexSettings(settings: readonly Pos8370SettingDefinition[]): void {
    for (const setting of settings) {
      const commands = createCommandIndex(setting.options);
      this.bySetting.set(normalizeKey(setting.id), commands);
      this.bySetting.set(normalizeKey(setting.title), commands);
    }
  }

  private indexActions(actions: readonly Pos8370ActionDefinition[]): void {
    for (const action of actions) {
      const commands = createCommandIndex(action.commands);
      this.byAction.set(normalizeKey(action.id), commands);
      this.byAction.set(normalizeKey(action.title), commands);
    }
  }
}

function createCommandIndex(
  definitions: readonly Pos8370ActionCommandDefinition[],
): ReadonlyMap<string, PrinterBytes> {
  const result = new Map<string, PrinterBytes>();
  const labelCounts = countKeys(definitions.map(({ label }) => label));
  for (const definition of definitions) {
    const bytes = toPrinterBytes(definition.rawBytes);
    result.set(normalizeKey(definition.id), bytes);
    if ((labelCounts.get(normalizeKey(definition.label)) ?? 0) === 1) {
      result.set(normalizeKey(definition.label), bytes);
    }
  }
  return result;
}

function toSettingView(setting: Pos8370SettingDefinition): Pos8370SettingView {
  return {
    id: setting.id,
    title: setting.title,
    description: setting.description,
    options: setting.options.map(({ id, label }) => ({ id, label })),
  };
}

function toActionView(action: Pos8370ActionDefinition): Pos8370ActionView {
  return {
    id: action.id,
    title: action.title,
    description: action.description,
    commands: action.commands.map(({ id, label }) => ({ id, label })),
  };
}

function matchesIdentifier(
  value: { readonly id: string; readonly title: string },
  identifier: string,
): boolean {
  const key = normalizeKey(identifier);
  return normalizeKey(value.id) === key || normalizeKey(value.title) === key;
}
