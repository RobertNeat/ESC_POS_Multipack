export interface Pos8370Configuration {
  readonly printingMode?: 'ascii' | 'chinese';
  readonly autoCut?: boolean;
  readonly densityLevel?: 1 | 2 | 3 | 4;
  readonly defaultCharacterSize?: '9x17' | '12x24' | '9x24';
  readonly usbProductId?: string;
  readonly codePage?: string;
  readonly dhcp?: boolean;
  readonly usbInterfaceMode?: 'printer' | 'virtualCom';
  readonly paperWidthMm?: number;
  readonly buzzer?: boolean;
  readonly baudRate?: number;
  readonly characterSet?: string;
  readonly voice?: boolean;
  readonly usbVendorId?: string;
  readonly cutterPit?: boolean;
  readonly printSpeed?: number;
  readonly usbPortAssignment?: 'fixed' | 'random';
}

export interface Pos8370NamedConfigEntry {
  readonly setting: string;
  readonly option: string;
}

export function mapPos8370Configuration(
  config: Pos8370Configuration,
): readonly Pos8370NamedConfigEntry[] {
  const entries: Pos8370NamedConfigEntry[] = [];
  const add = (setting: string, option: string | number | undefined): void => {
    if (option !== undefined) entries.push({ setting, option: String(option) });
  };

  add(
    'Set Printing mode',
    mapValue(config.printingMode, { ascii: 'ASCII', chinese: 'Chinese' }),
  );
  add('Cutting Setting', booleanOption(config.autoCut));
  add(
    'Set Density Level',
    mapValue(config.densityLevel, {
      1: 'Level1_Light',
      2: 'Level2_Light',
      3: 'Level3_Dark',
      4: 'Level4_Dark',
    }),
  );
  add(
    'Set Default Char',
    config.defaultCharacterSize && `ASCII:${config.defaultCharacterSize}`,
  );
  add('USB PID Set', config.usbProductId);
  add('Set Default Page', config.codePage);
  add('Setting DHCP', enabledOption(config.dhcp));
  add(
    'USB Type',
    mapValue(config.usbInterfaceMode, {
      printer: 'PRINTER',
      virtualCom: 'VCOM',
    }),
  );
  add(
    'Print width',
    config.paperWidthMm === undefined ? undefined : `${config.paperWidthMm}mm`,
  );
  add('Set up the buzzer', booleanOption(config.buzzer));
  add('Set Printer Baud', config.baudRate);
  add('Set Font', config.characterSet);
  add('Set Voice swith', booleanOption(config.voice));
  add('USB VID Set', config.usbVendorId);
  add('Enable Cutter(PIT)', booleanOption(config.cutterPit));
  add('Setting speed', config.printSpeed);
  add(
    'USB Port',
    mapValue(config.usbPortAssignment, {
      fixed: 'Fix USB',
      random: 'Random USB',
    }),
  );
  return entries;
}

function booleanOption(value: boolean | undefined): string | undefined {
  return value === undefined ? undefined : value ? 'ON' : 'OFF';
}

function enabledOption(value: boolean | undefined): string | undefined {
  return value === undefined ? undefined : value ? 'ENABLE' : 'DISABLE';
}

function mapValue<K extends string | number>(
  value: K | undefined,
  values: Readonly<Record<K, string>>,
): string | undefined {
  return value === undefined ? undefined : values[value];
}
