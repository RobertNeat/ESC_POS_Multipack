/** Replaces the active selection without breaking the browser's native undo stack. */
export function editTextField(
  input: HTMLInputElement | HTMLTextAreaElement,
  replacement: string,
  selectionStart: number,
  selectionEnd: number,
): void {
  input.focus();
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? start;

  // execCommand is intentionally used here: unlike assigning ngModel/value, it adds
  // toolbar edits to the same native history as typing, paste and cut.
  const inserted = input.ownerDocument.execCommand?.('insertText', false, replacement) ?? false;
  if (!inserted) {
    input.setRangeText(replacement, start, end, 'end');
    input.dispatchEvent(
      new InputEvent('input', { bubbles: true, inputType: 'insertText', data: replacement }),
    );
  }

  input.setSelectionRange(selectionStart, selectionEnd);
}

export interface TextMarkerEdit {
  readonly replacement: string;
  readonly replacementStart: number;
  readonly replacementEnd: number;
  readonly selectionStart: number;
  readonly selectionEnd: number;
}

/** Adds a marker or removes it when it directly encloses the selection. */
export function toggleTextMarker(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  marker: string,
): TextMarkerEdit {
  while (selectionStart < selectionEnd && isWhitespace(text[selectionStart])) {
    selectionStart += 1;
  }
  while (selectionEnd > selectionStart && isWhitespace(text[selectionEnd - 1])) {
    selectionEnd -= 1;
  }

  const selected = text.slice(selectionStart, selectionEnd);
  const markerLength = marker.length;

  if (
    selected.length >= markerLength * 2 &&
    selected.startsWith(marker) &&
    selected.endsWith(marker)
  ) {
    const replacement = selected.slice(markerLength, -markerLength);
    return {
      replacement,
      replacementStart: selectionStart,
      replacementEnd: selectionEnd,
      selectionStart,
      selectionEnd: selectionStart + replacement.length,
    };
  }

  const directlyWrapped =
    selectionStart >= markerLength &&
    text.slice(selectionStart - markerLength, selectionStart) === marker &&
    text.slice(selectionEnd, selectionEnd + markerLength) === marker;
  if (directlyWrapped) {
    const replacementStart = selectionStart - markerLength;
    return {
      replacement: selected,
      replacementStart,
      replacementEnd: selectionEnd + markerLength,
      selectionStart: replacementStart,
      selectionEnd: replacementStart + selected.length,
    };
  }

  return {
    replacement: `${marker}${selected}${marker}`,
    replacementStart: selectionStart,
    replacementEnd: selectionEnd,
    selectionStart: selectionStart + markerLength,
    selectionEnd: selectionEnd + markerLength,
  };
}

function isWhitespace(value: string | undefined): boolean {
  return value !== undefined && /\s/u.test(value);
}
