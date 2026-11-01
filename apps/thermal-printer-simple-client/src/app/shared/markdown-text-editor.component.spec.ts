import { TestBed } from '@angular/core/testing';
import { MarkdownTextEditorComponent } from './markdown-text-editor.component';

describe('MarkdownTextEditorComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MarkdownTextEditorComponent],
    }).compileComponents();
  });

  it('keeps the editor selection when a toolbar button is pressed', async () => {
    const fixture = await createEditor('Ala ma kota', ['bold']);
    const host = fixture.nativeElement as HTMLElement;
    const editor = host.querySelector('textarea');
    const button = host.querySelector('button');
    editor.setSelectionRange(7, 11);

    expect([editor.selectionStart, editor.selectionEnd]).toEqual([7, 11]);

    const mouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    button.dispatchEvent(mouseDown);

    expect(mouseDown.defaultPrevented).toBe(true);
  });

  it('applies and removes inline formatting through the toolbar', async () => {
    const fixture = await createEditor('Ala ma kota', ['bold']);
    const host = fixture.nativeElement as HTMLElement;
    const editor = host.querySelector('textarea');
    const button = host.querySelector('button');
    editor.setSelectionRange(7, 11);

    pressToolbarButton(button);
    editor.setSelectionRange(11, 11);
    button.click();
    await fixture.whenStable();

    expect(editor.value).toBe('Ala ma **kota**');
    expect([editor.selectionStart, editor.selectionEnd]).toEqual([9, 13]);

    pressToolbarButton(button);
    button.click();
    await fixture.whenStable();

    expect(editor.value).toBe('Ala ma kota');
    expect([editor.selectionStart, editor.selectionEnd]).toEqual([7, 11]);
  });

  it('leaves surrounding spaces outside formatting in the single-line editor', async () => {
    const fixture = await createEditor('Ala ma kota i psa', ['underline'], false);
    const host = fixture.nativeElement as HTMLElement;
    const editor = host.querySelector('input');
    const button = host.querySelector('button');
    editor.setSelectionRange(6, 12);

    pressToolbarButton(button);
    button.click();
    await fixture.whenStable();

    expect(editor.value).toBe('Ala ma _kota_ i psa');
    expect([editor.selectionStart, editor.selectionEnd]).toEqual([8, 12]);
  });

  it('formats tables and prevents default on Ctrl+S when the table tool is enabled', async () => {
    const fixture = await createEditor('|a|b|\n|-|-|\n|1|two|', ['table']);
    const host = fixture.nativeElement as HTMLElement;
    const editor = host.querySelector('textarea');
    editor.setSelectionRange(0, 0);

    const keydown = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    editor.dispatchEvent(keydown);
    await fixture.whenStable();

    expect(keydown.defaultPrevented).toBe(true);
    expect(editor.value).toBe('| a | b   |\n| --- | --- |\n| 1 | two |');
  });

  it('does not treat AltGr+S (reported as Ctrl+Alt+S) as the format shortcut', async () => {
    const original = '|a|b|\n|-|-|\n|1|two|';
    const fixture = await createEditor(original, ['table']);
    const host = fixture.nativeElement as HTMLElement;
    const editor = host.querySelector('textarea');

    const keydown = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      altKey: true,
      bubbles: true,
      cancelable: true,
    });
    editor.dispatchEvent(keydown);
    await fixture.whenStable();

    expect(keydown.defaultPrevented).toBe(false);
    expect(editor.value).toBe(original);
  });

  it('hides the table-format FAB when the table tool is not enabled', async () => {
    const fixture = await createEditor('plain text', ['bold']);
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.table-format-fab')).toBeNull();
  });

  it('disables the table-format FAB when the text has no table to format', async () => {
    const fixture = await createEditor('plain text', ['table']);
    const host = fixture.nativeElement as HTMLElement;
    const fab = host.querySelector<HTMLButtonElement>('.table-format-fab');
    expect(fab).not.toBeNull();
    expect(fab?.disabled).toBe(true);
  });

  it('enables the table-format FAB when the text has a table and formats it on click', async () => {
    const fixture = await createEditor('|a|b|\n|-|-|\n|1|two|', ['table']);
    const host = fixture.nativeElement as HTMLElement;
    const editor = host.querySelector('textarea');
    const fab = host.querySelector<HTMLButtonElement>('.table-format-fab');
    expect(fab?.disabled).toBe(false);

    fab?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    fab?.click();
    await fixture.whenStable();

    expect(editor.value).toBe('| a | b   |\n| --- | --- |\n| 1 | two |');
  });
});

async function createEditor(
  value: string,
  enabledTools: MarkdownTextEditorComponent['enabledTools'],
  multiline = true,
) {
  const fixture = TestBed.createComponent(MarkdownTextEditorComponent);
  fixture.componentInstance.value = value;
  fixture.componentInstance.enabledTools = enabledTools;
  fixture.componentInstance.multiline = multiline;
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

function pressToolbarButton(button: HTMLButtonElement): void {
  button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
}
