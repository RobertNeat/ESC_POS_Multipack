import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  BUILT_IN_FONTS,
  MAX_FONT_UPLOAD_BYTES,
} from './font-library.constants';
import {
  BuiltInFontImmutableError,
  DuplicateFontError,
  FontInUseError,
  FontNotFoundError,
} from './font-library.errors';
import { FontInspector } from './font-inspector';
import type { FontRecord } from './font-record';
import { findByHash, findById, FontStorage, sha256Hex } from './font-storage';
import { FontUsageTracker } from './font-usage-tracker';

const BUILT_IN_ASSETS_DIR = join(
  __dirname,
  '..',
  '..',
  'assets',
  'fonts',
  'built-in',
);

export interface UploadFontInput {
  readonly data: Buffer;
  readonly originalFilename: string;
  readonly displayName?: string;
}

@Injectable()
export class FontLibraryService implements OnModuleInit {
  constructor(
    private readonly storage: FontStorage,
    private readonly inspector: FontInspector,
    private readonly usage: FontUsageTracker,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.storage.ensureReady();
    await this.ensureBuiltInsIndexed();
  }

  async list(): Promise<readonly FontRecord[]> {
    const index = await this.storage.readIndex();
    return index.fonts;
  }

  async upload(input: UploadFontInput): Promise<FontRecord> {
    if (input.data.byteLength > MAX_FONT_UPLOAD_BYTES) {
      throw new DuplicateFontError(
        `Font file exceeds the ${MAX_FONT_UPLOAD_BYTES} byte limit.`,
      );
    }
    const inspected = this.inspector.inspect(input.data);
    const sha256 = sha256Hex(input.data);

    const existingIndex = await this.storage.readIndex();
    const duplicate = findByHash(existingIndex, sha256);
    if (duplicate) {
      throw new DuplicateFontError(
        `This font file is already in the library as "${duplicate.displayName}".`,
      );
    }

    const id = randomUUID();
    const fileName = `${id}.${inspected.format}`;
    await this.storage.writeUserFont(input.data, fileName);

    const record: FontRecord = {
      id,
      displayName: input.displayName?.trim() || inspected.familyName,
      originalFilename: input.originalFilename,
      familyName: inspected.familyName,
      format: inspected.format,
      builtIn: false,
      fileName,
      sizeBytes: input.data.byteLength,
      sha256,
      uploadedAt: new Date().toISOString(),
      coverage: inspected.coverage,
    };

    await this.storage.mutateIndex((current) => ({
      ...current,
      fonts: [...current.fonts, record],
    }));

    return record;
  }

  async delete(id: string): Promise<void> {
    const index = await this.storage.readIndex();
    const record = findById(index, id);
    if (!record) throw new FontNotFoundError(`Unknown font id: "${id}".`);
    if (record.builtIn) {
      throw new BuiltInFontImmutableError(
        `"${record.displayName}" is a built-in font and cannot be deleted.`,
      );
    }
    if (this.usage.isInUse(id)) {
      throw new FontInUseError(
        `"${record.displayName}" is currently used by a running print job.`,
      );
    }

    await this.storage.mutateIndex((current) => ({
      ...current,
      fonts: current.fonts.filter((font) => font.id !== id),
    }));
    await this.storage.deleteUserFont(record.fileName);
  }

  /** Absolute path to a stored font's regular file, for the renderer to load. */
  async resolveFilePath(
    id: string,
  ): Promise<{ regular: string; bold?: string }> {
    const index = await this.storage.readIndex();
    const record = findById(index, id);
    if (!record) throw new FontNotFoundError(`Unknown font id: "${id}".`);
    if (record.builtIn) {
      return {
        regular: join(BUILT_IN_ASSETS_DIR, record.fileName),
        bold: record.boldFileName
          ? join(BUILT_IN_ASSETS_DIR, record.boldFileName)
          : undefined,
      };
    }
    return { regular: this.storage.userFontPath(record.fileName) };
  }

  private async ensureBuiltInsIndexed(): Promise<void> {
    const index = await this.storage.readIndex();
    const missing = BUILT_IN_FONTS.filter(
      (builtIn) => !findById(index, builtIn.id),
    );
    if (missing.length === 0) return;

    const added: FontRecord[] = [];
    for (const builtIn of missing) {
      const data = await readFile(
        join(BUILT_IN_ASSETS_DIR, builtIn.regularFile),
      );
      const inspected = this.inspector.inspect(data);
      added.push({
        id: builtIn.id,
        displayName: builtIn.displayName,
        originalFilename: builtIn.regularFile,
        familyName: inspected.familyName,
        format: inspected.format,
        builtIn: true,
        fileName: builtIn.regularFile,
        boldFileName: builtIn.boldFile,
        sizeBytes: data.byteLength,
        sha256: sha256Hex(data),
        uploadedAt: new Date(0).toISOString(),
        coverage: inspected.coverage,
      });
    }

    await this.storage.mutateIndex((current) => ({
      ...current,
      fonts: [...current.fonts, ...added],
    }));
  }
}
