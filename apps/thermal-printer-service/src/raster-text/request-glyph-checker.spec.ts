import { join } from 'node:path';
import type { FontLibraryService } from '../fonts/font-library.service';
import { RequestGlyphChecker } from './request-glyph-checker';

const REGULAR_PATH = join(
  __dirname,
  '..',
  '..',
  'assets',
  'fonts',
  'built-in',
  'GeistMono-Regular.ttf',
);

function fakeFontLibrary(): FontLibraryService {
  return {
    resolveFilePath: () => Promise.resolve({ regular: REGULAR_PATH }),
    addDeletionHook: () => {},
  } as unknown as FontLibraryService;
}

describe('RequestGlyphChecker', () => {
  it('reports no missing characters for plain ASCII text', async () => {
    const checker = new RequestGlyphChecker(fakeFontLibrary());
    const missing = await checker.missingCharacters(
      'font-a',
      'Hello World 123',
    );
    expect(missing).toEqual([]);
  });

  it('reports missing characters for codepoints the font does not cover', async () => {
    const checker = new RequestGlyphChecker(fakeFontLibrary());
    const missing = await checker.missingCharacters('font-a', 'Hi अआ there');
    expect(new Set(missing)).toEqual(new Set(['अ', 'आ']));
  });

  it('ignores newlines when checking coverage', async () => {
    const checker = new RequestGlyphChecker(fakeFontLibrary());
    const missing = await checker.missingCharacters(
      'font-a',
      'line one\nline two\r\n',
    );
    expect(missing).toEqual([]);
  });

  it('deduplicates repeated missing characters', async () => {
    const checker = new RequestGlyphChecker(fakeFontLibrary());
    const missing = await checker.missingCharacters('font-a', 'अअअ');
    expect(missing).toEqual(['अ']);
  });

  it('forgets a cached font after onFontDeleted', async () => {
    let resolveCalls = 0;
    const fonts = {
      resolveFilePath: () => {
        resolveCalls++;
        return Promise.resolve({ regular: REGULAR_PATH });
      },
      addDeletionHook: () => {},
    } as unknown as FontLibraryService;
    const checker = new RequestGlyphChecker(fonts);

    await checker.missingCharacters('font-a', 'hi');
    await checker.missingCharacters('font-a', 'hi again');
    expect(resolveCalls).toBe(1);

    checker.onFontDeleted('font-a');
    await checker.missingCharacters('font-a', 'hi once more');
    expect(resolveCalls).toBe(2);
  });
});
