import type { PrinterCapabilitiesProvider } from './capabilities.js';
import type {
  BarcodePrinter,
  CashDrawerController,
  PaperController,
  QrCodePrinter,
  RasterImagePrinter,
  TextFormatController,
  TextPrinter,
  PrinterTextStyle,
} from './printing.js';
import type { PrinterStatusProvider } from './status.js';

export interface PrinterLifecycle {
  initialize(): Promise<void>;
  close(): Promise<void>;
}

/** Minimal model-independent adapter contract suitable for dependency injection. */
export interface PrinterAdapter
  extends
    PrinterLifecycle,
    PrinterStatusProvider,
    PrinterCapabilitiesProvider {}

/** Common task facade for receipt-printer applications. */
export interface ReceiptPrinterAdapter<
  Style extends PrinterTextStyle<string> = PrinterTextStyle,
>
  extends
    PrinterAdapter,
    TextPrinter<Style>,
    BarcodePrinter,
    QrCodePrinter,
    RasterImagePrinter,
    TextFormatController<Style>,
    PaperController,
    CashDrawerController {}
