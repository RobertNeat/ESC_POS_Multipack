import { readFile } from 'node:fs/promises';
import * as fontkit from 'fontkit';
import type { Font } from 'fontkit';
import { Injectable, OnModuleInit } from '@nestjs/common';
import type { FontDeletionHook } from '../fonts/font-deletion-hook';
import { FontLibraryService } from '../fonts/font-library.service';

/**
 * Checks whether a font actually covers the text in a specific render
 * request. Stored glyph coverage only reflects the fixed required character
 * set from upload time; the rendered text can contain anything, and Skia
 * silently substitutes a fallback font for missing glyphs instead of
 * failing, so this must be checked explicitly before trusting a render.
 */
@Injectable()
export class RequestGlyphChecker implements FontDeletionHook, OnModuleInit {
  private readonly fontsById = new Map<string, Font>();

  constructor(private readonly fonts: FontLibraryService) {}

  onModuleInit(): void {
    this.fonts.addDeletionHook(this);
  }

  onFontDeleted(fontId: string): void {
    this.fontsById.delete(fontId);
  }

  async missingCharacters(
    fontId: string,
    text: string,
  ): Promise<readonly string[]> {
    const font = await this.loadFont(fontId);
    const missing = new Set<string>();
    for (const character of text) {
      if (character === '\n' || character === '\r') continue;
      const codePoint = character.codePointAt(0);
      if (codePoint === undefined) continue;
      if (!hasGlyph(font, codePoint)) missing.add(character);
    }
    return [...missing];
  }

  private async loadFont(fontId: string): Promise<Font> {
    const cached = this.fontsById.get(fontId);
    if (cached) return cached;
    const paths = await this.fonts.resolveFilePath(fontId);
    const data = await readFile(paths.regular);
    const font = fontkit.create(data) as Font;
    this.fontsById.set(fontId, font);
    return font;
  }
}

function hasGlyph(font: Font, codePoint: number): boolean {
  try {
    return font.hasGlyphForCodePoint(codePoint);
  } catch {
    return false;
  }
}
