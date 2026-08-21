import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  AlignmentDto,
  CharacterFontSizeDto,
  TextEncodingDto,
  TextStyleDto,
} from './common.dto';

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

  @ApiPropertyOptional({
    enum: TextEncodingDto,
    default: TextEncodingDto.Windows1250,
  })
  @IsOptional()
  @IsEnum(TextEncodingDto)
  encoding: TextEncodingDto = TextEncodingDto.Windows1250;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  initialize = true;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  cut = false;
}

abstract class TextDocumentDto {
  @ApiPropertyOptional({
    enum: CharacterFontSizeDto,
    default: CharacterFontSizeDto.Size12x24,
  })
  @IsOptional()
  @IsEnum(CharacterFontSizeDto)
  fontSize: CharacterFontSizeDto = CharacterFontSizeDto.Size12x24;

  @ApiPropertyOptional({
    enum: TextEncodingDto,
    default: TextEncodingDto.Windows1250,
  })
  @IsOptional()
  @IsEnum(TextEncodingDto)
  encoding: TextEncodingDto = TextEncodingDto.Windows1250;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  initialize = true;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  cut = false;
}

export class PrintTextDto extends TextDocumentDto {
  @ApiProperty({
    description: 'Tekst drukowany dosłownie.',
    maxLength: 100_000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100_000)
  text!: string;
}

export class PrintMarkdownDto extends TextDocumentDto {
  @ApiProperty({ description: 'Markdown bez HTML.', maxLength: 100_000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100_000)
  markdown!: string;
}
