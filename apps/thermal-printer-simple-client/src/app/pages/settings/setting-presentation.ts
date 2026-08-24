import { TranslationKey } from '../../core/translations';

const SETTING_NAMES: Readonly<Record<string, TranslationKey>> = {
  'Set Printing mode': 'setting.printMode',
  'Cutting Setting': 'setting.autoCut',
  'Set Density Level': 'setting.density',
  'Set Default Char': 'setting.defaultChar',
  'Set Default Page': 'setting.codePage',
  'Setting DHCP': 'setting.dhcp',
  'USB Type': 'setting.usbMode',
  'Print width': 'setting.paperWidth',
  'Set up the buzzer': 'setting.buzzer',
  'Set Printer Baud': 'setting.baud',
  'Set Font': 'setting.charset',
  'Set Voice swith': 'setting.voice',
  'Enable Cutter(PIT)': 'setting.cutter',
  'Setting speed': 'setting.speed',
  'USB Port': 'setting.usbAssignment',
};

const ACTION_PRESENTATIONS: Readonly<
  Record<string, { readonly titleKey: TranslationKey; readonly descriptionKey: TranslationKey }>
> = {
  'NV Logo Down': {
    titleKey: 'action.nvLogo.title',
    descriptionKey: 'action.nvLogo.description',
  },
  'Printer Cut': {
    titleKey: 'action.printerCut.title',
    descriptionKey: 'action.printerCut.description',
  },
  'Print Default Page': {
    titleKey: 'action.defaultPage.title',
    descriptionKey: 'action.defaultPage.description',
  },
  'Open Cash Box': {
    titleKey: 'action.cashBox.title',
    descriptionKey: 'action.cashBox.description',
  },
  'Print SelfTest': {
    titleKey: 'action.selfTest.title',
    descriptionKey: 'action.selfTest.description',
  },
  'Test box': {
    titleKey: 'action.testBox.title',
    descriptionKey: 'action.testBox.description',
  },
  'Restore factory': {
    titleKey: 'action.restoreFactory.title',
    descriptionKey: 'action.restoreFactory.description',
  },
};

const ACTION_COMMAND_NAMES: Readonly<Record<string, TranslationKey>> = {
  'clean logo': 'action.command.cleanLogo',
  'print logo': 'action.command.printLogo',
  'button press': 'action.command.buttonPress',
  'Hello World without hex checkbox': 'action.command.helloWorld',
  'ESC Hello World without hex checkbox': 'action.command.escHelloWorld',
};

export function printerSettingNameKey(value: string): TranslationKey | null {
  return SETTING_NAMES[value] ?? null;
}

export function printerActionTitleKey(value: string): TranslationKey | null {
  return ACTION_PRESENTATIONS[value]?.titleKey ?? null;
}

export function printerActionDescriptionKey(value: string): TranslationKey | null {
  return ACTION_PRESENTATIONS[value]?.descriptionKey ?? null;
}

export function printerActionCommandNameKey(value: string): TranslationKey | null {
  return ACTION_COMMAND_NAMES[value] ?? null;
}

export function printerSettingIcon(title: string): string {
  const value = title.toLowerCase();
  if (value.includes('cut')) return 'pi pi-minus';
  if (value.includes('usb')) return 'pi pi-link';
  if (value.includes('speed') || value.includes('baud')) return 'pi pi-gauge';
  if (value.includes('width')) return 'pi pi-arrows-h';
  if (value.includes('density')) return 'pi pi-sun';
  if (value.includes('font') || value.includes('char') || value.includes('page')) {
    return 'pi pi-language';
  }
  return 'pi pi-cog';
}
