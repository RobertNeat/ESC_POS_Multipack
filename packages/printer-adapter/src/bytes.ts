/** Binary data accepted at a printer boundary. */
export type PrinterBytes = Uint8Array;

export type ByteSource =
  PrinterBytes | readonly number[] | ArrayBuffer | ArrayBufferView;

/** Copies arbitrary binary input into a validated byte array. */
export function toPrinterBytes(source: ByteSource): PrinterBytes {
  if (source instanceof Uint8Array) return source;

  if (ArrayBuffer.isView(source)) {
    return new Uint8Array(
      source.buffer.slice(
        source.byteOffset,
        source.byteOffset + source.byteLength,
      ),
    );
  }

  if (source instanceof ArrayBuffer) return new Uint8Array(source);

  return Uint8Array.from(
    source.map((byte) => {
      if (!Number.isInteger(byte) || byte < 0 || byte > 255) {
        throw new RangeError(
          `Printer byte must be an integer from 0 to 255. Received: ${byte}`,
        );
      }
      return byte;
    }),
  );
}
