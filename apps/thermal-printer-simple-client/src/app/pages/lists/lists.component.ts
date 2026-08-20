import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { PrinterApiService } from '../../core/printer-api.service';

interface ListItem { id: number; type: 'bullet'|'number'; depth: number; text: string; checked: boolean; task: boolean; }

@Component({
  imports: [FormsModule, ButtonModule, CheckboxModule, InputTextModule, SelectModule],
  template: `
    <div class="page-head"><div><p class="eyebrow">Kreator</p><h1>Listy i zagnieżdżenia</h1><p class="lead">Buduj listy punktowane, numerowane i zadaniowe bez ręcznego pilnowania składni. Wynik jest wysyłany jako bezpieczny Markdown.</p></div></div>
    <div class="workspace">
      <section class="panel panel-pad">
        <div class="builder-head"><div><h2 class="section-title">Elementy listy</h2><p class="section-subtitle">Poziom określa zagnieżdżenie względem poprzedniego elementu</p></div><p-button label="Dodaj element" icon="pi pi-plus" size="small" (onClick)="add()" /></div>
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
        <div class="button-row footer"><p-button label="Drukuj listę" icon="pi pi-print" [loading]="sending" [disabled]="!hasContent()" (onClick)="print()" /><p-button label="Dodaj podpunkt" icon="pi pi-level-down" severity="secondary" [outlined]="true" (onClick)="addNested()" /><label><p-checkbox [(ngModel)]="cut" [binary]="true" /> Odetnij papier</label></div>
      </section>
      <aside>
        <div class="paper"><div class="paper-meta">MARKDOWN DO DRUKU</div><pre>{{ generatedMarkdown() || 'Dodaj treść listy…' }}</pre></div>
        <div class="notice"><i class="pi pi-info-circle"></i> Firmware otrzyma listę przez endpoint Markdown. Wcięcia są zachowane, a numeracja jest wyliczana przez usługę.</div>
      </aside>
    </div>
  `,
  styles: [`
    .workspace{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(320px,.65fr);gap:28px;align-items:start}.builder-head{display:flex;justify-content:space-between;gap:20px}.list-table{margin:10px -10px 22px}.table-head,.item-row{display:grid;grid-template-columns:135px 105px minmax(180px,1fr) 90px 42px;gap:9px;align-items:center;padding:8px 10px}.table-head{color:var(--muted);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid var(--line)}.item-row{border-bottom:1px solid #eeeeea}.item-row input{width:100%}.task{display:flex;align-items:center;gap:8px;min-height:38px}.footer{justify-content:flex-start}.footer>label{display:flex;align-items:center;gap:7px;margin-left:auto;font-size:12px}.paper{min-height:440px}.paper-meta{text-align:center;color:#aaa;font-size:9px;letter-spacing:.15em;border-bottom:1px dashed #ccc;padding-bottom:18px;margin-bottom:24px}.paper pre{margin:0;font:12px/1.65 var(--mono);white-space:pre-wrap}.notice{margin-top:18px}.notice i{margin-right:6px}@media(max-width:980px){.workspace{grid-template-columns:1fr}}@media(max-width:720px){.table-head{display:none}.item-row{grid-template-columns:1fr 1fr 42px}.item-row input{grid-column:1/-1;grid-row:1}.task{grid-column:1/3}.footer>label{width:100%;margin:6px 0 0}}
  `]
})
export class ListsComponent {
  private readonly api=inject(PrinterApiService); private nextId=4;
  protected items:ListItem[]=[{id:1,type:'number',depth:0,text:'Kawa',task:false,checked:false},{id:2,type:'bullet',depth:1,text:'duża, bez cukru',task:false,checked:false},{id:3,type:'number',depth:0,text:'Herbata',task:false,checked:false}];
  protected cut=true; protected sending=false;
  protected readonly types=[{label:'1. Numerowana',value:'number'},{label:'• Punktowana',value:'bullet'}];
  protected readonly depths=[0,1,2,3].map(value=>({label:value===0?'Główny':`Poziom ${value}`,value}));
  protected add():void{this.items.push({id:this.nextId++,type:'bullet',depth:0,text:'',task:false,checked:false});}
  protected addNested():void{const last=this.items.at(-1);this.items.push({id:this.nextId++,type:last?.type??'bullet',depth:Math.min((last?.depth??0)+1,3),text:'',task:false,checked:false});}
  protected remove(index:number):void{this.items.splice(index,1);}
  protected hasContent():boolean{return this.items.some(item=>item.text.trim());}
  protected generatedMarkdown():string{let number=1;return this.items.filter(item=>item.text.trim()).map(item=>{if(item.depth===0&&item.type==='number'&&this.items.indexOf(item)===0)number=1;const marker=item.type==='number'?`${number++}. `:'- ';const task=item.task?`[${item.checked?'x':' '}] `:'';return `${'   '.repeat(item.depth)}${marker}${task}${item.text.trim()}`;}).join('\n');}
  protected async print():Promise<void>{const markdown=this.generatedMarkdown();if(!markdown||this.sending)return;this.sending=true;try{await this.api.printMarkdown(markdown,this.cut,'Lista została wysłana');}finally{this.sending=false;}}
}
