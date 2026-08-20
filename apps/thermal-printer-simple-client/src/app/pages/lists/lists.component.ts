import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PrinterApiService } from '../../core/printer-api.service';
import { CharacterFontSize } from '../../core/printer.models';
import { editTextField } from '../../shared/text-editor';

interface ListItem { id: number; type: 'bullet'|'number'; depth: number; text: string; checked: boolean; task: boolean; }

@Component({
  imports: [FormsModule, ButtonModule, CheckboxModule, InputTextModule, SelectModule, TextareaModule, ToggleSwitchModule],
  template: `
    <div class="page-head"><div><p class="eyebrow">Kreator</p><h1>Listy i zagnieżdżenia</h1><p class="lead">Buduj listy punktowane, numerowane i zadaniowe bez ręcznego pilnowania składni. Wynik jest wysyłany jako bezpieczny Markdown.</p></div></div>
    <div class="workspace">
      <section class="panel panel-pad">
        <div class="builder-head"><div><h2 class="section-title">Elementy listy</h2><p class="section-subtitle">{{ markdownMode ? 'Edytuj składnię Markdown bezpośrednio.' : 'Poziom określa zagnieżdżenie względem poprzedniego elementu.' }}</p></div><label class="mode"><span>Edytuj Markdown</span><p-toggleSwitch [(ngModel)]="markdownMode" (ngModelChange)="changeMode($event)" /></label></div>
        @if (!markdownMode) {
        <div class="list-table" role="table">
          <div class="table-head"><span>Typ</span><span>Poziom</span><span>Treść</span><span>Zadanie</span><span></span></div>
          @for (item of items; track item.id; let i = $index) {
            <div class="item-row" role="row">
              <p-select [options]="types" [(ngModel)]="item.type" optionLabel="label" optionValue="value" ariaLabel="Typ listy" />
              <p-select [options]="depths" [(ngModel)]="item.depth" optionLabel="label" optionValue="value" ariaLabel="Poziom zagnieżdżenia" />
              <input pInputText [(ngModel)]="item.text" maxlength="180" [attr.aria-label]="'Treść elementu ' + (i + 1)" placeholder="Treść elementu">
              <label class="task"><p-checkbox [(ngModel)]="item.task" [binary]="true" /> @if(item.task){<p-checkbox [(ngModel)]="item.checked" [binary]="true" />} </label>
              <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" ariaLabel="Usuń element" [disabled]="items.length === 1" (onClick)="remove(i)" />
            </div>
          }
        </div>
        <div class="button-row footer"><p-button label="Dodaj element" icon="pi pi-plus" severity="secondary" [outlined]="true" (onClick)="add()" /><p-button label="Dodaj podpunkt" icon="pi pi-level-down" severity="secondary" [outlined]="true" (onClick)="addNested()" /></div>
        } @else {
        <div class="syntax-bar"><button type="button" (click)="insertMarkdown('- element', listEditor)" title="Punkt listy"><i class="pi pi-list"></i>Punkt</button><button type="button" (click)="insertMarkdown('1. element', listEditor)" title="Punkt numerowany"><i class="pi pi-sort-numeric-down"></i>Numer</button><button type="button" (click)="insertMarkdown('- [ ] zadanie', listEditor)" title="Zadanie"><i class="pi pi-check-square"></i>Zadanie</button><button type="button" (click)="insertMarkdown('   - podpunkt', listEditor)" title="Podpunkt"><i class="pi pi-level-down"></i>Podpunkt</button></div>
        <textarea #listEditor pTextarea class="full-width mono editor" [(ngModel)]="markdown" rows="14" aria-label="Lista w Markdown"></textarea>
        }
        <div class="button-row footer"><p-button label="Drukuj listę" icon="pi pi-print" [loading]="sending" [disabled]="!hasContent()" (onClick)="print()" /><label>Matryca znaków <p-select [options]="fontSizeOptions" [(ngModel)]="fontSize" optionLabel="label" optionValue="value" /></label><label><p-checkbox [(ngModel)]="cut" [binary]="true" /> Odetnij papier</label></div>
      </section>
      <aside>
        <div class="paper"><div class="paper-meta">MARKDOWN DO DRUKU</div><pre>{{ listMarkdown() || 'Dodaj treść listy…' }}</pre></div>
        <div class="notice"><i class="pi pi-info-circle"></i> Firmware otrzyma listę przez endpoint Markdown. Wcięcia są zachowane, a numeracja jest wyliczana przez usługę.</div>
      </aside>
    </div>
  `,
  styles: [`
    .workspace{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(320px,.65fr);gap:28px;align-items:start}.builder-head{display:flex;justify-content:space-between;gap:20px}.mode{display:flex;align-items:center;gap:10px;font-size:12px;font-weight:700}.list-table{margin:10px -10px 22px}.table-head,.item-row{display:grid;grid-template-columns:135px 105px minmax(180px,1fr) 90px 42px;gap:9px;align-items:center;padding:8px 10px}.table-head{color:var(--muted);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid var(--line)}.item-row{border-bottom:1px solid #eeeeea}.item-row input{width:100%}.task{display:flex;align-items:center;gap:8px;min-height:38px}.syntax-bar{display:flex;gap:5px;flex-wrap:wrap;padding:10px;background:var(--surface-2);border-radius:10px 10px 0 0}.syntax-bar button{border:0;background:transparent;padding:7px 9px;border-radius:6px;color:var(--muted);font-size:11px;font-weight:700;cursor:pointer}.syntax-bar button:hover{background:white;color:var(--ink)}.syntax-bar i{margin-right:5px}.editor{border-radius:0 0 10px 10px!important;resize:vertical;font-size:13px;line-height:1.6}.footer{justify-content:flex-start;margin-top:22px}.footer>label{display:flex;align-items:center;gap:7px;margin-left:auto;font-size:12px}.paper{min-height:440px}.paper-meta{text-align:center;color:#aaa;font-size:9px;letter-spacing:.15em;border-bottom:1px dashed #ccc;padding-bottom:18px;margin-bottom:24px}.paper pre{margin:0;font:12px/1.65 var(--mono);white-space:pre-wrap}.notice{margin-top:18px}.notice i{margin-right:6px}@media(max-width:980px){.workspace{grid-template-columns:1fr}}@media(max-width:720px){.builder-head{display:block}.mode{margin-top:12px}.table-head{display:none}.item-row{grid-template-columns:1fr 1fr 42px}.item-row input{grid-column:1/-1;grid-row:1}.task{grid-column:1/3}.footer>label{width:100%;margin:6px 0 0}}
  `]
})
export class ListsComponent {
  private readonly api=inject(PrinterApiService); private nextId=4;
  protected items:ListItem[]=[{id:1,type:'number',depth:0,text:'Kawa',task:false,checked:false},{id:2,type:'bullet',depth:1,text:'duża, bez cukru',task:false,checked:false},{id:3,type:'number',depth:0,text:'Herbata',task:false,checked:false}];
  protected cut=true; protected sending=false;
  protected fontSize:CharacterFontSize='12x24';
  protected readonly fontSizeOptions=[{label:'9 × 17',value:'9x17'},{label:'12 × 24',value:'12x24'},{label:'9 × 24',value:'9x24'}];
  protected markdownMode=false; protected markdown='';
  protected readonly types=[{label:'1. Numerowana',value:'number'},{label:'• Punktowana',value:'bullet'}];
  protected readonly depths=[0,1,2,3].map(value=>({label:value===0?'Główny':`Poziom ${value}`,value}));
  protected add():void{this.items.push({id:this.nextId++,type:'bullet',depth:0,text:'',task:false,checked:false});}
  protected addNested():void{const last=this.items.at(-1);this.items.push({id:this.nextId++,type:last?.type??'bullet',depth:Math.min((last?.depth??0)+1,3),text:'',task:false,checked:false});}
  protected remove(index:number):void{this.items.splice(index,1);}
  protected hasContent():boolean{return this.listMarkdown().trim().length>0;}
  protected generatedMarkdown():string{let number=1;return this.items.filter(item=>item.text.trim()).map(item=>{if(item.depth===0&&item.type==='number'&&this.items.indexOf(item)===0)number=1;const marker=item.type==='number'?`${number++}. `:'- ';const task=item.task?`[${item.checked?'x':' '}] `:'';return `${'   '.repeat(item.depth)}${marker}${task}${item.text.trim()}`;}).join('\n');}
  protected listMarkdown():string{return this.markdownMode?this.markdown:this.generatedMarkdown();}
  protected changeMode(markdownMode:boolean):void{if(markdownMode){this.markdown=this.generatedMarkdown();return;}const parsed=this.parseMarkdown(this.markdown);if(parsed.length){this.items=parsed;this.nextId=Math.max(...parsed.map(item=>item.id))+1;}}
  protected insertMarkdown(value:string,input:HTMLTextAreaElement):void{const start=input.selectionStart??this.markdown.length;const end=input.selectionEnd??start;const selected=this.markdown.slice(start,end);const prefix=start>0&&!this.markdown.slice(0,start).endsWith('\n')?'\n':'';const marker=value.slice(0,value.indexOf(' ')+1);const replacement=selected?`${prefix}${selected.split('\n').map(line=>marker+line).join('\n')}\n`:`${prefix}${value}\n`;const selectionStart=start+prefix.length+(selected?marker.length:value.length);const selectionEnd=selected?start+replacement.length-1:selectionStart;editTextField(input,replacement,selectionStart,selectionEnd);}
  private parseMarkdown(markdown:string):ListItem[]{let id=1;return markdown.split('\n').flatMap(line=>{const match=line.match(/^(\s*)([-*+]|\d+\.)\s+(?:\[([ xX])\]\s+)?(.*)$/);if(!match)return[];return[{id:id++,type:/\d+\./.test(match[2])?'number':'bullet',depth:Math.min(Math.floor(match[1].length/3),3),text:match[4],task:match[3]!==undefined,checked:/x/i.test(match[3]??'')}];});}
  protected async print():Promise<void>{const markdown=this.listMarkdown();if(!markdown||this.sending)return;this.sending=true;try{await this.api.printMarkdown(markdown,this.fontSize,this.cut,'Lista została wysłana');}finally{this.sending=false;}}
}
