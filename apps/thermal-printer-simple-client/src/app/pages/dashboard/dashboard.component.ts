import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PrinterApiService } from '../../core/printer-api.service';

@Component({
  imports: [FormsModule, RouterLink, ButtonModule, InputTextModule],
  template: `
    <section class="hero">
      <div>
        <p class="eyebrow">Centrum drukowania</p>
        <h1>Od tekstu do papieru,<br><span>w jednej chwili.</span></h1>
        <p class="lead">Pisz pojedyncze linie, składaj dokumenty Markdown i steruj drukarką POS-8370 z jednego, bezpiecznego miejsca.</p>
        <div class="button-row hero-actions">
          <p-button label="Napisz pierwszą linię" icon="pi pi-pencil" routerLink="/linia" />
          <p-button label="Otwórz dokument" icon="pi pi-file-edit" severity="secondary" [outlined]="true" routerLink="/markdown" />
        </div>
      </div>
      <div class="printer-visual" aria-label="Schemat drukarki termicznej">
        <div class="receipt"><span>THERMAL CONSOLE</span><b>GOTOWA DO PRACY</b><i></i><small>{{ api.model() }}</small></div>
        <div class="printer"><div class="slot"></div><i class="pi pi-power-off"></i></div>
      </div>
    </section>

    <section class="status-grid">
      <article class="panel connection panel-pad">
        <div class="card-icon"><i class="pi pi-link"></i></div>
        <div><p class="eyebrow">Usługa</p><h2 class="section-title">Połączenie z API</h2><p class="section-subtitle">Adres serwera thermal-printer-service</p></div>
        <div class="endpoint-row">
          <input pInputText class="full-width mono" [(ngModel)]="endpoint" aria-label="Adres API" (keyup.enter)="connect()">
          <p-button label="Połącz" icon="pi pi-refresh" [loading]="api.connectionState() === 'checking'" (onClick)="connect()" />
        </div>
        <div class="connection-result" [class.ok]="api.connectionState() === 'online'">
          <span></span><strong>{{ api.connectionState() === 'online' ? 'Połączono' : 'Niepołączono' }}</strong>
          <small>{{ api.status()?.paperOut ? 'Brak papieru' : api.status()?.coverOpen ? 'Pokrywa otwarta' : api.connectionState() === 'online' ? 'Urządzenie odpowiada poprawnie' : 'Sprawdź usługę i adres' }}</small>
        </div>
      </article>

      <article class="panel panel-pad capabilities">
        <div class="card-icon"><i class="pi pi-print"></i></div>
        <div><p class="eyebrow">Urządzenie</p><h2 class="section-title">{{ api.model() }}</h2><p class="section-subtitle">Możliwości zgłoszone przez firmware</p></div>
        <dl>
          <div><dt>Szerokość papieru</dt><dd>{{ api.capabilities()?.paperWidthsMm?.join(' / ') || '58 / 80' }} mm</dd></div>
          <div><dt>Rozdzielczość</dt><dd>{{ api.capabilities()?.dpi || 203 }} dpi</dd></div>
          <div><dt>Operacje</dt><dd>{{ api.capabilities()?.operations?.length || '—' }}</dd></div>
        </dl>
      </article>
    </section>

    <section class="quick-grid" aria-label="Skróty funkcji">
      @for (item of shortcuts; track item.route) {
        <a class="quick-card" [routerLink]="item.route"><i [class]="item.icon"></i><div><strong>{{ item.title }}</strong><span>{{ item.description }}</span></div><i class="pi pi-arrow-up-right"></i></a>
      }
    </section>
  `,
  styles: [`
    .hero { min-height: 410px; display:grid; grid-template-columns:1.25fr .75fr; align-items:center; gap:60px; padding:28px 5% 55px; }
    h1 span { color:var(--accent); } .hero-actions{margin-top:26px}.printer-visual{height:310px;position:relative;display:grid;place-items:end center}.printer{width:310px;height:155px;border-radius:24px 24px 35px 35px;background:#292a27;box-shadow:0 24px 45px rgba(20,20,18,.22);position:relative}.printer .slot{position:absolute;top:27px;left:35px;right:35px;height:13px;border-radius:10px;background:#10110f;box-shadow:inset 0 2px 4px #000}.printer>i{position:absolute;right:29px;bottom:30px;color:#81c6a4;font-size:14px}.receipt{position:absolute;z-index:2;bottom:112px;width:220px;height:200px;padding:28px 22px;background:#fffef9;border:1px solid #e6e1d6;box-shadow:0 8px 20px rgba(0,0,0,.08);font-family:var(--mono);display:flex;flex-direction:column;gap:18px;text-align:center}.receipt span{font-size:10px;letter-spacing:.14em}.receipt b{font-size:15px}.receipt i{border-top:1px dashed #aaa}.receipt small{color:#777}.status-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:18px}.connection,.capabilities{display:grid;grid-template-columns:auto 1fr;column-gap:15px}.card-icon{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent)}.endpoint-row,.connection-result,dl{grid-column:1/-1}.endpoint-row{display:flex;gap:9px}.connection-result{margin-top:18px;padding-top:16px;border-top:1px solid var(--line);display:grid;grid-template-columns:auto auto 1fr;align-items:center;gap:8px;font-size:12px}.connection-result>span{width:8px;height:8px;border-radius:50%;background:#cf5749}.connection-result.ok>span{background:var(--green)}.connection-result small{text-align:right;color:var(--muted)}dl{margin:0}dl>div{display:flex;justify-content:space-between;padding:10px 0;border-top:1px solid var(--line);font-size:12px}dt{color:var(--muted)}dd{margin:0;font-weight:700}.quick-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:18px}.quick-card{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:18px;border:1px solid var(--line);border-radius:13px;background:white;color:var(--ink);text-decoration:none;transition:.18s}.quick-card:hover{transform:translateY(-2px);border-color:#bebeb7}.quick-card>i:first-child{color:var(--accent)}.quick-card strong,.quick-card span{display:block}.quick-card strong{font-size:13px}.quick-card span{margin-top:4px;color:var(--muted);font-size:11px;line-height:1.4}.quick-card>i:last-child{font-size:11px;color:var(--muted)}
    @media(max-width:900px){.hero{grid-template-columns:1fr}.printer-visual{display:none}.status-grid{grid-template-columns:1fr}.quick-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){.quick-grid{grid-template-columns:1fr}.endpoint-row{display:grid}.connection-result small{grid-column:2;text-align:left}}
  `]
})
export class DashboardComponent {
  protected readonly api = inject(PrinterApiService);
  protected endpoint = this.api.endpoint();
  protected readonly shortcuts = [
    { title: 'Drukuj obraz', description: 'Raster 1-bit i dithering', icon: 'pi pi-image', route: '/obraz' },
    { title: 'Surowe komendy', description: 'Hex, Base64 lub bajty', icon: 'pi pi-code', route: '/esc-pos' },
    { title: 'Konfiguracja', description: 'Opcje firmware drukarki', icon: 'pi pi-sliders-h', route: '/ustawienia' },
    { title: 'Dokument .md', description: 'Wczytaj i wydrukuj plik', icon: 'pi pi-upload', route: '/markdown' }
  ];
  protected connect(): void { this.api.setEndpoint(this.endpoint); void this.api.refreshStatus(); }
}
