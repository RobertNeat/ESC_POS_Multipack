import type { ByteSource } from './bytes.js';

export type PrinterAlignment = 'left' | 'center' | 'right';
export type Scale1To8 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type ImageScale =
  'normal' | 'doubleWidth' | 'doubleHeight' | 'quadruple';
export type BarcodeSystem =
  | 'upcA'
  | 'upcE'
  | 'ean13'
  | 'ean8'
  | 'code39'
  | 'itf'
  | 'codabar'
  | 'code93'
  | 'code128';

export type PrinterFontRole = 'primary' | 'secondary';

/** Generic text style parameterized by the font vocabulary of an adapter. */
export interface PrinterTextStyle<Font extends string = PrinterFontRole> {
  readonly font?: Font;
  readonly emphasized?: boolean;
  readonly underline?: 0 | 1 | 2;
  readonly width?: Scale1To8;
  readonly height?: Scale1To8;
  readonly reverse?: boolean;
}

export interface PrintTextOptions<
  Style extends PrinterTextStyle<string> = PrinterTextStyle,
> {
  readonly alignment?: PrinterAlignment;
  readonly style?: Style;
  readonly encoding?: string;
  readonly appendLineFeed?: boolean;
}

export interface PrintBarcodeRequest {
  readonly system: BarcodeSystem;
  readonly data: ByteSource;
  readonly alignment?: PrinterAlignment;
  readonly width?: 2 | 3 | 4 | 5 | 6;
  readonly height?: number;
  readonly hriPosition?: 'none' | 'above' | 'below' | 'both';
  readonly hriFont?: PrinterFontRole;
}

export interface PrintQrCodeRequest {
  readonly data: ByteSource;
  readonly alignment?: PrinterAlignment;
  readonly version?: number;
  readonly errorCorrection?: 'L' | 'M' | 'Q' | 'H';
  readonly moduleSize?: number;
}

export interface PrintRasterImageRequest {
  readonly data: ByteSource;
  readonly widthBytes: number;
  readonly height: number;
  readonly alignment?: PrinterAlignment;
  readonly scale?: ImageScale;
}

export interface TextPrinter<
  Style extends PrinterTextStyle<string> = PrinterTextStyle,
> {
  printText(text: string, options?: PrintTextOptions<Style>): Promise<void>;
}

export interface BarcodePrinter {
  printBarcode(request: PrintBarcodeRequest): Promise<void>;
}

export interface QrCodePrinter {
  printQrCode(request: PrintQrCodeRequest): Promise<void>;
}

export interface RasterImagePrinter {
  printRasterImage(request: PrintRasterImageRequest): Promise<void>;
}

export interface TextFormatController<
  Style extends PrinterTextStyle<string> = PrinterTextStyle,
> {
  setAlignment(alignment: PrinterAlignment): Promise<void>;
  setTextStyle(style: Style): Promise<void>;
}

export interface PaperController {
  feed(lines?: number): Promise<void>;
  cut(feedUnits?: number): Promise<void>;
}

export interface CashDrawerController {
  openCashDrawer(): Promise<void>;
}
