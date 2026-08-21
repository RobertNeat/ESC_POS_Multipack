import {
  type BarcodeSystem,
  type ByteSource,
  type ImageScale,
  type PrinterBytes,
  toPrinterBytes,
} from '@esc-pos-multipack/printer-adapter';
import type { Pos8370Instruction } from './esc-pos-instruction.js';

const ESC = 0x1b,
  FS = 0x1c,
  GS = 0x1d;

/** Encodes every command documented in the POS-8370 vendor programmer manual. */
export function encodePos8370Instruction(
  command: Pos8370Instruction,
): PrinterBytes {
  switch (command.type) {
    case 'horizontalTab':
      return bytes(0x09);
    case 'lineFeed':
      return bytes(0x0a);
    case 'realTimeDrawerPulse':
      return bytes(
        0x10,
        0x14,
        1,
        command.pin === 2 ? 0 : 1,
        ranged(command.duration100ms, 1, 8, 'duration100ms'),
      );
    case 'characterSpacing':
      return bytes(ESC, 0x20, byte(command.units, 'units'));
    case 'printMode':
      return bytes(ESC, 0x21, byte(command.value, 'value'));
    case 'absolutePosition':
      return bytes(ESC, 0x24, ...word(command.units, 'units'));
    case 'userDefinedCharacterSet':
      return bytes(ESC, 0x25, command.enabled ? 1 : 0);
    case 'defineUserDefinedCharacters':
      return defineUserCharacters(command.firstCode, command.characters);
    case 'bitImage':
      return bitImage(command.mode, command.width, command.data);
    case 'underline':
      return bytes(ESC, 0x2d, command.thickness);
    case 'defaultLineSpacing':
      return bytes(ESC, 0x32);
    case 'lineSpacing':
      return bytes(ESC, 0x33, byte(command.units, 'units'));
    case 'cancelUserDefinedCharacter':
      return bytes(ESC, 0x3f, ranged(command.code, 32, 126, 'code'));
    case 'initialize':
      return bytes(ESC, 0x40);
    case 'buzzer':
      return bytes(
        ESC,
        0x42,
        ranged(command.count, 1, 9, 'count'),
        ranged(command.interval100ms, 1, 9, 'interval100ms'),
      );
    case 'horizontalTabs':
      return horizontalTabs(command.columns);
    case 'emphasized':
      return bytes(ESC, 0x45, command.enabled ? 1 : 0);
    case 'doubleStrike':
      return bytes(ESC, 0x47, command.enabled ? 1 : 0);
    case 'feedDots':
      return bytes(ESC, 0x4a, byte(command.units, 'units'));
    case 'font':
      return bytes(
        ESC,
        0x4d,
        ({ A: 0, B: 1, specialB: 98 } as const)[command.font],
      );
    case 'rotate90':
      return bytes(ESC, 0x56, command.enabled ? 1 : 0);
    case 'relativePosition':
      return bytes(ESC, 0x5c, ...signedWord(command.units, 'units'));
    case 'justification':
      return bytes(
        ESC,
        0x61,
        ({ left: 0, center: 1, right: 2 } as const)[command.value],
      );
    case 'panelButtons':
      return bytes(ESC, 0x63, 0x35, command.enabled ? 0 : 1);
    case 'feedLines':
      return bytes(ESC, 0x64, byte(command.lines, 'lines'));
    case 'drawerPulse':
      return bytes(
        ESC,
        0x70,
        command.pin === 2 ? 0 : 1,
        byte(command.onTime2ms, 'onTime2ms'),
        byte(command.offTime2ms, 'offTime2ms'),
      );
    case 'codeTable':
      return bytes(ESC, 0x74, codeTable(command.table));
    case 'upsideDown':
      return bytes(ESC, 0x7b, command.enabled ? 1 : 0);
    case 'legacyPartialCut':
      return bytes(ESC, command.variant === 'ESC i' ? 0x69 : 0x6d);
    case 'printNvImage':
      return bytes(
        FS,
        0x70,
        ranged(command.image, 1, 255, 'image'),
        imageScale(command.mode),
      );
    case 'defineNvImages':
      return defineNvImages(command.images);
    case 'characterSize':
      return bytes(GS, 0x21, (command.width - 1) * 16 + command.height - 1);
    case 'reverse':
      return bytes(GS, 0x42, command.enabled ? 1 : 0);
    case 'hriPosition':
      return bytes(
        GS,
        0x48,
        ({ none: 0, above: 1, below: 2, both: 3 } as const)[command.position],
      );
    case 'leftMargin':
      return bytes(GS, 0x4c, ...word(command.units, 'units'));
    case 'cut':
      return bytes(GS, 0x56, 66, byte(command.feedUnits ?? 16, 'feedUnits'));
    case 'hriFont':
      return bytes(GS, 0x66, command.font === 'A' ? 0 : 1);
    case 'barcodeHeight':
      return bytes(GS, 0x68, ranged(command.dots, 1, 255, 'dots'));
    case 'barcode':
      return barcode(
        command.system,
        command.data,
        command.format ?? 'lengthPrefixed',
      );
    case 'rasterImage':
      return rasterImage(
        command.mode,
        command.widthBytes,
        command.height,
        command.data,
      );
    case 'barcodeWidth':
      return bytes(GS, 0x77, command.width);
    case 'barcodeLeftSpacing':
      return bytes(GS, 0x78, byte(command.units, 'units'));
    case 'hanziPrintMode':
      return bytes(FS, 0x21, byte(command.value, 'value'));
    case 'hanziMode':
      return bytes(FS, command.enabled ? 0x26 : 0x2e);
    case 'hanziUnderline':
      return bytes(FS, 0x2d, command.thickness);
    case 'hanziSpacing':
      return bytes(
        FS,
        0x53,
        byte(command.left, 'left'),
        byte(command.right, 'right'),
      );
    case 'qrCode':
      return qrCode(
        command.version,
        command.errorCorrection,
        command.moduleSize,
        command.data,
      );
    case 'hanziQuadruple':
      return bytes(FS, 0x57, command.enabled ? 1 : 0);
    case 'realTimeStatus':
      return bytes(0x10, 0x04, command.status);
  }
}

/** Frequently used POS-8370 ESC/POS commands. */
export const ESC_POS = {
  initialize: encodePos8370Instruction({ type: 'initialize' }),
  horizontalTab: encodePos8370Instruction({ type: 'horizontalTab' }),
  lineFeed: encodePos8370Instruction({ type: 'lineFeed' }),
  partialCut: encodePos8370Instruction({ type: 'cut' }),
  selectFontA: encodePos8370Instruction({ type: 'font', font: 'A' }),
  selectFontB: encodePos8370Instruction({ type: 'font', font: 'B' }),
  selectSpecialFontB: encodePos8370Instruction({
    type: 'font',
    font: 'specialB',
  }),
  selectHanziMode: encodePos8370Instruction({
    type: 'hanziMode',
    enabled: true,
  }),
  cancelHanziMode: encodePos8370Instruction({
    type: 'hanziMode',
    enabled: false,
  }),
  realTimeStatus: (status: 1 | 2 | 3 | 4) =>
    encodePos8370Instruction({ type: 'realTimeStatus', status }),
  buzzer: (count: number, interval100ms: number) =>
    encodePos8370Instruction({ type: 'buzzer', count, interval100ms }),
  selectJustification: (n: 0 | 1 | 2) =>
    encodePos8370Instruction({
      type: 'justification',
      value: (['left', 'center', 'right'] as const)[n],
    }),
  setPrintMode: (value: number) =>
    encodePos8370Instruction({ type: 'printMode', value }),
  setBarcodeWidth: (width: 2 | 3 | 4 | 5 | 6) =>
    encodePos8370Instruction({ type: 'barcodeWidth', width }),
  printAndFeedDots: (units: number) =>
    encodePos8370Instruction({ type: 'feedDots', units }),
} as const;

function defineUserCharacters(
  firstCode: number,
  characters: readonly { width: number; data: ByteSource }[],
): PrinterBytes {
  ranged(firstCode, 32, 126, 'firstCode');
  if (characters.length < 1 || firstCode + characters.length - 1 > 126)
    throw new RangeError(
      'User-defined character range must stay within 32..126.',
    );
  const body: PrinterBytes[] = [];
  for (const character of characters) {
    const width = ranged(character.width, 0, 12, 'character.width'),
      data = toPrinterBytes(character.data);
    expectedLength(data, width * 3, 'user-defined character data');
    body.push(bytes(width), data);
  }
  return concat(
    bytes(ESC, 0x26, 3, firstCode, firstCode + characters.length - 1),
    ...body,
  );
}

function bitImage(
  mode: 0 | 1 | 32 | 33,
  width: number,
  source: ByteSource,
): PrinterBytes {
  ranged(width, 1, 1023, 'width');
  const data = toPrinterBytes(source);
  expectedLength(data, width * (mode >= 32 ? 3 : 1), 'bit-image data');
  return concat(bytes(ESC, 0x2a, mode, ...word(width, 'width')), data);
}

function horizontalTabs(columns: readonly number[]): PrinterBytes {
  if (columns.length > 32)
    throw new RangeError('At most 32 horizontal tabs may be defined.');
  let previous = 0;
  for (const column of columns) {
    ranged(column, 1, 255, 'tab column');
    if (column <= previous)
      throw new RangeError(
        'Horizontal tab columns must be strictly increasing.',
      );
    previous = column;
  }
  return bytes(ESC, 0x44, ...columns, 0);
}

function defineNvImages(
  images: readonly {
    widthBytes: number;
    heightBytes: number;
    data: ByteSource;
  }[],
): PrinterBytes {
  ranged(images.length, 1, 255, 'images.length');
  const body: PrinterBytes[] = [];
  let total = 0;
  for (const image of images) {
    ranged(image.widthBytes, 1, 1023, 'widthBytes');
    ranged(image.heightBytes, 1, 288, 'heightBytes');
    const data = toPrinterBytes(image.data);
    expectedLength(
      data,
      image.widthBytes * image.heightBytes * 8,
      'NV image data',
    );
    total += data.length + 4;
    body.push(
      bytes(
        ...word(image.widthBytes, 'widthBytes'),
        ...word(image.heightBytes, 'heightBytes'),
      ),
      data,
    );
  }
  if (total > 192 * 1024)
    throw new RangeError(
      'NV image definitions exceed the 192 KiB printer limit.',
    );
  return concat(bytes(FS, 0x71, images.length), ...body);
}

function barcode(
  system: BarcodeSystem,
  source: ByteSource,
  format: 'lengthPrefixed' | 'nulTerminated',
): PrinterBytes {
  const data = toPrinterBytes(source);
  ranged(data.length, system === 'code128' ? 2 : 1, 255, 'barcode data length');
  if (system === 'itf' && data.length % 2 !== 0)
    throw new RangeError('ITF barcode data length must be even.');
  const lengthIds: Record<BarcodeSystem, number> = {
    upcA: 65,
    upcE: 66,
    ean13: 67,
    ean8: 68,
    code39: 69,
    itf: 70,
    codabar: 71,
    code93: 72,
    code128: 73,
  };
  if (format === 'nulTerminated') {
    const nulIds: Partial<Record<BarcodeSystem, number>> = {
      upcA: 0,
      upcE: 1,
      ean13: 2,
      ean8: 3,
      code39: 4,
      itf: 5,
      codabar: 6,
    };
    const id = nulIds[system];
    if (id === undefined)
      throw new RangeError(
        `${system} is only available in length-prefixed barcode format.`,
      );
    if (data.includes(0))
      throw new RangeError(
        'NUL-terminated barcode data cannot contain a NUL byte.',
      );
    return concat(bytes(GS, 0x6b, id), data, bytes(0));
  }
  return concat(bytes(GS, 0x6b, lengthIds[system], data.length), data);
}

function rasterImage(
  mode: ImageScale,
  widthBytes: number,
  height: number,
  source: ByteSource,
): PrinterBytes {
  ranged(widthBytes, 1, 128, 'widthBytes');
  ranged(height, 1, 4095, 'height');
  const data = toPrinterBytes(source);
  expectedLength(data, widthBytes * height, 'raster image data');
  return concat(
    bytes(
      GS,
      0x76,
      0x30,
      imageScale(mode),
      ...word(widthBytes, 'widthBytes'),
      ...word(height, 'height'),
    ),
    data,
  );
}

function qrCode(
  version: number,
  ec: 'L' | 'M' | 'Q' | 'H',
  moduleSize: number,
  source: ByteSource,
): PrinterBytes {
  ranged(version, 0, 40, 'version');
  ranged(moduleSize, 1, 8, 'moduleSize');
  const data = toPrinterBytes(source);
  ranged(data.length, 0, 65535, 'QR data length');
  return concat(
    bytes(
      ESC,
      0x5a,
      version,
      ({ L: 0, M: 1, Q: 2, H: 3 } as const)[ec],
      moduleSize,
      ...word(data.length, 'data.length'),
    ),
    data,
  );
}

function imageScale(scale: ImageScale): number {
  return (
    { normal: 0, doubleWidth: 1, doubleHeight: 2, quadruple: 3 } as const
  )[scale];
}
function codeTable(value: number): number {
  if (!(
    (value >= 0 && value <= 5) ||
    (value >= 16 && value <= 19) ||
    value === 0x48 ||
    value === 0x4c ||
    value === 255
  )) {
    throw new RangeError('table must be 0..5, 16..19, 72, 76, or 255.');
  }
  return value;
}
function byte(value: number, name: string): number {
  return ranged(value, 0, 255, name);
}
function ranged(value: number, min: number, max: number, name: string): number {
  if (!Number.isInteger(value) || value < min || value > max)
    throw new RangeError(
      `${name} must be an integer from ${min} to ${max}. Received: ${value}`,
    );
  return value;
}
function word(value: number, name: string): [number, number] {
  ranged(value, 0, 65535, name);
  return [value & 0xff, value >>> 8];
}
function signedWord(value: number, name: string): [number, number] {
  ranged(value, -32768, 32767, name);
  return word(value < 0 ? 65536 + value : value, name);
}
function bytes(...values: readonly number[]): PrinterBytes {
  return Uint8Array.from(values);
}
function concat(...parts: readonly PrinterBytes[]): PrinterBytes {
  const output = new Uint8Array(
    parts.reduce((sum, part) => sum + part.length, 0),
  );
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}
function expectedLength(
  data: PrinterBytes,
  expected: number,
  name: string,
): void {
  if (data.length !== expected)
    throw new RangeError(
      `${name} must contain ${expected} bytes. Received: ${data.length}`,
    );
}
