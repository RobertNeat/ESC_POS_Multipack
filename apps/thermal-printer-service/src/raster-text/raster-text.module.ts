import { Module } from '@nestjs/common';
import { FontsModule } from '../fonts/fonts.module';
import { PrinterModule } from '../printer/printer.module';
import { CanvasFontRegistry } from './canvas-font-registry';
import { RasterTextController } from './raster-text.controller';
import { RasterTextRenderer } from './raster-text-renderer';
import { RasterTextService } from './raster-text.service';
import { RequestGlyphChecker } from './request-glyph-checker';
import { TextLayoutEngine } from './text-layout-engine';

@Module({
  imports: [FontsModule, PrinterModule],
  controllers: [RasterTextController],
  providers: [
    CanvasFontRegistry,
    RequestGlyphChecker,
    TextLayoutEngine,
    RasterTextRenderer,
    RasterTextService,
  ],
  exports: [RasterTextService],
})
export class RasterTextModule {}
