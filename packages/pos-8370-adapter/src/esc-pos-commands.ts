export const ESC_POS = {
  initialize: Uint8Array.from([0x1b, 0x40]),
  lineFeed: Uint8Array.from([0x0a]),
  fullCut: Uint8Array.from([0x1d, 0x56, 0x00]),
  partialCut: Uint8Array.from([0x1d, 0x56, 0x01]),
  selectFontA: Uint8Array.from([0x1b, 0x4d, 0x00]),
  selectFontB: Uint8Array.from([0x1b, 0x4d, 0x01]),
  selectHanziMode: Uint8Array.from([0x1c, 0x26]),
  cancelHanziMode: Uint8Array.from([0x1c, 0x2e]),
  realTimeStatus: (n: 1 | 2 | 3 | 4) => Uint8Array.from([0x10, 0x04, n]),
  buzzer: (count: number, interval100ms: number) => Uint8Array.from([0x1b, 0x42, count, interval100ms]),
  selectJustification: (n: 0 | 1 | 2) => Uint8Array.from([0x1b, 0x61, n]),
  setPrintMode: (n: number) => Uint8Array.from([0x1b, 0x21, n]),
  setBarcodeWidth: (n: 2 | 3 | 4 | 5 | 6) => Uint8Array.from([0x1d, 0x77, n]),
  printAndFeedDots: (n: number) => Uint8Array.from([0x1b, 0x4a, n])
} as const;

