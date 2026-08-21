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
