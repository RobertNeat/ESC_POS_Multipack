import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBase64,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AlignmentDto } from './common.dto';

export enum RasterScaleDto {
  Normal = 'normal',
  DoubleWidth = 'doubleWidth',
  DoubleHeight = 'doubleHeight',
  Quadruple = 'quadruple',
}

export class PrintRasterDto {
  @ApiProperty({
    format: 'base64',
    description: 'Bitmapa 1-bit w układzie wierszowym.',
  })
  @IsString()
  @IsNotEmpty()
  @IsBase64()
  @MaxLength(1_400_000)
  data!: string;

  @ApiProperty({ minimum: 1, maximum: 128, example: 72 })
  @IsInt()
  @Min(1)
  @Max(128)
  widthBytes!: number;

  @ApiProperty({ minimum: 1, maximum: 4095, example: 320 })
  @IsInt()
  @Min(1)
  @Max(4095)
  height!: number;

  @ApiPropertyOptional({ enum: AlignmentDto, default: AlignmentDto.Center })
  @IsOptional()
  @IsEnum(AlignmentDto)
  alignment: AlignmentDto = AlignmentDto.Center;

  @ApiPropertyOptional({ enum: RasterScaleDto, default: RasterScaleDto.Normal })
  @IsOptional()
  @IsEnum(RasterScaleDto)
  scale: RasterScaleDto = RasterScaleDto.Normal;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  initialize = true;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  cut = false;
}
