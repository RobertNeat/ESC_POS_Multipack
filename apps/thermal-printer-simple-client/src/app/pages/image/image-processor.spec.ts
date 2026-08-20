import { packMonochrome, rasterizeMonochrome } from './image-processor';

describe('image processor', () => {
  it('packs black pixels MSB-first and pads each row to complete bytes', () => {
    const pixels = new Uint8ClampedArray(9 * 2 * 4).fill(255);
    for (const pixel of [0, 8, 10]) {
      pixels[pixel * 4] = 0;
      pixels[pixel * 4 + 1] = 0;
      pixels[pixel * 4 + 2] = 0;
    }

    const result = packMonochrome(pixels, 9, 2);

    expect(Array.from(result.bytes)).toEqual([0x80, 0x80, 0x40, 0x00]);
    expect(result.widthBytes).toBe(2);
    expect(result.blackRatio).toBeCloseTo(3 / 18);
  });

  it('quantizes an RGBA image to a one-bit black and white raster', () => {
    const source = {
      width: 2,
      height: 1,
      data: Uint8ClampedArray.from([0, 0, 0, 255, 255, 255, 255, 255]),
    } as ImageData;

    const result = rasterizeMonochrome(
      source,
      {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        gamma: 1,
        hue: 0,
        threshold: 128,
        invert: false,
      },
      'none',
    );

    expect(Array.from(result.bytes)).toEqual([0x80]);
    expect(new Set(Array.from(result.pixels))).toEqual(new Set([0, 255]));
  });
});
