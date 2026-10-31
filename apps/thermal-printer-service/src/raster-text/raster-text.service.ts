import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FontNotFoundError } from '../fonts/font-library.errors';
import { FontUsageTracker } from '../fonts/font-usage-tracker';
import { OperationResultDto } from '../printer/dto/operation-result.dto';
import { PrinterService } from '../printer/printer.service';
import { packedBitmapToPng } from './bitmap-to-png';
import { CanvasFontRegistry } from './canvas-font-registry';
import type { PrintRasterTextDto } from './dto/print-raster-text.dto';
import type { RenderRasterTextDto } from './dto/render-raster-text.dto';
import type { RasterTextPreviewDto } from './dto/raster-text-result.dto';
import { paperWidthDots } from './paper-width.provider';
import { RasterTextRenderer, type RenderRequest } from './raster-text-renderer';
import {
  MAX_RASTER_WIDTH_BYTES,
  maxLinesForLineHeight,
} from './raster-text.constants';
import { RequestGlyphChecker } from './request-glyph-checker';

@Injectable()
export class RasterTextService {
  constructor(
    private readonly fontRegistry: CanvasFontRegistry,
    private readonly glyphChecker: RequestGlyphChecker,
    private readonly renderer: RasterTextRenderer,
    private readonly usage: FontUsageTracker,
    private readonly printer: PrinterService,
  ) {}

  async preview(dto: RenderRasterTextDto): Promise<RasterTextPreviewDto> {
    const { result, missingCharacters } = await this.renderChecked(dto);
    return {
      pngBase64: packedBitmapToPng(result.bitmap, result.widthDots).toString(
        'base64',
      ),
      widthDots: result.widthDots,
      heightDots: result.heightDots,
      lineCount: result.lineCount,
      missingCharacters: [...missingCharacters],
    };
  }

  async print(dto: PrintRasterTextDto): Promise<OperationResultDto> {
    return this.usage.withFont(dto.fontId, async () => {
      const { result } = await this.renderChecked(dto);
      return this.printer.printRasterBitmap({
        data: result.bitmap.bytes,
        widthBytes: result.bitmap.widthBytes,
        height: result.bitmap.height,
        alignment: dto.align,
        initialize: dto.initialize,
        cut: dto.cut,
      });
    });
  }

  private async renderChecked(dto: RenderRasterTextDto) {
    try {
      return await this.renderCheckedUnsafe(dto);
    } catch (error) {
      if (error instanceof FontNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  private async renderCheckedUnsafe(dto: RenderRasterTextDto) {
    const missingCharacters = await this.glyphChecker.missingCharacters(
      dto.fontId,
      dto.text,
    );
    if (missingCharacters.length > 0 && !dto.allowMissingGlyphs) {
      throw new BadRequestException(
        `Selected font is missing glyphs for: ${missingCharacters.join(' ')}`,
      );
    }

    const widthDots = paperWidthDots();
    const widthBytes = Math.ceil(widthDots / 8);
    if (widthBytes > MAX_RASTER_WIDTH_BYTES) {
      throw new BadRequestException(
        `Configured paper width (${widthDots} dots) exceeds the printer's raster limit.`,
      );
    }

    const aliases = await this.fontRegistry.ensureRegistered(dto.fontId);
    const lineHeightPx = Math.round(dto.fontSizePx * dto.lineSpacing);

    const request: RenderRequest = {
      text: dto.text,
      widthDots,
      fontAlias: aliases.regular,
      fontSizePx: dto.fontSizePx,
      bold: dto.bold,
      lineHeightPx,
      align: dto.align,
      mode: dto.mode,
      thresholdPercent: dto.thresholdPercent,
      ditherAlgorithm: dto.ditherAlgorithm,
    };

    const maxLines = maxLinesForLineHeight(lineHeightPx);
    const result = this.renderer.render(request);
    if (result.lineCount > maxLines) {
      throw new BadRequestException(
        `Text renders to ${result.lineCount} lines, which exceeds the ${maxLines}-line limit for one raster block at this size. Shorten the text.`,
      );
    }

    return { result, missingCharacters };
  }
}
