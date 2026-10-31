import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { OperationResultDto } from '../printer/dto/operation-result.dto';
import { PrintRasterTextDto } from './dto/print-raster-text.dto';
import { RenderRasterTextDto } from './dto/render-raster-text.dto';
import { RasterTextPreviewDto } from './dto/raster-text-result.dto';
import { RasterTextService } from './raster-text.service';

@Controller('raster-text')
@ApiTags('raster-text')
export class RasterTextController {
  constructor(private readonly rasterText: RasterTextService) {}

  @Post('preview')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Renderuje tekst do bitmapy 1-bit i zwraca podgląd PNG',
    description:
      'Zwraca te same bity, które zostaną wydrukowane dla identycznych parametrów (deterministyczny render).',
  })
  @ApiOkResponse({ type: RasterTextPreviewDto })
  @ApiBadRequestResponse({
    description:
      'Czcionka nie zawiera wymaganych glifów, tekst przekracza limit linii lub nieprawidłowe parametry.',
  })
  preview(@Body() body: RenderRasterTextDto): Promise<RasterTextPreviewDto> {
    return this.rasterText.preview(body);
  }

  @Post('print')
  @HttpCode(200)
  @ApiOperation({ summary: 'Renderuje tekst do bitmapy 1-bit i drukuje ją' })
  @ApiOkResponse({ type: OperationResultDto })
  @ApiBadRequestResponse({
    description:
      'Czcionka nie zawiera wymaganych glifów, tekst przekracza limit linii lub nieprawidłowe parametry.',
  })
  print(@Body() body: PrintRasterTextDto): Promise<OperationResultDto> {
    return this.rasterText.print(body);
  }
}
