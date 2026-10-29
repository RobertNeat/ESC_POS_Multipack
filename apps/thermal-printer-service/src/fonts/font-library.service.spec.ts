import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  BuiltInFontImmutableError,
  DuplicateFontError,
  FontInUseError,
  FontNotFoundError,
} from './font-library.errors';
import { BUILT_IN_GEIST_MONO_ID } from './font-library.constants';
import { FontInspector } from './font-inspector';
import { FontLibraryService } from './font-library.service';
import { FontStorage } from './font-storage';
import { FontUsageTracker } from './font-usage-tracker';

const BUILT_IN_FONT_PATH = join(
  __dirname,
  '..',
  '..',
  'assets',
  'fonts',
  'built-in',
  'GeistMono-Regular.ttf',
);
const BOLD_FONT_PATH = join(
  __dirname,
  '..',
  '..',
  'assets',
  'fonts',
  'built-in',
  'GeistMono-Bold.ttf',
);

describe('FontLibraryService', () => {
  let fontsDir: string;
  let previousFontsDir: string | undefined;

  beforeEach(() => {
    previousFontsDir = process.env.FONTS_DIR;
    fontsDir = mkdtempSync(join(tmpdir(), 'fonts-test-'));
    process.env.FONTS_DIR = fontsDir;
  });

  afterEach(() => {
    if (previousFontsDir === undefined) delete process.env.FONTS_DIR;
    else process.env.FONTS_DIR = previousFontsDir;
    rmSync(fontsDir, { recursive: true, force: true });
  });

  function createService(): FontLibraryService {
    return new FontLibraryService(
      new FontStorage(),
      new FontInspector(),
      new FontUsageTracker(),
    );
  }

  it('indexes the built-in Geist Mono font on first start', async () => {
    const service = createService();
    await service.onModuleInit();

    const fonts = await service.list();
    expect(fonts).toHaveLength(1);
    expect(fonts[0]).toMatchObject({
      id: BUILT_IN_GEIST_MONO_ID,
      builtIn: true,
      displayName: 'Geist Mono',
    });
    expect(fonts[0].coverage.ok).toBe(true);
  });

  it('does not re-add the built-in font on a second start (restart simulation)', async () => {
    const first = createService();
    await first.onModuleInit();

    const second = createService();
    await second.onModuleInit();

    const fonts = await second.list();
    expect(fonts.filter((f) => f.id === BUILT_IN_GEIST_MONO_ID)).toHaveLength(
      1,
    );
  });

  it('uploads a font, stores it under a generated id, and preserves the original filename only as metadata', async () => {
    const service = createService();
    await service.onModuleInit();
    const data = readFileSync(BOLD_FONT_PATH);

    const record = await service.upload({
      data,
      originalFilename: 'Courier New PSMT Regular.ttf',
      displayName: 'My Uploaded Font',
    });

    expect(record.builtIn).toBe(false);
    expect(record.originalFilename).toBe('Courier New PSMT Regular.ttf');
    expect(record.fileName).not.toContain(' ');
    expect(record.fileName).toMatch(/^[0-9a-f-]+\.ttf$/);
    expect(record.displayName).toBe('My Uploaded Font');

    const paths = await service.resolveFilePath(record.id);
    const stored = readFileSync(paths.regular);
    expect(stored.equals(data)).toBe(true);
  });

  it('survives a simulated restart: a new service instance still lists the uploaded font', async () => {
    const first = createService();
    await first.onModuleInit();
    const record = await first.upload({
      data: readFileSync(BOLD_FONT_PATH),
      originalFilename: 'Persisted.ttf',
    });

    const second = createService();
    await second.onModuleInit();
    const fonts = await second.list();
    expect(fonts.some((f) => f.id === record.id)).toBe(true);
  });

  it('rejects a duplicate upload by content hash', async () => {
    const service = createService();
    await service.onModuleInit();
    const data = readFileSync(BOLD_FONT_PATH);
    await service.upload({ data, originalFilename: 'first.ttf' });

    await expect(
      service.upload({ data, originalFilename: 'second.ttf' }),
    ).rejects.toBeInstanceOf(DuplicateFontError);
  });

  it('never uses the client-supplied filename as a path, even with traversal sequences', async () => {
    const service = createService();
    await service.onModuleInit();
    const record = await service.upload({
      data: readFileSync(BOLD_FONT_PATH),
      originalFilename: '../../../etc/passwd',
    });

    expect(record.fileName).not.toContain('..');
    expect(record.fileName).not.toContain('/');
    const paths = await service.resolveFilePath(record.id);
    expect(paths.regular.startsWith(fontsDir)).toBe(true);
  });

  it('deletes an uploaded font and removes its file from disk', async () => {
    const service = createService();
    await service.onModuleInit();
    const record = await service.upload({
      data: readFileSync(BOLD_FONT_PATH),
      originalFilename: 'deletable.ttf',
    });

    await service.delete(record.id);

    const fonts = await service.list();
    expect(fonts.some((f) => f.id === record.id)).toBe(false);
    expect(() =>
      readFileSync(service['storage'].userFontPath(record.fileName)),
    ).toThrow();
  });

  it('refuses to delete the built-in font', async () => {
    const service = createService();
    await service.onModuleInit();

    await expect(service.delete(BUILT_IN_GEIST_MONO_ID)).rejects.toBeInstanceOf(
      BuiltInFontImmutableError,
    );
  });

  it('refuses to delete an unknown font id', async () => {
    const service = createService();
    await service.onModuleInit();

    await expect(service.delete('does-not-exist')).rejects.toBeInstanceOf(
      FontNotFoundError,
    );
  });

  it('refuses to delete a font that is currently in use', async () => {
    const usage = new FontUsageTracker();
    const service = new FontLibraryService(
      new FontStorage(),
      new FontInspector(),
      usage,
    );
    await service.onModuleInit();
    const record = await service.upload({
      data: readFileSync(BOLD_FONT_PATH),
      originalFilename: 'in-use.ttf',
    });

    await usage.withFont(record.id, async () => {
      await expect(service.delete(record.id)).rejects.toBeInstanceOf(
        FontInUseError,
      );
    });
  });

  it('resolves both regular and bold file paths for the built-in font', async () => {
    const service = createService();
    await service.onModuleInit();

    const paths = await service.resolveFilePath(BUILT_IN_GEIST_MONO_ID);
    expect(
      readFileSync(paths.regular).equals(readFileSync(BUILT_IN_FONT_PATH)),
    ).toBe(true);
    expect(paths.bold).toBeDefined();
    expect(readFileSync(paths.bold!).equals(readFileSync(BOLD_FONT_PATH))).toBe(
      true,
    );
  });
});
