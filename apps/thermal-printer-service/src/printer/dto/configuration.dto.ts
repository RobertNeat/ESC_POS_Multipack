import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class NamedConfigurationEntryDto {
  @ApiProperty({
    example: 'density',
    description:
      'Identyfikator ustawienia; historyczny tytuł jest też akceptowany.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  setting!: string;

  @ApiProperty({
    example: 'level-3-dark',
    description:
      'Identyfikator opcji; historyczna etykieta jest też akceptowana.',
  })
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

  @ApiPropertyOptional() @IsOptional() @IsBoolean() autoCut?: boolean;
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
  @ApiPropertyOptional() @IsOptional() @IsBoolean() dhcp?: boolean;
  @ApiPropertyOptional({ enum: ['printer', 'virtualCom'] })
  @IsOptional()
  @IsIn(['printer', 'virtualCom'])
  usbInterfaceMode?: 'printer' | 'virtualCom';
  @ApiPropertyOptional({ enum: [58, 80] })
  @IsOptional()
  @IsIn([58, 80])
  paperWidthMm?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() buzzer?: boolean;
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
  @ApiPropertyOptional() @IsOptional() @IsBoolean() voice?: boolean;
  @ApiPropertyOptional({ example: '0416' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  usbVendorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() cutterPit?: boolean;
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
  @ApiProperty({
    example: 'print-self-test',
    description: 'Identyfikator akcji; historyczny tytuł jest też akceptowany.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  action!: string;
  @ApiPropertyOptional({
    example: 'button-press',
    description:
      'Identyfikator polecenia; historyczna etykieta jest też akceptowana.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  command?: string;
}

export class ConfigurationOptionResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() label!: string;
}

export class ConfigurationSettingResponseDto {
  @ApiProperty({ description: 'Stabilny identyfikator ustawienia.' })
  id!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty({ type: [ConfigurationOptionResponseDto] })
  options!: ConfigurationOptionResponseDto[];
}

export class DeviceActionResponseDto {
  @ApiProperty({ description: 'Stabilny identyfikator akcji.' }) id!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty({ type: [ConfigurationOptionResponseDto] })
  commands!: ConfigurationOptionResponseDto[];
}

export class ConfigurationCatalogResponseDto {
  @ApiProperty({ type: [ConfigurationSettingResponseDto] })
  settings!: ConfigurationSettingResponseDto[];
  @ApiProperty({ type: [DeviceActionResponseDto] })
  actions!: DeviceActionResponseDto[];
}
