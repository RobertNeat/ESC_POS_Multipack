import { readFile } from 'node:fs/promises';
import { GlobalFonts, type FontKey } from '@napi-rs/canvas';
import { Injectable, OnModuleInit } from '@nestjs/common';
import type { FontDeletionHook } from '../fonts/font-deletion-hook';
import { FontLibraryService } from '../fonts/font-library.service';

export interface RegisteredFontAliases {
  readonly regular: string;
  readonly bold?: string;
}

/**
 * Registers stored fonts with @napi-rs/canvas under an alias derived from
 * the font id (never the family name baked into the file), so two uploaded
 * fonts that happen to share an internal family name never collide and a
 * delete+re-upload is predictable. GlobalFonts.register returns an opaque
 * FontKey that must be kept to later un-register via GlobalFonts.remove.
 */
@Injectable()
export class CanvasFontRegistry implements FontDeletionHook, OnModuleInit {
  private readonly keysByAlias = new Map<string, FontKey>();

  constructor(private readonly fonts: FontLibraryService) {}

  onModuleInit(): void {
    this.fonts.addDeletionHook(this);
  }

  async ensureRegistered(fontId: string): Promise<RegisteredFontAliases> {
    const regularAlias = aliasFor(fontId, 'regular');
    const paths = await this.fonts.resolveFilePath(fontId);
    await this.registerIfMissing(regularAlias, paths.regular);

    let boldAlias: string | undefined;
    if (paths.bold) {
      boldAlias = aliasFor(fontId, 'bold');
      await this.registerIfMissing(boldAlias, paths.bold);
    }

    return { regular: regularAlias, bold: boldAlias };
  }

  onFontDeleted(fontId: string): void {
    this.unregister(fontId);
  }

  /** Un-registers every alias for a font id. Safe to call even if it was never registered. */
  unregister(fontId: string): void {
    for (const variant of ['regular', 'bold'] as const) {
      const alias = aliasFor(fontId, variant);
      const key = this.keysByAlias.get(alias);
      if (key === undefined) continue;
      GlobalFonts.remove(key);
      this.keysByAlias.delete(alias);
    }
  }

  private async registerIfMissing(
    alias: string,
    filePath: string,
  ): Promise<void> {
    if (GlobalFonts.has(alias)) return;
    const data = await readFile(filePath);
    const key = GlobalFonts.register(data, alias);
    if (!key) {
      throw new Error(
        `@napi-rs/canvas failed to register font alias "${alias}".`,
      );
    }
    this.keysByAlias.set(alias, key);
  }
}

function aliasFor(fontId: string, variant: 'regular' | 'bold'): string {
  return `raster-text-${fontId}-${variant}`;
}
