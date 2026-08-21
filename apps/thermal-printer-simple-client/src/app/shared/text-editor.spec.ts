import { toggleTextMarker } from './text-editor';

describe('toggleTextMarker', () => {
  it('wraps an unformatted selection', () => {
    expect(toggleTextMarker('Ala ma kota', 7, 11, '**')).toEqual({
      replacement: '**kota**',
      replacementStart: 7,
      replacementEnd: 11,
      selectionStart: 9,
      selectionEnd: 13,
    });
  });

  it('keeps surrounding whitespace outside the marker', () => {
    expect(toggleTextMarker('Ala ma tekst ', 6, 13, '_')).toEqual({
      replacement: '_tekst_',
      replacementStart: 7,
      replacementEnd: 12,
      selectionStart: 8,
      selectionEnd: 13,
    });
  });

  it('removes a marker when the selected phrase includes surrounding whitespace', () => {
    expect(toggleTextMarker('Ala ma _tekst_ ', 6, 15, '_')).toEqual({
      replacement: 'tekst',
      replacementStart: 7,
      replacementEnd: 14,
      selectionStart: 7,
      selectionEnd: 12,
    });
  });

  it('removes markers directly outside the selection', () => {
    expect(toggleTextMarker('Ala ma **kota**', 9, 13, '**')).toEqual({
      replacement: 'kota',
      replacementStart: 7,
      replacementEnd: 15,
      selectionStart: 7,
      selectionEnd: 11,
    });
  });

  it('removes markers included in the selection', () => {
    expect(toggleTextMarker('Ala ma ~~kota~~', 7, 15, '~~')).toEqual({
      replacement: 'kota',
      replacementStart: 7,
      replacementEnd: 15,
      selectionStart: 7,
      selectionEnd: 11,
    });
  });

  it('only toggles the requested marker in nested formatting', () => {
    expect(toggleTextMarker('**_tekst_**', 3, 8, '_')).toEqual({
      replacement: 'tekst',
      replacementStart: 2,
      replacementEnd: 9,
      selectionStart: 2,
      selectionEnd: 7,
    });
  });

  it('inserts an empty marker pair and leaves the caret between it', () => {
    expect(toggleTextMarker('tekst', 5, 5, '`')).toEqual({
      replacement: '``',
      replacementStart: 5,
      replacementEnd: 5,
      selectionStart: 6,
      selectionEnd: 6,
    });
  });
});
