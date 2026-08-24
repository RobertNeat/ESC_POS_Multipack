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
