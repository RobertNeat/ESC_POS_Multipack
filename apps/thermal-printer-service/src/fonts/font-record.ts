import type { GlyphCoverageResult } from './glyph-coverage';

export type FontFileFormat = 'ttf' | 'otf';

export interface FontRecord {
  readonly id: string;
  readonly displayName: string;
  readonly originalFilename: string;
  readonly familyName: string;
  readonly format: FontFileFormat;
  readonly builtIn: boolean;
  /** Relative to the fonts directory's "regular" subfolder; built-ins also carry a bold variant. */
  readonly fileName: string;
  readonly boldFileName?: string;
  readonly sizeBytes: number;
  readonly sha256: string;
  readonly uploadedAt: string;
  readonly coverage: GlyphCoverageResult;
}

export interface FontIndexDocument {
  readonly version: 1;
  readonly fonts: readonly FontRecord[];
}

export function emptyIndex(): FontIndexDocument {
  return { version: 1, fonts: [] };
}
