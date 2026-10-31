/** Notified after a font's file and index entry are removed, e.g. to un-register it from a renderer's font cache. */
export interface FontDeletionHook {
  onFontDeleted(fontId: string): void;
}
