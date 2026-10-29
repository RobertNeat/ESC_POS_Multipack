import { ApiProperty } from '@nestjs/swagger';

export class GlyphCoverageDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ type: [String], example: [] })
  missingCharacters!: string[];
}

export class FontDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'Geist Mono' })
  displayName!: string;

  @ApiProperty({ example: 'GeistMono-Regular.ttf' })
  originalFilename!: string;

  @ApiProperty({ example: 'Geist Mono' })
  familyName!: string;

  @ApiProperty({ enum: ['ttf', 'otf'], example: 'ttf' })
  format!: 'ttf' | 'otf';

  @ApiProperty({ example: true })
  builtIn!: boolean;

  @ApiProperty({ example: true })
  hasBold!: boolean;

  @ApiProperty({ example: 149284 })
  sizeBytes!: number;

  @ApiProperty({ example: '2026-10-29T12:00:00.000Z' })
  uploadedAt!: string;

  @ApiProperty({ type: GlyphCoverageDto })
  coverage!: GlyphCoverageDto;
}

export class FontListResponseDto {
  @ApiProperty({ type: [FontDto] })
  fonts!: FontDto[];
}

export class DeleteFontResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';
}
