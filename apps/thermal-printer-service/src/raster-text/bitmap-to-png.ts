import { createCanvas } from '@napi-rs/canvas';
import type { PackedBitmap } from './monochrome-packing';

/** Renders the exact packed 1-bit bitmap back to a PNG, so the preview is pixel-for-pixel what gets printed. */
export function packedBitmapToPng(
  bitmap: PackedBitmap,
  widthDots: number,
): Buffer {
  const canvas = createCanvas(widthDots, bitmap.height);
  const context = canvas.getContext('2d');
  const imageData = context.createImageData(widthDots, bitmap.height);

  for (let y = 0; y < bitmap.height; y++) {
    for (let x = 0; x < widthDots; x++) {
      const bit =
        bitmap.bytes[y * bitmap.widthBytes + (x >> 3)] & (0x80 >> (x & 7));
      const value = bit ? 0 : 255;
      const offset = (y * widthDots + x) * 4;
      imageData.data[offset] = value;
      imageData.data[offset + 1] = value;
      imageData.data[offset + 2] = value;
      imageData.data[offset + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  return canvas.toBuffer('image/png');
}
