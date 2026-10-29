import {
  evaluateGlyphCoverage,
  REQUIRED_COVERAGE_CHARACTERS,
} from './glyph-coverage';

describe('evaluateGlyphCoverage', () => {
  it('reports ok when every required character has a glyph', () => {
    const result = evaluateGlyphCoverage(() => true);
    expect(result).toEqual({ ok: true, missingCharacters: [] });
  });

  it('lists every character missing a glyph, in order', () => {
    const missingCodePoints = new Set(
      ['ą', '9'].map((character) => character.codePointAt(0)),
    );
    const result = evaluateGlyphCoverage(
      (codePoint) => !missingCodePoints.has(codePoint),
    );
    expect(result.ok).toBe(false);
    expect(result.missingCharacters).toEqual(['ą', '9']);
  });

  it('covers the Polish diacritics called out in the brief', () => {
    for (const character of 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ') {
      expect(REQUIRED_COVERAGE_CHARACTERS).toContain(character);
    }
  });
});
