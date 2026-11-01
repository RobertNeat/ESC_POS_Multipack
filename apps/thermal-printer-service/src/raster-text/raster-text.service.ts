import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BUILT_IN_GEIST_MONO_ID } from '../fonts/font-library.constants';
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
import type { RasterBlock } from './raster-markdown';
import { parseRasterMarkdown } from './raster-markdown';
import { RasterTextRenderer, type RenderRequest } from './raster-text-renderer';
import {
  MAX_RASTER_HEIGHT_DOTS,
  MAX_RASTER_WIDTH_BYTES,
} from './raster-text.constants';
import { RequestGlyphChecker } from './request-glyph-checker';

const RULE_CODEPOINT = 0x2500;

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
    const blocks = applyBoldOverride(
      parseRasterMarkdown(dto.text, dto.fontSizePx),
      dto.bold,
    );
    const visibleText = visibleTextOf(blocks);

    const missingCharacters = await this.glyphChecker.missingCharacters(
      dto.fontId,
      visibleText,
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
    const ruleFontAlias = await this.resolveRuleFontAlias(
      dto.fontId,
      aliases.regular,
    );

    const request: RenderRequest = {
      blocks,
      widthDots,
      fontAlias: aliases.regular,
      ruleFontAlias,
      lineSpacing: dto.lineSpacing,
      align: dto.align,
      mode: dto.mode,
      thresholdPercent: dto.thresholdPercent,
      ditherAlgorithm: dto.ditherAlgorithm,
    };

    const result = this.renderer.render(request);
    if (result.heightDots > MAX_RASTER_HEIGHT_DOTS) {
      throw new BadRequestException(
        `Text renders to ${result.heightDots} dots tall, which exceeds the ${MAX_RASTER_HEIGHT_DOTS}-dot limit for one raster block. Shorten the text.`,
      );
    }

    return { result, missingCharacters };
  }

  /** Rule lines use box-drawing glyphs the selected font may lack; fall back to the built-in font when it does. */
  private async resolveRuleFontAlias(
    fontId: string,
    selectedFontAlias: string,
  ): Promise<string> {
    if (await this.glyphChecker.hasGlyph(fontId, RULE_CODEPOINT)) {
      return selectedFontAlias;
    }
    const builtIn = await this.fontRegistry.ensureRegistered(
      BUILT_IN_GEIST_MONO_ID,
    );
    return builtIn.regular;
  }
}

function applyBoldOverride(
  blocks: readonly RasterBlock[],
  forceBold: boolean,
): readonly RasterBlock[] {
  if (!forceBold) return blocks;
  return blocks.map((block) =>
    block.kind === 'line'
      ? { ...block, runs: block.runs.map((run) => ({ ...run, bold: true })) }
      : block,
  );
}

function visibleTextOf(blocks: readonly RasterBlock[]): string {
  return blocks
    .filter(
      (block): block is Extract<RasterBlock, { kind: 'line' }> =>
        block.kind === 'line',
    )
    .map((block) => block.runs.map((run) => run.text).join(''))
    .join('\n');
}
