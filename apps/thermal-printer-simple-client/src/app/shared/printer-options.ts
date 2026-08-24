import { Alignment, CharacterFontSize, TextEncoding, TextStyle } from '../core/printer.models';
import { TranslationKey } from '../core/translations';

export interface SelectOption<T> {
  readonly label: string;
  readonly value: T;
}

export const CHARACTER_FONT_OPTIONS: ReadonlyArray<SelectOption<CharacterFontSize>> = [
  { label: '9 × 17', value: '9x17' },
  { label: '12 × 24', value: '12x24' },
  { label: '9 × 24', value: '9x24' },
];

export const FONT_OPTIONS: ReadonlyArray<{
  readonly label: string;
  readonly size: CharacterFontSize;
  readonly font: TextStyle['font'];
}> = [
  { label: '9 × 17', size: '9x17', font: 'B' },
  { label: '12 × 24', size: '12x24', font: 'A' },
  { label: '9 × 24', size: '9x24', font: 'specialB' },
];

export const PAPER_OPTIONS = [
  { label: '58 mm', millimeters: 58, dots: 384 },
  { label: '80 mm', millimeters: 80, dots: 576 },
] as const;

export function characterColumns(size: CharacterFontSize, paperWidth = 80): number {
  if (paperWidth === 80) return size === '12x24' ? 48 : 64;
  return size === '12x24' ? 32 : 42;
}

export const ALIGNMENT_OPTIONS: ReadonlyArray<{
  readonly labelKey: TranslationKey;
  readonly value: Alignment;
}> = [
  { labelKey: 'option.alignLeft', value: 'left' },
  { labelKey: 'option.alignCenter', value: 'center' },
  { labelKey: 'option.alignRight', value: 'right' },
];

export const TEXT_ENCODING_OPTIONS: ReadonlyArray<
  SelectOption<TextEncoding> & {
    readonly printerPage: string;
    readonly printerPageKey?: TranslationKey;
  }
> = [
  {
    value: 'windows1250',
    label: 'Windows-1250',
    printerPage: 'WPC1250 (Latin-2)',
  },
  { value: 'cp852', label: 'CP852', printerPage: 'OEM852 (Latin-2)' },
  {
    value: 'cp3843',
    label: 'CP3843 / Mazovia',
    printerPage: 'PC3843 (Polish)',
  },
  {
    value: 'utf8',
    label: 'UTF-8',
    printerPage: '',
    printerPageKey: 'option.utf8Only',
  },
];
