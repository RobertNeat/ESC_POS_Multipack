import { paperWidthDots } from './paper-width.provider';
import { DEFAULT_PAPER_WIDTH_DOTS } from './raster-text.constants';

describe('paperWidthDots', () => {
  const original = process.env.PAPER_WIDTH_DOTS;

  afterEach(() => {
    if (original === undefined) delete process.env.PAPER_WIDTH_DOTS;
    else process.env.PAPER_WIDTH_DOTS = original;
  });

  it('defaults to 576 when unset', () => {
    delete process.env.PAPER_WIDTH_DOTS;
    expect(paperWidthDots()).toBe(DEFAULT_PAPER_WIDTH_DOTS);
  });

  it('reads a valid positive integer override', () => {
    process.env.PAPER_WIDTH_DOTS = '384';
    expect(paperWidthDots()).toBe(384);
  });

  it('rejects a non-integer value', () => {
    process.env.PAPER_WIDTH_DOTS = 'not-a-number';
    expect(() => paperWidthDots()).toThrow();
  });

  it('rejects zero or negative values', () => {
    process.env.PAPER_WIDTH_DOTS = '0';
    expect(() => paperWidthDots()).toThrow();
    process.env.PAPER_WIDTH_DOTS = '-10';
    expect(() => paperWidthDots()).toThrow();
  });
});
