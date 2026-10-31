import { join } from 'node:path';
import { GlobalFonts } from '@napi-rs/canvas';
import { CanvasFontRegistry } from './canvas-font-registry';
import type { FontLibraryService } from '../fonts/font-library.service';

const BUILT_IN_FONT_DIR = join(
  __dirname,
  '..',
  '..',
  'assets',
  'fonts',
  'built-in',
);
const REGULAR_PATH = join(BUILT_IN_FONT_DIR, 'GeistMono-Regular.ttf');
const BOLD_PATH = join(BUILT_IN_FONT_DIR, 'GeistMono-Bold.ttf');

function fakeFontLibrary(
  paths: Record<string, { regular: string; bold?: string }>,
): FontLibraryService {
  return {
    resolveFilePath: (id: string) => {
      const entry = paths[id];
      if (!entry) throw new Error(`no fixture for ${id}`);
      return Promise.resolve(entry);
    },
    addDeletionHook: () => {},
  } as unknown as FontLibraryService;
}

describe('CanvasFontRegistry', () => {
  it('registers a regular-only font under a predictable alias', async () => {
    const fontId = `font-reg-only-${Date.now()}`;
    const registry = new CanvasFontRegistry(
      fakeFontLibrary({ [fontId]: { regular: REGULAR_PATH } }),
    );

    const aliases = await registry.ensureRegistered(fontId);
    expect(GlobalFonts.has(aliases.regular)).toBe(true);
    expect(aliases.bold).toBeUndefined();

    registry.unregister(fontId);
    expect(GlobalFonts.has(aliases.regular)).toBe(false);
  });

  it('registers both regular and bold aliases when a bold file is available', async () => {
    const fontId = `font-with-bold-${Date.now()}`;
    const registry = new CanvasFontRegistry(
      fakeFontLibrary({ [fontId]: { regular: REGULAR_PATH, bold: BOLD_PATH } }),
    );

    const aliases = await registry.ensureRegistered(fontId);
    expect(GlobalFonts.has(aliases.regular)).toBe(true);
    expect(aliases.bold).toBeDefined();
    expect(GlobalFonts.has(aliases.bold!)).toBe(true);

    registry.unregister(fontId);
    expect(GlobalFonts.has(aliases.regular)).toBe(false);
    expect(GlobalFonts.has(aliases.bold!)).toBe(false);
  });

  it('keeps two different font ids registered independently, even if both files share an internal family name', async () => {
    const idA = `font-a-${Date.now()}`;
    const idB = `font-b-${Date.now()}`;
    const registry = new CanvasFontRegistry(
      fakeFontLibrary({
        [idA]: { regular: REGULAR_PATH },
        [idB]: { regular: BOLD_PATH },
      }),
    );

    const aliasesA = await registry.ensureRegistered(idA);
    const aliasesB = await registry.ensureRegistered(idB);
    expect(aliasesA.regular).not.toBe(aliasesB.regular);
    expect(GlobalFonts.has(aliasesA.regular)).toBe(true);
    expect(GlobalFonts.has(aliasesB.regular)).toBe(true);

    registry.unregister(idA);
    expect(GlobalFonts.has(aliasesA.regular)).toBe(false);
    expect(GlobalFonts.has(aliasesB.regular)).toBe(true);

    registry.unregister(idB);
  });

  it('onFontDeleted un-registers the same way unregister does', async () => {
    const fontId = `font-deleted-${Date.now()}`;
    const registry = new CanvasFontRegistry(
      fakeFontLibrary({ [fontId]: { regular: REGULAR_PATH } }),
    );
    const aliases = await registry.ensureRegistered(fontId);
    expect(GlobalFonts.has(aliases.regular)).toBe(true);

    registry.onFontDeleted(fontId);
    expect(GlobalFonts.has(aliases.regular)).toBe(false);
  });

  it('unregistering an id that was never registered is a no-op', () => {
    const registry = new CanvasFontRegistry(fakeFontLibrary({}));
    expect(() => registry.unregister('never-registered')).not.toThrow();
  });

  it('allows re-registering the same font id after it was unregistered', async () => {
    const fontId = `font-reregister-${Date.now()}`;
    const registry = new CanvasFontRegistry(
      fakeFontLibrary({ [fontId]: { regular: REGULAR_PATH } }),
    );
    const first = await registry.ensureRegistered(fontId);
    registry.unregister(fontId);
    const second = await registry.ensureRegistered(fontId);
    expect(GlobalFonts.has(second.regular)).toBe(true);
    expect(second.regular).toBe(first.regular);
  });
});
