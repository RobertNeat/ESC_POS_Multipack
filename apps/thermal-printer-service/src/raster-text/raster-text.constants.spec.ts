import {
  MAX_RASTER_HEIGHT_DOTS,
  maxLinesForLineHeight,
} from './raster-text.constants';

describe('maxLinesForLineHeight', () => {
  it('matches the GS v 0 height cap divided by line height', () => {
    expect(maxLinesForLineHeight(22)).toBe(
      Math.floor(MAX_RASTER_HEIGHT_DOTS / 22),
    );
  });

  it('never returns less than 1, even for a huge line height', () => {
    expect(maxLinesForLineHeight(MAX_RASTER_HEIGHT_DOTS * 10)).toBe(1);
  });
});
