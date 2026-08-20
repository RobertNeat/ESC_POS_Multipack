import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PrinterApiService } from '../../core/printer-api.service';
import { Alignment, TextStyle } from '../../core/printer.models';

@Component({
  imports: [FormsModule, ButtonModule, CheckboxModule, InputTextModule, SelectModule, ToggleSwitchModule],
  template: `
    <div class="page-head"><div><p class="eyebrow">Tryb natychmiastowy</p><h1>Maszyna do pisania</h1><p class="lead">Każde zatwierdzenie drukuje dokładnie jedną linię. Pole zatrzymuje wpisywanie po osiągnięciu fizycznej szerokości papieru.</p></div><span class="badge"><i class="pi pi-arrows-h"></i>{{ paperWidth }} mm · {{ maxChars() }} zn.</span></div>
    <div class="workspace">
      <section class="panel panel-pad editor">
        <div class="editor-head"><div><h2 class="section-title">Nowa linia</h2><p class="section-subtitle">Enter wysyła linię do drukarki</p></div><label class="mode"><span>Markdown inline</span><p-toggleSwitch [(ngModel)]="markdownMode" /></label></div>
        @if (markdownMode) {
          <div class="toolbar" aria-label="Formatowanie Markdown">
            <p-button label="Pogrubienie" icon="pi pi-bold" size="small" severity="secondary" [outlined]="true" (onClick)="wrap('**')" />
            <p-button label="Podkreślenie" icon="pi pi-italic" size="small" severity="secondary" [outlined]="true" (onClick)="wrap('_')" />
            <p-button label="Negatyw" icon="pi pi-stop" size="small" severity="secondary" [outlined]="true" (onClick)="wrap('~~')" />
            <p-button label="Kod" icon="pi pi-code" size="small" severity="secondary" [outlined]="true" (onClick)="wrapCode()" />
          </div>
        }
        <div class="type-line" [class.limit]="line.length >= maxChars()">
          <span>&gt;</span><input #lineInput pInputText class="mono" [(ngModel)]="line" [maxlength]="maxChars()" placeholder="Wpisz tekst do wydrukowania…" aria-label="Treść linii" (keyup.enter)="send()"><b>{{ line.length }}/{{ maxChars() }}</b>
        </div>
        <div class="progress"><span [style.width.%]="line.length / maxChars() * 100"></span></div>
        <div class="notice"><i class="pi pi-info-circle"></i> Limit uwzględnia papier, font i podwójną szerokość. W trybie Markdown znaczniki również zajmują miejsce w polu, więc limit jest celowo bezpieczny.</div>
        <div class="options">
          <div class="field"><label for="paper">Papier</label><p-select inputId="paper" [options]="paperOptions" [(ngModel)]="paperWidth" optionLabel="label" optionValue="value" /></div>
          @if (!markdownMode) {
            <div class="field"><label for="font">Font</label><p-select inputId="font" [options]="fontOptions" [(ngModel)]="style.font" optionLabel="label" optionValue="value" /></div>
            <div class="field"><label for="width">Szerokość znaku</label><p-select inputId="width" [options]="scaleOptions" [(ngModel)]="style.width" optionLabel="label" optionValue="value" /></div>
            <div class="field"><label for="alignment">Wyrównanie</label><p-select inputId="alignment" [options]="alignmentOptions" [(ngModel)]="alignment" optionLabel="label" optionValue="value" /></div>
          }
        </div>
        @if (!markdownMode) {
          <div class="checks"><label><p-checkbox [(ngModel)]="style.emphasized" [binary]="true" /> Pogrubienie</label><label><p-checkbox [(ngModel)]="style.underline" [binary]="true" [trueValue]="1" [falseValue]="0" /> Podkreślenie</label><label><p-checkbox [(ngModel)]="style.reverse" [binary]="true" /> Negatyw</label><label><p-checkbox [(ngModel)]="cut" [binary]="true" /> Odetnij po linii</label></div>
        }
        <div class="button-row send-row"><p-button label="Drukuj linię" icon="pi pi-send" [loading]="sending" [disabled]="!line.trim()" (onClick)="send()" /><span class="field-help">Skrót: Enter</span></div>
      </section>
      <aside>
        <div class="paper"><div class="paper-meta">PODGLĄD · {{ paperWidth }} MM</div><div class="preview-line" [style.text-align]="markdownMode ? 'left' : alignment" [class.bold]="!markdownMode && style.emphasized" [class.underline]="!markdownMode && style.underline" [class.reverse]="!markdownMode && style.reverse" [style.font-size.em]="!markdownMode ? style.width : 1">{{ previewText() || 'Twoja linia pojawi się tutaj' }}</div>@for (item of history; track $index) { <div class="history-line">{{ item }}</div> }</div>
      </aside>
    </div>
  `,
  styles: [`
    .workspace{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(340px,.75fr);gap:28px;align-items:start}.editor-head{display:flex;justify-content:space-between;gap:20px}.mode{display:flex;align-items:center;gap:10px;font-size:12px;font-weight:700}.toolbar{padding:14px 0;border-top:1px solid var(--line)}.type-line{margin-top:18px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:5px 14px;border:1px solid #aaa99f;border-radius:10px;background:#fff}.type-line:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px rgba(220,91,56,.11)}.type-line.limit{border-color:#bf5948}.type-line>span{color:var(--accent);font-family:var(--mono)}.type-line input{border:0!important;box-shadow:none!important;padding:13px 0;width:100%;font-size:15px}.type-line b{font:600 10px/1 var(--mono);color:var(--muted)}.progress{height:3px;margin:0 8px 18px;background:#eee}.progress span{display:block;height:100%;background:var(--accent);transition:width .1s}.notice i{margin-right:7px}.options{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px}.checks{display:flex;flex-wrap:wrap;gap:18px;margin:20px 0;font-size:12px}.checks label{display:flex;align-items:center;gap:7px}.send-row{margin-top:22px}.paper-meta{text-align:center;color:#aaa;font-size:9px;letter-spacing:.15em;border-bottom:1px dashed #ccc;padding-bottom:18px;margin-bottom:26px}.preview-line{min-height:26px;overflow-wrap:anywhere}.preview-line.bold{font-weight:800}.preview-line.underline{text-decoration:underline}.preview-line.reverse{background:#24231f;color:white;padding:3px}.history-line{margin-top:8px;color:#aaa;font-size:12px;border-top:1px dotted #ddd;padding-top:8px}.paper{min-height:500px}@media(max-width:900px){.workspace{grid-template-columns:1fr}.options{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){.options{grid-template-columns:1fr}.editor-head{display:block}.mode{margin-bottom:14px}}
  `]
})
export class TypewriterComponent {
  private readonly api = inject(PrinterApiService);
  protected line = ''; protected markdownMode = true; protected paperWidth = 80; protected alignment: Alignment = 'left'; protected cut = false; protected sending = false; protected history: string[] = [];
  protected style: TextStyle = { font: 'A', emphasized: false, underline: 0, width: 1, height: 1, reverse: false };
  protected readonly paperOptions = [{label:'58 mm',value:58},{label:'80 mm',value:80}];
  protected readonly fontOptions = [{label:'Font A',value:'A'},{label:'Font B',value:'B'}];
  protected readonly scaleOptions = [1,2,3,4].map(value=>({label:`×${value}`,value}));
  protected readonly alignmentOptions = [{label:'Do lewej',value:'left'},{label:'Wyśrodkuj',value:'center'},{label:'Do prawej',value:'right'}];
  protected maxChars(): number { return Math.floor((this.paperWidth === 80 ? (this.style.font === 'A' ? 48 : 64) : (this.style.font === 'A' ? 32 : 42)) / (this.markdownMode ? 1 : this.style.width)); }
  protected previewText(): string { return this.markdownMode ? this.line.replace(/\*\*|__|~~|`|_/g, '') : this.line; }
  protected wrap(marker: string): void { const clean = this.line.slice(0, Math.max(0, this.maxChars() - marker.length * 2)); this.line = `${marker}${clean}${marker}`.slice(0, this.maxChars()); }
  protected wrapCode(): void { this.wrap(String.fromCharCode(96)); }
  protected async send(): Promise<void> {
    const value = this.line.trim(); if (!value || this.sending) return; this.sending = true;
    try { if (this.markdownMode) await this.api.printMarkdown(value, this.cut, 'Linia Markdown została wysłana'); else await this.api.printLine(value, this.alignment, this.style, this.cut); this.history = [this.previewText(), ...this.history].slice(0, 5); this.line = ''; } finally { this.sending = false; }
  }
}
