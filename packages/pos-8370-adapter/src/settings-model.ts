import type { ByteSource } from '@esc-pos-multipack/printer-adapter';

/** A selectable POS-8370 setting option including its driver command. */
export interface Pos8370SettingOptionDefinition {
  readonly id: string;
  readonly label: string;
  readonly rawBytes: ByteSource;
}

/** Driver configuration metadata loaded from the POS-8370 settings document. */
export interface Pos8370SettingDefinition {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly options: readonly Pos8370SettingOptionDefinition[];
}

/** A command belonging to a POS-8370 maintenance action. */
export interface Pos8370ActionCommandDefinition {
  readonly id: string;
  readonly label: string;
  readonly rawBytes: ByteSource;
}

/** Driver action metadata loaded from the POS-8370 settings document. */
export interface Pos8370ActionDefinition {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly commands: readonly Pos8370ActionCommandDefinition[];
}

export interface Pos8370SettingsDocument {
  readonly printer?: string;
  readonly settings: readonly Pos8370SettingDefinition[];
  readonly actions: readonly Pos8370ActionDefinition[];
}

/** Safe setting metadata suitable for exposing through an application API. */
export interface Pos8370SettingOptionView {
  readonly id: string;
  readonly label: string;
}

export interface Pos8370SettingView {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly options: readonly Pos8370SettingOptionView[];
}

/** Safe action metadata suitable for exposing through an application API. */
export interface Pos8370ActionCommandView {
  readonly id: string;
  readonly label: string;
}

export interface Pos8370ActionView {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly commands: readonly Pos8370ActionCommandView[];
}
