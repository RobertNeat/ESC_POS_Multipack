import {
  applyThreshold,
  ditherBayer,
  ditherFloydSteinberg,
  packGrayscaleToBits,
} from './monochrome-packing';

describe('packGrayscaleToBits', () => {
  it('packs MSB-first, 1 = black, and pads width to a byte boundary', () => {
    // 3px wide -> 1 byte per row, regardless of the 3 real pixels.
    const grayscale = Uint8ClampedArray.from([0, 255, 0]);
    const result = packGrayscaleToBits(grayscale, 3, 1);
    expect(result.widthBytes).toBe(1);
    expect(result.height).toBe(1);
    // bit0 (MSB) = black, bit1 = white, bit2 = black -> 1011 1111? check exact bits.
    // x=0 black -> 0x80, x=1 white -> 0, x=2 black -> 0x20
    expect(result.bytes[0]).toBe(0x80 | 0x20);
  });

  it('pads an 9px wide row to 2 bytes', () => {
    const grayscale = new Uint8ClampedArray(9).fill(0);
    const result = packGrayscaleToBits(grayscale, 9, 1);
    expect(result.widthBytes).toBe(2);
    expect(result.bytes.length).toBe(2);
  });

  it('treats exactly 128 as white (not black)', () => {
    const grayscale = Uint8ClampedArray.from([128]);
    const result = packGrayscaleToBits(grayscale, 1, 1);
    expect(result.bytes[0]).toBe(0);
  });
});

describe('applyThreshold', () => {
  it('maps below the cut point to black and at/above to white', () => {
    const grayscale = Uint8ClampedArray.from([0, 100, 127, 128, 200, 255]);
    const result = applyThreshold(grayscale, 128);
    expect([...result]).toEqual([0, 0, 0, 255, 255, 255]);
  });
});

describe('ditherFloydSteinberg', () => {
  it('produces only pure black/white output', () => {
    const width = 10;
    const height = 10;
    const grayscale = new Uint8ClampedArray(width * height);
    for (let i = 0; i < grayscale.length; i++) grayscale[i] = (i * 37) % 256;
    const result = ditherFloydSteinberg(grayscale, width, height);
    for (const value of result) expect(value === 0 || value === 255).toBe(true);
  });

  it('renders a uniform mid-gray field as a mix of black and white, not solid', () => {
    const width = 20;
    const height = 20;
    const grayscale = new Uint8ClampedArray(width * height).fill(128);
    const result = ditherFloydSteinberg(grayscale, width, height);
    const blackCount = [...result].filter((v) => v === 0).length;
    expect(blackCount).toBeGreaterThan(0);
    expect(blackCount).toBeLessThan(result.length);
  });
});

describe('ditherBayer', () => {
  it('produces only pure black/white output', () => {
    const width = 8;
    const height = 8;
    const grayscale = new Uint8ClampedArray(width * height);
    for (let i = 0; i < grayscale.length; i++) grayscale[i] = (i * 29) % 256;
    const result = ditherBayer(grayscale, width, height);
    for (const value of result) expect(value === 0 || value === 255).toBe(true);
  });

  it('is deterministic for the same input', () => {
    const width = 8;
    const height = 8;
    const grayscale = new Uint8ClampedArray(width * height).fill(100);
    const first = ditherBayer(grayscale, width, height);
    const second = ditherBayer(grayscale, width, height);
    expect([...first]).toEqual([...second]);
  });
});
