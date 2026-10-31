export interface PackedBitmap {
  readonly bytes: Uint8Array;
  readonly widthBytes: number;
  readonly height: number;
}

/**
 * Packs a grayscale buffer (one byte per pixel, 0 = black .. 255 = white)
 * into a 1-bit-per-pixel MSB-first bitmap, width padded to a byte boundary,
 * matching the GS v 0 raster format the adapter expects.
 */
export function packGrayscaleToBits(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number,
): PackedBitmap {
  const widthBytes = Math.ceil(width / 8);
  const bytes = new Uint8Array(widthBytes * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grayscale[y * width + x] >= 128) continue;
      bytes[y * widthBytes + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  return { bytes, widthBytes, height };
}

/** Thresholds a grayscale buffer in place against a 0-255 cut point: below the cut becomes black (0), at/above becomes white (255). */
export function applyThreshold(
  grayscale: Uint8ClampedArray,
  cutPoint: number,
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(grayscale.length);
  for (let index = 0; index < grayscale.length; index++) {
    output[index] = grayscale[index] < cutPoint ? 0 : 255;
  }
  return output;
}

const FLOYD_STEINBERG_KERNEL: ReadonlyArray<
  readonly [dx: number, dy: number, weight: number]
> = [
  [1, 0, 7 / 16],
  [-1, 1, 3 / 16],
  [0, 1, 5 / 16],
  [1, 1, 1 / 16],
];

/** Floyd-Steinberg error diffusion to 1-bit, operating on a grayscale buffer. */
export function ditherFloydSteinberg(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const work = Float32Array.from(grayscale);
  const output = new Uint8ClampedArray(grayscale.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const old = work[index];
      const newValue = old < 128 ? 0 : 255;
      output[index] = newValue;
      const error = old - newValue;
      for (const [dx, dy, weight] of FLOYD_STEINBERG_KERNEL) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny >= height) continue;
        work[ny * width + nx] += error * weight;
      }
    }
  }
  return output;
}

const BAYER_4X4: ReadonlyArray<ReadonlyArray<number>> = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** 4x4 ordered (Bayer) dithering to 1-bit. */
export function ditherBayer(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(grayscale.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const threshold = (BAYER_4X4[y % 4][x % 4] + 0.5) * 16;
      output[index] = grayscale[index] < threshold ? 0 : 255;
    }
  }
  return output;
}
