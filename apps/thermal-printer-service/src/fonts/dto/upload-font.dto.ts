import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadFontDto {
  @ApiPropertyOptional({
    description:
      'Optional display name shown in the font picker. Defaults to the font family name read from the file.',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;
}
