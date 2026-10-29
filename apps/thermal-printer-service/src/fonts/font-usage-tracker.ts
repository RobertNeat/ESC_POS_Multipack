import { Injectable } from '@nestjs/common';

/**
 * Tracks fonts referenced by in-flight raster renders/print jobs so deletion
 * can refuse a font that a running job still depends on. The renderer
 * (a later chunk) calls `withFont` around each render+print; nothing does
 * yet, so `isInUse` is always false until that wiring lands.
 */
@Injectable()
export class FontUsageTracker {
  private readonly activeCounts = new Map<string, number>();

  async withFont<T>(fontId: string, operation: () => Promise<T>): Promise<T> {
    this.activeCounts.set(fontId, (this.activeCounts.get(fontId) ?? 0) + 1);
    try {
      return await operation();
    } finally {
      const next = (this.activeCounts.get(fontId) ?? 1) - 1;
      if (next <= 0) this.activeCounts.delete(fontId);
      else this.activeCounts.set(fontId, next);
    }
  }

  isInUse(fontId: string): boolean {
    return (this.activeCounts.get(fontId) ?? 0) > 0;
  }
}
