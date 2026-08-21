import type {
  Pos8370Font,
  Pos8370TextStyle,
} from '@esc-pos-multipack/pos-8370-adapter';
import { CharacterFontSizeDto, TextStyleDto } from './printer.dto';

export const NORMAL_TEXT_STYLE: Readonly<Required<Pos8370TextStyle>> = {
  font: 'primary',
  emphasized: false,
  underline: 0,
  width: 1,
  height: 1,
  reverse: false,
};

export function completeTextStyle(
  style?: TextStyleDto,
): Required<Pos8370TextStyle> {
  return { ...NORMAL_TEXT_STYLE, ...style };
}

export function fontForSize(
  size: CharacterFontSizeDto | undefined,
): Pos8370Font {
  const fonts = {
    [CharacterFontSizeDto.Size9x17]: 'B',
    [CharacterFontSizeDto.Size12x24]: 'A',
    [CharacterFontSizeDto.Size9x24]: 'specialB',
  } as const;
  return fonts[size ?? CharacterFontSizeDto.Size12x24];
}
