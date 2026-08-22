import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { PrinterApiService } from '../../core/printer-api.service';
import { I18nService } from '../../core/i18n.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { ActionDefinition, ConfigurationOptions } from '../../core/printer.models';
import {
  printerActionCommandNameKey,
  printerActionDescriptionKey,
  printerActionTitleKey,
  printerSettingIcon,
  printerSettingNameKey,
} from './setting-presentation';

@Component({
  imports: [FormsModule, ButtonModule, SelectModule, TranslatePipe],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  private readonly api = inject(PrinterApiService);
  private readonly i18n = inject(I18nService);
  protected options: ConfigurationOptions | null = null;
  protected selections: Record<string, string | null> = {};
  protected loading = true;
  protected saving = false;
  protected error = '';
  protected activeAction = '';
  protected readonly settingIcon = printerSettingIcon;
  protected prettyName(value: string): string {
    const key = printerSettingNameKey(value);
    return key ? this.i18n.t(key) : value;
  }
  protected actionName(action: ActionDefinition): string {
    const key = printerActionTitleKey(action.title);
    return key ? this.i18n.t(key) : action.title;
  }
  protected actionDescription(action: ActionDefinition): string {
    const key = printerActionDescriptionKey(action.title);
    return key ? this.i18n.t(key) : (action.description ?? '');
  }
  protected actionCommands(action: ActionDefinition): ActionDefinition['commands'] {
    return action.commands.map((command) => {
      const key = printerActionCommandNameKey(command.label);
      return { ...command, label: key ? this.i18n.t(key) : command.label };
    });
  }
  ngOnInit(): void {
    void this.load();
  }
  protected async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      this.options = await this.api.getConfigurationOptions();
      this.selections = Object.fromEntries(
        this.options.settings.map((setting) => [setting.id, null]),
      );
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : this.i18n.t('settings.serviceUnavailable');
    } finally {
      this.loading = false;
    }
  }
  protected selectedCount(): number {
    return Object.values(this.selections).filter(Boolean).length;
  }
  protected availableActions(): ActionDefinition[] {
    return (this.options?.actions ?? []).filter((action) => action.commands.length > 0);
  }
  protected async save(): Promise<void> {
    const entries = Object.entries(this.selections)
      .filter((entry): entry is [string, string] => !!entry[1])
      .map(([setting, option]) => ({ setting, option }));
    if (!entries.length || this.saving) return;
    this.saving = true;
    try {
      await this.api.configure(entries);
      this.selections = Object.fromEntries(Object.keys(this.selections).map((key) => [key, null]));
    } finally {
      this.saving = false;
    }
  }
  protected async runAction(action: ActionDefinition, command?: string): Promise<void> {
    if (this.activeAction) return;
    this.activeAction = action.id;
    try {
      await this.api.performAction(action.id, command);
    } finally {
      this.activeAction = '';
    }
  }
}
