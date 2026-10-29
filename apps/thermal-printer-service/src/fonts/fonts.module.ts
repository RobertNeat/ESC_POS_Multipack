import { Module } from '@nestjs/common';
import { FontController } from './font.controller';
import { FontInspector } from './font-inspector';
import { FontLibraryService } from './font-library.service';
import { FontStorage } from './font-storage';
import { FontUsageTracker } from './font-usage-tracker';

@Module({
  controllers: [FontController],
  providers: [FontStorage, FontInspector, FontLibraryService, FontUsageTracker],
  exports: [FontLibraryService, FontUsageTracker],
})
export class FontsModule {}
