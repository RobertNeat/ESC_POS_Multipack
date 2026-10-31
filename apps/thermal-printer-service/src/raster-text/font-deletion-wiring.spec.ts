import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GlobalFonts } from '@napi-rs/canvas';
import { Test } from '@nestjs/testing';
import { FontsModule } from '../fonts/fonts.module';
import { FontLibraryService } from '../fonts/font-library.service';
import { CanvasFontRegistry } from './canvas-font-registry';

/**
 * Deleting a font must actually un-register its canvas alias. This is a
 * cross-module DI wiring concern (FontLibraryService lives in FontsModule,
 * CanvasFontRegistry in a module that imports it) that a hand-built unit
 * test cannot catch, because building the service by hand sidesteps
 * Nest's real provider resolution. This test boots a real testing module.
 */
describe('font deletion wiring (FontsModule -> CanvasFontRegistry)', () => {
  let fontsDir: string;
  let previousFontsDir: string | undefined;

  beforeEach(() => {
    previousFontsDir = process.env.FONTS_DIR;
    fontsDir = mkdtempSync(join(tmpdir(), 'font-deletion-wiring-'));
    process.env.FONTS_DIR = fontsDir;
  });

  afterEach(() => {
    if (previousFontsDir === undefined) delete process.env.FONTS_DIR;
    else process.env.FONTS_DIR = previousFontsDir;
    rmSync(fontsDir, { recursive: true, force: true });
  });

  it('un-registers the canvas alias when the font is deleted', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FontsModule],
      providers: [CanvasFontRegistry],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const fontLibrary = app.get(FontLibraryService);
    const registry = app.get(CanvasFontRegistry);

    const boldPath = join(
      __dirname,
      '..',
      '..',
      'assets',
      'fonts',
      'built-in',
      'GeistMono-Bold.ttf',
    );
    const record = await fontLibrary.upload({
      data: readFileSync(boldPath),
      originalFilename: 'wiring-test.ttf',
    });

    const aliases = await registry.ensureRegistered(record.id);
    expect(GlobalFonts.has(aliases.regular)).toBe(true);

    await fontLibrary.delete(record.id);

    expect(GlobalFonts.has(aliases.regular)).toBe(false);

    await app.close();
  });
});
