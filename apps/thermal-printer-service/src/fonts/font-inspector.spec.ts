import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  InvalidFontFileError,
  UnsupportedFontFormatError,
} from './font-library.errors';
import { FontInspector } from './font-inspector';

const BUILT_IN_FONT_PATH = join(
  __dirname,
  '..',
  '..',
  'assets',
  'fonts',
  'built-in',
  'GeistMono-Regular.ttf',
);

describe('FontInspector', () => {
  const inspector = new FontInspector();

  it('reads family name, format and full glyph coverage for a real TTF', () => {
    const data = readFileSync(BUILT_IN_FONT_PATH);
    const result = inspector.inspect(data);
    expect(result.format).toBe('ttf');
    expect(result.familyName).toContain('Geist Mono');
    expect(result.coverage.ok).toBe(true);
    expect(result.coverage.missingCharacters).toEqual([]);
  });

  it('rejects a file with no recognizable font signature', () => {
    const data = Buffer.from('this is plainly not a font file');
    expect(() => inspector.inspect(data)).toThrow(UnsupportedFontFormatError);
  });

  it('rejects a font collection (.ttc) signature', () => {
    const data = Buffer.concat([Buffer.from('ttcf'), Buffer.alloc(100)]);
    expect(() => inspector.inspect(data)).toThrow(/collection/i);
  });

  it('turns a truncated/corrupt font into a clean error instead of throwing a raw parser exception', () => {
    const realFont = readFileSync(BUILT_IN_FONT_PATH);
    const truncated = realFont.subarray(0, 200);
    expect(() => inspector.inspect(truncated)).toThrow(InvalidFontFileError);
  });
});
