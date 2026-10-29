import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import {
  emptyIndex,
  type FontIndexDocument,
  type FontRecord,
} from './font-record';

const INDEX_FILE_NAME = 'index.json';
const USER_FONTS_SUBDIR = 'user';

@Injectable()
export class FontStorage {
  private readonly rootDir: string;
  private readonly userFontsDir: string;
  private writeLock: Promise<void> = Promise.resolve();

  constructor() {
    this.rootDir = process.env.FONTS_DIR?.trim() || '/home/node/fonts';
    this.userFontsDir = join(this.rootDir, USER_FONTS_SUBDIR);
  }

  async ensureReady(): Promise<void> {
    await mkdir(this.userFontsDir, { recursive: true });
  }

  userFontPath(fileName: string): string {
    return join(this.userFontsDir, fileName);
  }

  async readIndex(): Promise<FontIndexDocument> {
    try {
      const raw = await readFile(join(this.rootDir, INDEX_FILE_NAME), 'utf8');
      return JSON.parse(raw) as FontIndexDocument;
    } catch (error) {
      if (isNotFound(error)) return emptyIndex();
      throw error;
    }
  }

  /** Serializes concurrent index mutations so uploads/deletes never race each other onto disk. */
  async mutateIndex(
    mutate: (current: FontIndexDocument) => FontIndexDocument,
  ): Promise<FontIndexDocument> {
    let result!: FontIndexDocument;
    this.writeLock = this.writeLock.then(async () => {
      const current = await this.readIndex();
      const next = mutate(current);
      await this.writeIndexAtomically(next);
      result = next;
    });
    await this.writeLock;
    return result;
  }

  async writeUserFont(data: Buffer, fileName: string): Promise<void> {
    await mkdir(this.userFontsDir, { recursive: true });
    const finalPath = this.userFontPath(fileName);
    const tempPath = `${finalPath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, data);
    await rename(tempPath, finalPath);
  }

  async deleteUserFont(fileName: string): Promise<void> {
    await rm(this.userFontPath(fileName), { force: true });
  }

  private async writeIndexAtomically(index: FontIndexDocument): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
    const finalPath = join(this.rootDir, INDEX_FILE_NAME);
    const tempPath = `${finalPath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify(index, null, 2), 'utf8');
    await rename(tempPath, finalPath);
  }
}

export function sha256Hex(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ENOENT'
  );
}

export function findByHash(
  index: FontIndexDocument,
  sha256: string,
): FontRecord | undefined {
  return index.fonts.find((font) => font.sha256 === sha256);
}

export function findById(
  index: FontIndexDocument,
  id: string,
): FontRecord | undefined {
  return index.fonts.find((font) => font.id === id);
}
