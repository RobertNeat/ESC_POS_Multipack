import { Injectable } from '@nestjs/common';
import * as fontkit from 'fontkit';
import type { Font } from 'fontkit';
import {
  evaluateGlyphCoverage,
  type GlyphCoverageResult,
} from './glyph-coverage';
import {
  InvalidFontFileError,
  UnsupportedFontFormatError,
} from './font-library.errors';
import { detectFontSignature } from './font-signature';
import type { FontFileFormat } from './font-record';

export interface InspectedFont {
  readonly format: FontFileFormat;
  readonly familyName: string;
  readonly coverage: GlyphCoverageResult;
}

@Injectable()
export class FontInspector {
  inspect(data: Buffer): InspectedFont {
    const format = this.detectFormat(data);
    const font = this.openFont(data);
    const coverage = evaluateGlyphCoverage((codePoint) =>
      hasGlyph(font, codePoint),
    );
    return {
      format,
      familyName: fontFamilyName(font),
      coverage,
    };
  }

  private detectFormat(data: Buffer): FontFileFormat {
    const signature = detectFontSignature(data);
    if (signature.format === 'ttf' || signature.format === 'otf') {
      return signature.format;
    }
    if (signature.format === 'ttc') {
      throw new UnsupportedFontFormatError(
        'Font collections (.ttc) are not supported. Upload a single TTF or OTF font.',
      );
    }
    throw new UnsupportedFontFormatError(
      'File is not a recognized TTF or OTF font (signature check failed).',
    );
  }

  private openFont(data: Buffer): Font {
    let opened: ReturnType<typeof fontkit.create>;
    try {
      opened = fontkit.create(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new InvalidFontFileError(`Could not parse font file: ${message}`);
    }
    if ('fonts' in opened) {
      throw new UnsupportedFontFormatError(
        'Font collections (.ttc) are not supported. Upload a single TTF or OTF font.',
      );
    }
    return opened;
  }
}

function hasGlyph(font: Font, codePoint: number): boolean {
  try {
    return font.hasGlyphForCodePoint(codePoint);
  } catch {
    return false;
  }
}

function fontFamilyName(font: Font): string {
  return font.familyName?.trim() || font.postscriptName?.trim() || 'Unknown';
}
