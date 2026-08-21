import type { PrinterSettingsRepository } from '@esc-pos-multipack/pos-8370-adapter';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigurationCatalogResponseDto } from './printer.dto';
import { PRINTER_SETTINGS } from './printer.tokens';

/** Projects driver metadata onto the public API without command bytes. */
@Injectable()
export class PrinterConfigurationCatalog {
  constructor(
    @Inject(PRINTER_SETTINGS)
    private readonly settings: PrinterSettingsRepository,
  ) {}

  get(): ConfigurationCatalogResponseDto {
    return {
      settings: this.settings.listSettings().map((setting) => ({
        id: setting.id,
        title: setting.title,
        description: setting.description,
        options: setting.options.map(({ id, label }) => ({ id, label })),
      })),
      actions: this.settings.listActions().map((action) => ({
        id: action.id,
        title: action.title,
        description: action.description,
        commands: action.commands.map(({ id, label }) => ({ id, label })),
      })),
    };
  }
}
