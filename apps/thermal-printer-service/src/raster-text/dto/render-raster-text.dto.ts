import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AlignmentDto } from '../../printer/dto/common.dto';
import {
  DEFAULT_FONT_SIZE_PX,
  DEFAULT_THRESHOLD_PERCENT,
  MAX_FONT_SIZE_PX,
  MAX_THRESHOLD_PERCENT,
  MIN_FONT_SIZE_PX,
  MIN_THRESHOLD_PERCENT,
} from '../raster-text.constants';

export enum RasterTextModeDto {
  Raw = 'raw',
  Antialiased = 'antialiased',
  Dithered = 'dithered',
}

export enum DitherAlgorithmDto {
  FloydSteinberg = 'floydSteinberg',
  Bayer = 'bayer',
}

export class RenderRasterTextDto {
  @ApiProperty({ example: 'Zażółć gęślą jaźń. ĄĆĘŁŃÓŚŹŻ 0123456789 USD 2,00' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4_000)
  text!: string;

  @ApiProperty({ example: 'built-in-geist-mono' })
  @IsString()
  @IsNotEmpty()
  fontId!: string;

  @ApiPropertyOptional({
    minimum: MIN_FONT_SIZE_PX,
    maximum: MAX_FONT_SIZE_PX,
    default: DEFAULT_FONT_SIZE_PX,
  })
  @IsOptional()
  @IsInt()
  @Min(MIN_FONT_SIZE_PX)
  @Max(MAX_FONT_SIZE_PX)
  fontSizePx: number = DEFAULT_FONT_SIZE_PX;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  bold = false;

  @ApiPropertyOptional({ minimum: 1, maximum: 3, default: 1.2 })
  @IsOptional()
  lineSpacing = 1.2;

  @ApiPropertyOptional({ enum: AlignmentDto, default: AlignmentDto.Left })
  @IsOptional()
  @IsIn(Object.values(AlignmentDto))
  align: AlignmentDto = AlignmentDto.Left;

  @ApiPropertyOptional({
    enum: RasterTextModeDto,
    default: RasterTextModeDto.Antialiased,
  })
  @IsOptional()
  @IsEnum(RasterTextModeDto)
  mode: RasterTextModeDto = RasterTextModeDto.Antialiased;

  @ApiPropertyOptional({
    minimum: MIN_THRESHOLD_PERCENT,
    maximum: MAX_THRESHOLD_PERCENT,
    default: DEFAULT_THRESHOLD_PERCENT,
  })
  @IsOptional()
  @IsInt()
  @Min(MIN_THRESHOLD_PERCENT)
  @Max(MAX_THRESHOLD_PERCENT)
  thresholdPercent: number = DEFAULT_THRESHOLD_PERCENT;

  @ApiPropertyOptional({
    enum: DitherAlgorithmDto,
    default: DitherAlgorithmDto.FloydSteinberg,
  })
  @IsOptional()
  @IsEnum(DitherAlgorithmDto)
  ditherAlgorithm: DitherAlgorithmDto = DitherAlgorithmDto.FloydSteinberg;

  @ApiPropertyOptional({
    default: false,
    description:
      'Allow printing/previewing even if the font is missing glyphs for some characters in the text.',
  })
  @IsOptional()
  @IsBoolean()
  allowMissingGlyphs = false;
}
