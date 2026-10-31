import { Alignment } from './printer.models';

export type RasterTextMode = 'raw' | 'antialiased' | 'dithered';
export type DitherAlgorithm = 'floydSteinberg' | 'bayer';

export interface FontCoverage {
  ok: boolean;
  missingCharacters: string[];
}

export interface FontSummary {
  id: string;
  displayName: string;
  originalFilename: string;
  familyName: string;
  format: string;
  builtIn: boolean;
  hasBold: boolean;
  sizeBytes: number;
  uploadedAt: string;
  coverage: FontCoverage;
}

export interface RenderRasterTextRequest {
  text: string;
  fontId: string;
  fontSizePx: number;
  bold: boolean;
  lineSpacing: number;
  align: Alignment;
  mode: RasterTextMode;
  thresholdPercent: number;
  ditherAlgorithm: DitherAlgorithm;
  allowMissingGlyphs: boolean;
}

export interface PrintRasterTextRequest extends RenderRasterTextRequest {
  initialize: boolean;
  cut: boolean;
}

export interface RasterTextPreview {
  pngBase64: string;
  widthDots: number;
  heightDots: number;
  lineCount: number;
  missingCharacters: string[];
}
