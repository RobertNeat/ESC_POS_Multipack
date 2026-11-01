import { Module } from '@nestjs/common';
import { FontsModule } from '../fonts/fonts.module';
import { PrinterModule } from '../printer/printer.module';
import { CanvasFontRegistry } from './canvas-font-registry';
import { RasterLayoutEngine } from './raster-layout-engine';
import { RasterTextController } from './raster-text.controller';
import { RasterTextRenderer } from './raster-text-renderer';
import { RasterTextService } from './raster-text.service';
import { RequestGlyphChecker } from './request-glyph-checker';

@Module({
  imports: [FontsModule, PrinterModule],
  controllers: [RasterTextController],
  providers: [
    CanvasFontRegistry,
    RequestGlyphChecker,
    RasterLayoutEngine,
    RasterTextRenderer,
    RasterTextService,
  ],
  exports: [RasterTextService],
})
export class RasterTextModule {}
