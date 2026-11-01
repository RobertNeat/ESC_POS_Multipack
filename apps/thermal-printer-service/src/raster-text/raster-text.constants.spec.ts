import {
  HEADING_SIZE_LADDER_PX,
  nextHeadingSizePx,
} from './raster-text.constants';

describe('nextHeadingSizePx', () => {
  it('picks the next step strictly larger than the current size', () => {
    expect(nextHeadingSizePx(18)).toBe(20);
    expect(nextHeadingSizePx(20)).toBe(24);
  });

  it('caps at the top of the ladder', () => {
    expect(nextHeadingSizePx(64)).toBe(64);
    expect(nextHeadingSizePx(100)).toBe(64);
  });

  it('steps up from a size between two ladder rungs', () => {
    expect(nextHeadingSizePx(17)).toBe(18);
  });

  it('matches the documented ladder', () => {
    expect([...HEADING_SIZE_LADDER_PX]).toEqual([
      16, 18, 20, 24, 28, 32, 40, 48, 64,
    ]);
  });
});
