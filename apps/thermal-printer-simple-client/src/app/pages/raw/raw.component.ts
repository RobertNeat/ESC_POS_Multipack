import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { PrinterApiService } from '../../core/printer-api.service';
import { RawEncoding } from '../../core/printer.models';

@Component({
  imports: [FormsModule, ButtonModule, SelectModule, TextareaModule],
  template: `
    <div class="page-head"><div><p class="eyebrow">Tryb ekspercki</p><h1>Surowe komendy ESC/POS</h1><p class="lead">Wysyłaj bajty bez interpretacji. Usługa weryfikuje format i ogranicza rozmiar danych do 1 MB.</p></div><span class="badge danger"><i class="pi pi-exclamation-triangle"></i>Bezpośrednie sterowanie</span></div>
    <div class="workspace">
      <section class="panel panel-pad">
        <h2 class="section-title">Dane polecenia</h2><p class="section-subtitle">Wybierz kodowanie zgodne z przygotowanym payloadem</p>
        <div class="field encoding"><label for="encoding">Kodowanie</label><p-select inputId="encoding" [options]="encodings" [(ngModel)]="encoding" optionLabel="label" optionValue="value" (onChange)="payload = ''" /></div>
        <div class="quick"><span>Gotowe sekwencje:</span>@for(command of presets;track command.label){<button type="button" (click)="usePreset(command.hex)">{{command.label}}</button>}</div>
        <div class="field"><label for="payload">Payload</label><textarea id="payload" pTextarea class="full-width mono payload" [(ngModel)]="payload" rows="15" [placeholder]="placeholder()" spellcheck="false"></textarea><div class="payload-meta"><span [class.error-text]="validationError()">{{ validationError() || 'Format jest poprawny' }}</span><span>{{ byteCount() }} B / 1 MB</span></div></div>
        <div class="notice warning"><i class="pi pi-exclamation-triangle"></i><strong>Uwaga:</strong> błędna sekwencja może zmienić trwałe ustawienia drukarki. Dane są wysyłane dokładnie w podanej postaci.</div>
        <div class="button-row send"><p-button label="Wyślij komendy" icon="pi pi-send" severity="danger" [loading]="sending" [disabled]="!!validationError() || !payload.trim()" (onClick)="send()" /><p-button label="Wyczyść" severity="secondary" [text]="true" (onClick)="payload = ''" /></div>
      </section>
      <aside class="panel panel-pad reference"><h2 class="section-title">Ściąga ESC/POS</h2><p class="section-subtitle">Najczęstsze instrukcje POS-8370</p>@for(row of reference;track row.hex){<button type="button" (click)="usePreset(row.hex)"><code>{{row.hex}}</code><span><strong>{{row.name}}</strong><small>{{row.description}}</small></span><i class="pi pi-arrow-left"></i></button>}</aside>
    </div>
  `,
  styles: [`
    .workspace{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:28px;align-items:start}.danger{background:#fceae7;color:#a74335}.encoding{max-width:250px}.quick{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin:18px 0 12px;color:var(--muted);font-size:11px}.quick button{border:1px solid var(--line);border-radius:6px;background:white;padding:5px 8px;color:var(--ink);font:600 10px var(--mono);cursor:pointer}.payload{resize:vertical;line-height:1.75;font-size:13px}.payload-meta{display:flex;justify-content:space-between;color:var(--muted);font-size:10px}.warning{margin-top:18px;border-color:#bd4a3a;background:#fff0ec}.warning i{margin-right:7px}.send{margin-top:20px}.reference button{width:100%;display:grid;grid-template-columns:92px 1fr auto;gap:12px;align-items:center;padding:14px 0;border:0;border-top:1px solid var(--line);background:transparent;text-align:left;cursor:pointer}.reference code{color:var(--accent);font-size:11px}.reference strong,.reference small{display:block}.reference strong{font-size:12px}.reference small{margin-top:3px;color:var(--muted);font-size:10px;line-height:1.4}.reference>button>i{font-size:10px;color:var(--muted)}@media(max-width:880px){.workspace{grid-template-columns:1fr}}@media(max-width:500px){.reference button{grid-template-columns:1fr auto}.reference code{grid-column:1/-1}}
  `]
})
export class RawComponent {
  private readonly api=inject(PrinterApiService);
  protected encoding:RawEncoding='hex';protected payload='1b 40';protected sending=false;
  protected readonly encodings=[{label:'HEX — bajty szesnastkowe',value:'hex'},{label:'Base64',value:'base64'},{label:'Bajty dziesiętne',value:'bytes'}];
  protected readonly presets=[{label:'Inicjalizacja',hex:'1b 40'},{label:'LF',hex:'0a'},{label:'Cięcie',hex:'1d 56 42 10'}];
  protected readonly reference=[{hex:'1B 40',name:'Initialize',description:'Resetuje bieżący tryb drukowania'},{hex:'1B 45 01',name:'Emphasized ON',description:'Włącza druk pogrubiony'},{hex:'1B 61 01',name:'Center',description:'Wyrównuje tekst do środka'},{hex:'1D 56 42 10',name:'Partial cut',description:'Podaje papier i uruchamia nóż'},{hex:'1B 70 00 40 50',name:'Drawer pulse',description:'Impuls szuflady kasowej'}];
  protected placeholder():string{return this.encoding==='hex'?'np. 1b 40 48 65 6c 6c 6f 0a':this.encoding==='base64'?'np. G0BIZWxsbwo=':'np. 27, 64, 10';}
  protected validationError():string|null{const value=this.payload.trim();if(!value)return null;if(this.encoding==='hex'){const compact=value.replace(/[\s,:-]+/g,'');if(!/^[0-9a-f]+$/i.test(compact))return'HEX zawiera niedozwolone znaki';if(compact.length%2)return'Każdy bajt HEX musi mieć dwie cyfry';}else if(this.encoding==='base64'){const compact=value.replace(/\s+/g,'');if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(compact))return'Niepoprawny Base64';}else{const parts=value.split(/[\s,]+/).filter(Boolean);if(parts.some(v=>!/^\d+$/.test(v)||Number(v)>255))return'Bajty muszą być liczbami 0–255';}return null;}
  protected byteCount():number{const value=this.payload.trim();if(!value||this.validationError())return 0;if(this.encoding==='hex')return value.replace(/[\s,:-]+/g,'').length/2;if(this.encoding==='base64')return Math.floor(value.replace(/\s+/g,'').length*3/4);return value.split(/[\s,]+/).filter(Boolean).length;}
  protected usePreset(hex:string):void{this.encoding='hex';this.payload=hex.toLowerCase();}
  protected async send():Promise<void>{if(this.validationError()||!this.payload.trim()||this.sending)return;this.sending=true;try{const data=this.encoding==='bytes'?this.payload.split(/[\s,]+/).filter(Boolean).map(Number):this.payload;await this.api.printRaw(this.encoding,data);}finally{this.sending=false;}}
}
