import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsEnum } from 'class-validator';

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
      { type: 'array', items: { type: 'integer', minimum: 0, maximum: 255 } },
    ],
  })
  @IsDefined()
  data!: string | number[];
}
