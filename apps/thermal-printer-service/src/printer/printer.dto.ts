import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBase64,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsHexadecimal,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export enum AlignmentDto {
  Left = 'left',
  Center = 'center',
  Right = 'right',
}

export class TextStyleDto {
  @ApiPropertyOptional({ enum: ['A', 'B'], default: 'A' })
  @IsOptional()
  @IsIn(['A', 'B'])
  font?: 'A' | 'B';

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

export class PrintLineDto {
  @ApiProperty({ example: 'Nazwa produktu       12,99 PLN', maxLength: 4096 })
  @IsString()
  @MaxLength(4096)
  text!: string;

  @ApiPropertyOptional({ enum: AlignmentDto, default: AlignmentDto.Left })
  @IsOptional()
  @IsEnum(AlignmentDto)
  alignment?: AlignmentDto;

  @ApiPropertyOptional({ type: TextStyleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TextStyleDto)
  style?: TextStyleDto;
}

export class PrintLinesDto {
  @ApiProperty({ type: [PrintLineDto], minItems: 1, maxItems: 500 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => PrintLineDto)
  lines!: PrintLineDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  initialize = true;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  cut = false;
}

export class PrintMarkdownDto {
  @ApiProperty({
    description:
      'Markdown bez HTML. Obsługiwane są nagłówki, akapity, style inline, cytaty, kod, tabele oraz zagnieżdżone listy.',
    example:
      '# Zamówienie\n\n1. **Kawa**\n   - duża\n   - bez cukru\n2. Herbata',
    maxLength: 100_000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100_000)
  markdown!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  initialize = true;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  cut = false;
}

export enum RawEncodingDto {
  Hex = 'hex',
  Base64 = 'base64',
  Bytes = 'bytes',
}

export class PrintRawDto {
  @ApiProperty({ enum: RawEncodingDto, example: RawEncodingDto.Hex })
  @IsEnum(RawEncodingDto)
  encoding!: RawEncodingDto;

  @ApiProperty({
    oneOf: [
      { type: 'string', example: '1b 40 48 65 6c 6c 6f 0a' },
      {
        type: 'array',
        items: { type: 'integer', minimum: 0, maximum: 255 },
        example: [27, 64, 10],
      },
    ],
  })
  @IsDefined()
  data!: string | number[];
}

export enum RasterScaleDto {
  Normal = 'normal',
  DoubleWidth = 'doubleWidth',
  DoubleHeight = 'doubleHeight',
  Quadruple = 'quadruple',
}

export class PrintRasterDto {
  @ApiProperty({
    description:
      'Bitmapa 1-bit, wierszami od góry, MSB jako pierwszy piksel. Bit 1 oznacza czarny punkt.',
    format: 'base64',
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

export class NamedConfigurationEntryDto {
  @ApiProperty({ example: 'Set Density Level' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  setting!: string;

  @ApiProperty({ example: 'Level3_Dark' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  option!: string;
}

export class ConfigureNamedDto {
  @ApiProperty({ type: [NamedConfigurationEntryDto], maxItems: 50 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => NamedConfigurationEntryDto)
  entries!: NamedConfigurationEntryDto[];
}

export class ConfigurePrinterDto {
  @ApiPropertyOptional({ enum: ['ascii', 'chinese'] })
  @IsOptional()
  @IsIn(['ascii', 'chinese'])
  printingMode?: 'ascii' | 'chinese';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoCut?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  densityLevel?: 1 | 2 | 3 | 4;

  @ApiPropertyOptional({ enum: ['9x17', '12x24', '9x24'] })
  @IsOptional()
  @IsIn(['9x17', '12x24', '9x24'])
  defaultCharacterSize?: '9x17' | '12x24' | '9x24';

  @ApiPropertyOptional({ example: '5011' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  usbProductId?: string;

  @ApiPropertyOptional({ example: 'PC3843(Polish)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  codePage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dhcp?: boolean;

  @ApiPropertyOptional({ enum: ['printer', 'virtualCom'] })
  @IsOptional()
  @IsIn(['printer', 'virtualCom'])
  usbInterfaceMode?: 'printer' | 'virtualCom';

  @ApiPropertyOptional({ enum: [58, 80] })
  @IsOptional()
  @IsIn([58, 80])
  paperWidthMm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  buzzer?: boolean;

  @ApiPropertyOptional({
    enum: [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200],
  })
  @IsOptional()
  @IsIn([1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200])
  baudRate?: number;

  @ApiPropertyOptional({ example: 'GB18030' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  characterSet?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  voice?: boolean;

  @ApiPropertyOptional({ example: '0416' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  usbVendorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cutterPit?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 6 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  printSpeed?: number;

  @ApiPropertyOptional({ enum: ['fixed', 'random'] })
  @IsOptional()
  @IsIn(['fixed', 'random'])
  usbPortAssignment?: 'fixed' | 'random';
}

export class DeviceActionDto {
  @ApiProperty({ example: 'Print SelfTest' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  action!: string;

  @ApiPropertyOptional({ example: 'button press' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  command?: string;
}

export class OperationResultDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';

  @ApiProperty({ example: 3 })
  @IsNumber()
  processed!: number;
}

// PrinterService validates this union because class-validator cannot inspect it.
export function normalizeRawData(value: unknown): unknown {
  if (typeof value === 'string' || Array.isArray(value)) return value;
  return value;
}

// Exported for clients that generate DTO validation metadata.
export class HexIdentifierDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/^0x/i, '') : value,
  )
  @IsHexadecimal()
  value!: string;
}
