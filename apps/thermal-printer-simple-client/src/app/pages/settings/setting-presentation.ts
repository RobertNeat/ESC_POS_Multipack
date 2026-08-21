const SETTING_NAMES: Readonly<Record<string, string>> = {
  'Set Printing mode': 'Tryb drukowania',
  'Cutting Setting': 'Automatyczne cięcie',
  'Set Density Level': 'Gęstość druku',
  'Set Default Char': 'Domyślny znak',
  'Set Default Page': 'Strona kodowa',
  'Setting DHCP': 'DHCP',
  'USB Type': 'Tryb USB',
  'Print width': 'Szerokość papieru',
  'Set up the buzzer': 'Buzzer',
  'Set Printer Baud': 'Prędkość transmisji',
  'Set Font': 'Zestaw znaków',
  'Set Voice swith': 'Komunikaty głosowe',
  'Enable Cutter(PIT)': 'Nóż (PIT)',
  'Setting speed': 'Prędkość druku',
  'USB Port': 'Przypisanie USB',
};

export function printerSettingName(value: string): string {
  return SETTING_NAMES[value] ?? value;
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
