import type { PrinterSettingsRepository } from '@esc-pos-multipack/pos-8370-adapter';
import { PrinterConfigurationCatalog } from './printer-configuration.catalog';

describe('PrinterConfigurationCatalog', () => {
  it('does not expose raw command bytes in the public response', () => {
    const repository = {
      listSettings: () => [
        {
          id: 'density',
          title: 'Density',
          description: 'Print density',
          options: [{ id: 'dark', label: 'Dark', rawBytes: [1, 2, 3] }],
        },
      ],
      listActions: () => [
        {
          id: 'self-test',
          title: 'Self test',
          commands: [{ id: 'run', label: 'Run', rawBytes: [4, 5] }],
        },
      ],
    } as unknown as PrinterSettingsRepository;

    const result = new PrinterConfigurationCatalog(repository).get();

    expect(result).toEqual({
      settings: [
        {
          id: 'density',
          title: 'Density',
          description: 'Print density',
          options: [{ id: 'dark', label: 'Dark' }],
        },
      ],
      actions: [
        {
          id: 'self-test',
          title: 'Self test',
          description: undefined,
          commands: [{ id: 'run', label: 'Run' }],
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain('rawBytes');
  });
});
