import { ApiProperty } from '@nestjs/swagger';

export class RasterTextPreviewDto {
  @ApiProperty({
    description:
      'PNG of the rendered bitmap, base64-encoded (no data: prefix).',
  })
  pngBase64!: string;

  @ApiProperty({ example: 576 })
  widthDots!: number;

  @ApiProperty({ example: 198 })
  heightDots!: number;

  @ApiProperty({ example: 9 })
  lineCount!: number;

  @ApiProperty({ type: [String], example: [] })
  missingCharacters!: string[];
}
