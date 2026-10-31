import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { RenderRasterTextDto } from './render-raster-text.dto';

export class PrintRasterTextDto extends RenderRasterTextDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  initialize = true;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  cut = false;
}
