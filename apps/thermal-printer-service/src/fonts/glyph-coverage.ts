/**
 * Characters a font must cover to be usable for Polish receipt text.
 * Diacritics per the product brief, plus digits and punctuation that
 * commonly appear on receipts (currency, decimals, dates, dashes).
 */
export const REQUIRED_COVERAGE_CHARACTERS: readonly string[] = Array.from(
  new Set('ąćęłńóśźżĄĆĘŁŃÓŚŹŻ0123456789 .,:;!?-+/%()*#"\'złPLNUSD'.split('')),
);

export interface GlyphCoverageResult {
  readonly ok: boolean;
  readonly missingCharacters: readonly string[];
}

export function evaluateGlyphCoverage(
  hasGlyphForCodePoint: (codePoint: number) => boolean,
): GlyphCoverageResult {
  const missing: string[] = [];
  for (const character of REQUIRED_COVERAGE_CHARACTERS) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) continue;
    if (!hasGlyphForCodePoint(codePoint)) missing.push(character);
  }
  return { ok: missing.length === 0, missingCharacters: missing };
}
