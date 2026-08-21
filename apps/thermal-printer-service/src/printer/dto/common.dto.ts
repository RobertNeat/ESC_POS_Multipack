import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum AlignmentDto {
  Left = 'left',
  Center = 'center',
  Right = 'right',
}

export enum TextEncodingDto {
  Windows1250 = 'windows1250',
  Cp852 = 'cp852',
  Cp3843 = 'cp3843',
  Utf8 = 'utf8',
}

export enum CharacterFontSizeDto {
  Size9x17 = '9x17',
  Size12x24 = '12x24',
  Size9x24 = '9x24',
}

export class TextStyleDto {
  @ApiPropertyOptional({ enum: ['A', 'B', 'specialB'], default: 'A' })
  @IsOptional()
  @IsIn(['A', 'B', 'specialB'])
  font?: 'A' | 'B' | 'specialB';

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  emphasized?: boolean;

  @ApiPropertyOptional({ enum: [0, 1, 2], default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  underline?: 0 | 1 | 2;

  @ApiPropertyOptional({ minimum: 1, maximum: 8, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  width?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

  @ApiPropertyOptional({ minimum: 1, maximum: 8, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  height?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  reverse?: boolean;
}
