import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SplitButtonModule } from 'primeng/splitbutton';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { PrinterApiService } from '../../core/printer-api.service';
import { CharacterFontSize } from '../../core/printer.models';
import { editTextField } from '../../shared/text-editor';

@Component({
  imports: [FormsModule, ButtonModule, CheckboxModule, SelectModule, SplitButtonModule, TextareaModule],
  template: `
    <div class="page-head"><div><p class="eyebrow">Dokumenty</p><h1>Drukuj Markdown</h1><p class="lead">Wczytaj plik <span class="mono">.md</span> albo napisz dokument. HTML jest odrzucany; zagnieżdżenia i style są mapowane bezpośrednio na ESC/POS.</p></div><span class="badge"><i class="pi pi-shield"></i>Bez HTML · maks. 100 KB</span></div>
    <div class="workspace">
      <section class="panel panel-pad">
        <div class="document-bar">
          <div><h2 class="section-title">Treść dokumentu</h2><p class="section-subtitle">Markdown zgodny z możliwościami firmware</p></div>
          <label class="upload"><input type="file" accept=".md,.markdown,text/markdown,text/plain" (change)="loadFile($event)"><i class="pi pi-upload"></i> Wczytaj .md</label>
        </div>
        <div class="syntax-bar">
          @for (tool of tools; track tool.label) { <button type="button" (click)="applyTool(tool, markdownInput)" [title]="tool.hint"><i [class]="tool.icon"></i>{{ tool.label }}</button> }
        </div>
        <textarea #markdownInput pTextarea class="full-width mono editor" [(ngModel)]="markdown" rows="20" maxlength="100000" aria-label="Dokument Markdown" spellcheck="false"></textarea>
        <div class="editor-foot"><span [class.error-text]="hasHtml()">{{ hasHtml() ? 'Usuń znaczniki HTML przed drukiem' : 'Znaki: ' + markdown.length.toLocaleString('pl-PL') + ' / 100 000' }}</span><label>Matryca znaków <p-select [options]="fontSizeOptions" [(ngModel)]="fontSize" optionLabel="label" optionValue="value" /></label><label><p-checkbox [(ngModel)]="cut" [binary]="true" /> Odetnij dokument</label></div>
        <div class="button-row"><p-splitbutton label="Drukuj dokument" icon="pi pi-print" [model]="printOptions" [buttonProps]="{ loading: sending }" [disabled]="!markdown.trim() || sending" [buttonDisabled]="hasHtml()" (onClick)="print()" appendTo="body" /><p-button label="Wyczyść" icon="pi pi-trash" severity="secondary" [text]="true" (onClick)="markdown = ''" /></div>
      </section>
      <aside>
        <div class="paper preview"><div class="paper-meta">PODGLĄD STRUKTURY</div>@for (line of previewLines(); track $index) { <div [class]="line.className" [style.padding-left.ch]="line.indent">{{ line.text || ' ' }}</div> }</div>
        <div class="support panel panel-pad"><h3>Obsługiwane elementy</h3><div class="tags"><span># nagłówki</span><span>**pogrubienie**</span><span>_podkreślenie_</span><span>~~negatyw~~</span><span>---</span><span>listy zagnieżdżone</span><span>listy zadań</span><span>&gt; cytaty</span><span>tabele GFM</span><span>kod inline i blok</span><span>odnośniki</span><span>obrazy jako odnośniki</span></div></div>
      </aside>
    </div>
  `,
  styles: [`
    .workspace{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(340px,.8fr);gap:28px;align-items:start}.document-bar{display:flex;justify-content:space-between;gap:20px}.upload{align-self:flex-start;display:flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid var(--line);border-radius:9px;background:white;font-size:12px;font-weight:700;cursor:pointer}.upload input{display:none}.syntax-bar{display:flex;gap:5px;flex-wrap:wrap;padding:10px;background:var(--surface-2);border-radius:10px 10px 0 0}.syntax-bar button{border:0;background:transparent;padding:7px 9px;border-radius:6px;color:var(--muted);font-size:11px;font-weight:700;cursor:pointer}.syntax-bar button:hover{background:white;color:var(--ink)}.syntax-bar i{margin-right:5px}.editor{border-radius:0 0 10px 10px!important;resize:vertical;font-size:13px;line-height:1.6}.editor-foot{display:flex;justify-content:space-between;gap:20px;margin:10px 0 22px;color:var(--muted);font-size:11px}.editor-foot label{display:flex;align-items:center;gap:7px}.paper-meta{text-align:center;color:#aaa;font-size:9px;letter-spacing:.15em;border-bottom:1px dashed #ccc;padding-bottom:18px;margin-bottom:24px}.preview{min-height:480px;font-size:12px;line-height:1.55}.preview div{min-height:1.55em;white-space:pre-wrap;overflow-wrap:anywhere}.preview .h1{font-size:19px;font-weight:800;text-align:center;margin:8px 0}.preview .h2{font-size:15px;font-weight:800;margin-top:7px}.preview .list{font-weight:550}.preview .quote{border-left:2px solid #333;padding-left:10px!important;color:#555}.preview .code{background:#222;color:white;padding:2px 5px!important}.support{margin-top:18px}.support h3{margin:0 0 14px;font-size:13px}.tags{display:flex;flex-wrap:wrap;gap:6px}.tags span{padding:5px 8px;border:1px solid var(--line);border-radius:6px;color:var(--muted);font:600 10px/1.3 var(--mono)}@media(max-width:900px){.workspace{grid-template-columns:1fr}}@media(max-width:520px){.document-bar{display:block}.upload{display:inline-flex;margin-bottom:14px}.editor-foot{display:grid}}
  `]
})
export class MarkdownComponent {
  private readonly api = inject(PrinterApiService);
  protected markdown = '# Zamówienie\n\n1. **Kawa**\n   - duża\n   - bez cukru\n2. _Herbata_\n\n> Dziękujemy i zapraszamy ponownie!';
  protected cut = true; protected sending = false;
  protected fontSize: CharacterFontSize = '12x24';
  protected readonly fontSizeOptions = [{label:'9 × 17',value:'9x17'},{label:'12 × 24',value:'12x24'},{label:'9 × 24',value:'9x24'}];
  protected readonly printOptions: MenuItem[] = [{ label: 'Drukuj jako .txt', icon: 'pi pi-file', command: () => void this.printAsText() }];
  protected readonly tools = [
    {label:'H1',icon:'pi pi-hashtag',value:'\n# Nagłówek\n',hint:'Nagłówek poziomu 1'}, {label:'H2',icon:'pi pi-hashtag',value:'\n## Nagłówek\n',hint:'Nagłówek poziomu 2'}, {label:'H3',icon:'pi pi-hashtag',value:'\n### Nagłówek\n',hint:'Nagłówek poziomu 3'}, {label:'H4',icon:'pi pi-hashtag',value:'\n#### Nagłówek\n',hint:'Nagłówek poziomu 4'}, {label:'H5',icon:'pi pi-hashtag',value:'\n##### Nagłówek\n',hint:'Nagłówek poziomu 5'}, {label:'H6',icon:'pi pi-hashtag',value:'\n###### Nagłówek\n',hint:'Nagłówek poziomu 6'}, {label:'Bold',icon:'pi pi-bold',marker:'**',hint:'Pogrubienie'}, {label:'Podkr.',icon:'pi pi-italic',marker:'_',hint:'Podkreślenie'}, {label:'Negatyw',icon:'pi pi-stop',marker:'~~',hint:'Negatyw'}, {label:'Kod',icon:'pi pi-code',marker:'`',hint:'Kod inline'}, {label:'Blok kodu',icon:'pi pi-code',value:'\n```\nkod\n```\n',hint:'Blok kodu'}, {label:'Cytat',icon:'pi pi-comment',value:'\n> cytat\n',hint:'Cytat'}, {label:'---',icon:'pi pi-minus',value:'\n---\n',hint:'Linia oddzielająca'}, {label:'Lista',icon:'pi pi-list',value:'\n- element\n  - podpunkt\n',hint:'Lista punktowana'}, {label:'1. Lista',icon:'pi pi-sort-numeric-down',value:'\n1. element\n   1. podpunkt\n',hint:'Lista numerowana'}, {label:'Zadanie',icon:'pi pi-check-square',value:'\n- [ ] zadanie\n',hint:'Lista zadań'}, {label:'Tabela',icon:'pi pi-table',value:'\n| Kolumna 1 | Kolumna 2 |\n| --- | --- |\n| wartość | wartość |\n',hint:'Tabela'}, {label:'Link',icon:'pi pi-link',value:'[opis](https://)',hint:'Odnośnik'}, {label:'Obraz',icon:'pi pi-image',value:'![opis](https://)',hint:'Obraz jako odnośnik'}
  ];
  protected applyTool(tool: { marker?: string; value?: string }, input: HTMLTextAreaElement): void {
    const start = input.selectionStart ?? this.markdown.length;
    const end = tool.marker ? this.excludeTrailingSpace(start, input.selectionEnd ?? start) : input.selectionEnd ?? start;
    const selected = this.markdown.slice(start, end);
    const { replacement, selectedOffset, selectedLength } = selected
      ? this.formatSelection(tool, selected)
      : { replacement: tool.value ?? `${tool.marker ?? ''}${tool.marker ?? ''}`, selectedOffset: tool.marker?.length ?? 0, selectedLength: 0 };
    if (this.markdown.length - (end - start) + replacement.length > 100000) return;
    editTextField(input, replacement, start + selectedOffset, start + selectedOffset + selectedLength);
  }
  private formatSelection(tool: { marker?: string; value?: string }, selected: string): { replacement: string; selectedOffset: number; selectedLength: number } {
    if (tool.marker) return { replacement: `${tool.marker}${selected}${tool.marker}`, selectedOffset: tool.marker.length, selectedLength: selected.length };
    const value = tool.value ?? '';
    if (/^\n?#{1,6} /.test(value)) {
      const marker = value.match(/#{1,6} /)?.[0] ?? '';
      return { replacement: `${marker}${selected}\n`, selectedOffset: marker.length, selectedLength: selected.length };
    }
    if (value.includes('```')) return { replacement: `\n\`\`\`\n${selected}\n\`\`\`\n`, selectedOffset: 5, selectedLength: selected.length };
    if (/^\n?> /.test(value)) return this.prefixSelectedLines(selected, '> ');
    if (value.includes('- [ ]')) return this.prefixSelectedLines(selected, '- [ ] ');
    if (value.includes('1. element')) return this.prefixSelectedLines(selected, '1. ');
    if (value.includes('- element')) return this.prefixSelectedLines(selected, '- ');
    if (value.startsWith('![')) return { replacement: `![${selected}](https://)`, selectedOffset: 2, selectedLength: selected.length };
    if (value.startsWith('[')) return { replacement: `[${selected}](https://)`, selectedOffset: 1, selectedLength: selected.length };
    return { replacement: `${value}${selected}`, selectedOffset: value.length, selectedLength: selected.length };
  }
  private prefixSelectedLines(selected: string, prefix: string): { replacement: string; selectedOffset: number; selectedLength: number } {
    const replacement = selected.split('\n').map(line => `${prefix}${line}`).join('\n') + '\n';
    return { replacement, selectedOffset: prefix.length, selectedLength: replacement.length - prefix.length - 1 };
  }
  private excludeTrailingSpace(start: number, end: number): number { return end > start && this.markdown[end - 1] === ' ' && end < this.markdown.length ? end - 1 : end; }
  protected hasHtml(): boolean { return /<\/?[a-z][^>]*>/i.test(this.markdown); }
  protected previewLines(): Array<{text:string;className:string;indent:number}> {
    return this.markdown.split('\n').slice(0,38).map(raw => { const spaces=raw.match(/^\s*/)?.[0].length??0; let text=raw.trim(); let className=''; if(/^# /.test(text)){className='h1';text=text.slice(2)}else if(/^#{2,6} /.test(text)){className='h2';text=text.replace(/^#{2,6} /,'')}else if(/^> /.test(text)){className='quote';text=text.slice(2)}else if(/^([-*+] |\d+\. )/.test(text)){className='list'}else if(/^```/.test(text)){className='code'} text=text.replace(/\*\*(.*?)\*\*/g,'$1').replace(/_(.*?)_/g,'$1').replace(/~~(.*?)~~/g,'$1').replace(/`(.*?)`/g,'$1'); return {text,className,indent:Math.min(spaces,10)}; });
  }
  protected async loadFile(event: Event): Promise<void> { const input=event.target as HTMLInputElement; const file=input.files?.[0]; if(!file)return; if(file.size>100000){this.markdown='';return;} this.markdown=await file.text(); input.value=''; }
  protected async print(): Promise<void> { if(!this.markdown.trim()||this.hasHtml()||this.sending)return; this.sending=true; try{await this.api.printMarkdown(this.markdown,this.fontSize,this.cut);}finally{this.sending=false;} }
  protected async printAsText(): Promise<void> { if(!this.markdown.trim()||this.sending)return; this.sending=true; try{await this.api.printText(this.markdown,this.fontSize,this.cut);}finally{this.sending=false;} }
}
