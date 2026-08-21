import type {
  BarcodeSystem,
  ByteSource,
  ImageScale,
  Scale1To8,
} from '@esc-pos-multipack/printer-adapter';

/** Low-level instructions supported by the POS-8370 ESC/POS driver. */
export type Pos8370Instruction =
  | { readonly type: 'horizontalTab' }
  | { readonly type: 'lineFeed' }
  | {
      readonly type: 'realTimeDrawerPulse';
      readonly pin: 2 | 5;
      readonly duration100ms: number;
    }
  | { readonly type: 'characterSpacing'; readonly units: number }
  | { readonly type: 'printMode'; readonly value: number }
  | { readonly type: 'absolutePosition'; readonly units: number }
  | { readonly type: 'userDefinedCharacterSet'; readonly enabled: boolean }
  | {
      readonly type: 'defineUserDefinedCharacters';
      readonly firstCode: number;
      readonly characters: readonly Pos8370UserDefinedCharacter[];
    }
  | {
      readonly type: 'bitImage';
      readonly mode: 0 | 1 | 32 | 33;
      readonly width: number;
      readonly data: ByteSource;
    }
  | { readonly type: 'underline'; readonly thickness: 0 | 1 | 2 }
  | { readonly type: 'defaultLineSpacing' }
  | { readonly type: 'lineSpacing'; readonly units: number }
  | { readonly type: 'cancelUserDefinedCharacter'; readonly code: number }
  | { readonly type: 'initialize' }
  | {
      readonly type: 'buzzer';
      readonly count: number;
      readonly interval100ms: number;
    }
  | { readonly type: 'horizontalTabs'; readonly columns: readonly number[] }
  | { readonly type: 'emphasized'; readonly enabled: boolean }
  | { readonly type: 'doubleStrike'; readonly enabled: boolean }
  | { readonly type: 'feedDots'; readonly units: number }
  | { readonly type: 'font'; readonly font: 'A' | 'B' | 'specialB' }
  | { readonly type: 'rotate90'; readonly enabled: boolean }
  | { readonly type: 'relativePosition'; readonly units: number }
  | {
      readonly type: 'justification';
      readonly value: 'left' | 'center' | 'right';
    }
  | { readonly type: 'panelButtons'; readonly enabled: boolean }
  | { readonly type: 'feedLines'; readonly lines: number }
  | {
      readonly type: 'drawerPulse';
      readonly pin: 2 | 5;
      readonly onTime2ms: number;
      readonly offTime2ms: number;
    }
  | { readonly type: 'codeTable'; readonly table: number }
  | { readonly type: 'upsideDown'; readonly enabled: boolean }
  | { readonly type: 'legacyPartialCut'; readonly variant: 'ESC i' | 'ESC m' }
  | {
      readonly type: 'printNvImage';
      readonly image: number;
      readonly mode: ImageScale;
    }
  | {
      readonly type: 'defineNvImages';
      readonly images: readonly Pos8370NvImage[];
    }
  | {
      readonly type: 'characterSize';
      readonly width: Scale1To8;
      readonly height: Scale1To8;
    }
  | { readonly type: 'reverse'; readonly enabled: boolean }
  | {
      readonly type: 'hriPosition';
      readonly position: 'none' | 'above' | 'below' | 'both';
    }
  | { readonly type: 'leftMargin'; readonly units: number }
  | { readonly type: 'cut'; readonly feedUnits?: number }
  | { readonly type: 'hriFont'; readonly font: 'A' | 'B' }
  | { readonly type: 'barcodeHeight'; readonly dots: number }
  | {
      readonly type: 'barcode';
      readonly system: BarcodeSystem;
      readonly data: ByteSource;
      readonly format?: 'lengthPrefixed' | 'nulTerminated';
    }
  | {
      readonly type: 'rasterImage';
      readonly mode: ImageScale;
      readonly widthBytes: number;
      readonly height: number;
      readonly data: ByteSource;
    }
  | { readonly type: 'barcodeWidth'; readonly width: 2 | 3 | 4 | 5 | 6 }
  | { readonly type: 'barcodeLeftSpacing'; readonly units: number }
  | { readonly type: 'hanziPrintMode'; readonly value: number }
  | { readonly type: 'hanziMode'; readonly enabled: boolean }
  | { readonly type: 'hanziUnderline'; readonly thickness: 0 | 1 | 2 }
  | {
      readonly type: 'hanziSpacing';
      readonly left: number;
      readonly right: number;
    }
  | {
      readonly type: 'qrCode';
      readonly version: number;
      readonly errorCorrection: 'L' | 'M' | 'Q' | 'H';
      readonly moduleSize: number;
      readonly data: ByteSource;
    }
  | { readonly type: 'hanziQuadruple'; readonly enabled: boolean }
  | { readonly type: 'realTimeStatus'; readonly status: 1 | 2 | 3 | 4 };

export interface Pos8370UserDefinedCharacter {
  readonly width: number;
  readonly data: ByteSource;
}

export interface Pos8370NvImage {
  readonly widthBytes: number;
  readonly heightBytes: number;
  readonly data: ByteSource;
}
