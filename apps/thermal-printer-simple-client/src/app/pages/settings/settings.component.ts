import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { PrinterApiService } from '../../core/printer-api.service';
import {
  ActionDefinition,
  ConfigurationOptions,
  SettingDefinition,
} from '../../core/printer.models';

@Component({
  imports: [FormsModule, ButtonModule, SelectModule],
  template: `
    <div class="page-head">
      <div>
        <p class="eyebrow">Firmware POS-8370</p>
        <h1>Ustawienia drukarki</h1>
        <p class="lead">
          Lista ustawień urządzenia budowana na podstawie specyfikacji drukarki i sterownika
          firmware (obsługa bezpośrednio przez adapter modelu POS-8370).
        </p>
      </div>
      <p-button
        label="Odśwież opcje"
        icon="pi pi-refresh"
        severity="secondary"
        [outlined]="true"
        [loading]="loading"
        (onClick)="load()"
      />
    </div>
    @if (loading) {
      <div class="panel loading">
        <i class="pi pi-spin pi-spinner"></i> Pobieranie możliwości drukarki…
      </div>
    } @else if (error) {
      <div class="panel panel-pad error">
        <i class="pi pi-exclamation-circle"></i>
        <div>
          <h2>Nie można pobrać ustawień</h2>
          <p>{{ error }}</p>
          <p-button label="Spróbuj ponownie" size="small" (onClick)="load()" />
        </div>
      </div>
    } @else {
      <div class="layout">
        <section>
          <div class="section-head">
            <div>
              <h2>Konfiguracja urządzenia</h2>
              <p>Zaznacz tylko wartości, które chcesz zmienić.</p>
            </div>
            <span class="badge">{{ selectedCount() }} wybranych</span>
          </div>
          <div class="settings-grid">
            @for (setting of options?.settings; track setting.title) {
              <article class="panel setting" [class.selected]="selections[setting.title]">
                <div class="setting-icon"><i [class]="settingIcon(setting.title)"></i></div>
                <div>
                  <h3>{{ prettyName(setting.title) }}</h3>
                  <p>{{ setting.description || 'Ustawienie firmware drukarki.' }}</p>
                </div>
                <p-select
                  class="full-width"
                  [options]="setting.options"
                  [(ngModel)]="selections[setting.title]"
                  optionLabel="label"
                  optionValue="id"
                  [showClear]="true"
                  placeholder="Bez zmian"
                  [filter]="setting.options.length > 12"
                  filterBy="label"
                  [attr.aria-label]="prettyName(setting.title)"
                />
              </article>
            }
          </div>
          <div class="savebar panel">
            <div>
              <strong>{{ selectedCount() ? 'Gotowe do zapisania' : 'Nie wybrano zmian' }}</strong
              ><small>Zmiany są wykonywane przez usługę i mogą wymagać restartu drukarki.</small>
            </div>
            <p-button
              label="Zapisz ustawienia"
              icon="pi pi-check"
              [loading]="saving"
              [disabled]="selectedCount() === 0"
              (onClick)="save()"
            />
          </div>
        </section>
        <aside>
          <div class="panel panel-pad">
            <h2 class="section-title">Akcje urządzenia</h2>
            <p class="section-subtitle">Polecenia serwisowe udostępniane przez firmware</p>
            @for (action of availableActions(); track action.title) {
              <div class="action">
                <div>
                  <strong>{{ prettyName(action.title) }}</strong
                  ><small>{{ action.description }}</small>
                </div>
                @if (action.commands.length === 1) {
                  <p-button
                    icon="pi pi-play"
                    [rounded]="true"
                    [outlined]="true"
                    ariaLabel="Wykonaj"
                    [loading]="activeAction === action.title"
                    (onClick)="runAction(action, action.commands[0].id)"
                  />
                } @else {
                  <p-select
                    [options]="action.commands"
                    optionLabel="label"
                    optionValue="id"
                    placeholder="Wykonaj…"
                    appendTo="body"
                    (onChange)="runAction(action, $event.value)"
                  />
                }
              </div>
            }
          </div>
          <div class="notice">
            <i class="pi pi-info-circle"></i> Ustawienia są wysyłane nazwami z mapowania producenta.
            Front-end nie przechowuje ani nie tworzy własnych komend konfiguracyjnych.
          </div>
        </aside>
      </div>
    }
  `,
  styles: [
    `
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 370px;
        gap: 28px;
        align-items: start;
      }
      .section-head {
        display: flex;
        justify-content: space-between;
        align-items: end;
        margin: 0 2px 14px;
      }
      .section-head h2 {
        margin: 0;
        font-size: 18px;
      }
      .section-head p {
        margin: 5px 0 0;
        color: var(--muted);
        font-size: 12px;
      }
      .settings-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .setting {
        padding: 18px;
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 12px;
        transition: 0.15s;
      }
      .setting.selected {
        border-color: #d28a73;
        box-shadow: 0 0 0 2px rgba(220, 91, 56, 0.08);
      }
      .setting-icon {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 9px;
        background: var(--surface-2);
        color: var(--muted);
      }
      .setting.selected .setting-icon {
        background: var(--accent-soft);
        color: var(--accent);
      }
      .setting h3 {
        margin: 1px 0 5px;
        font-size: 13px;
      }
      .setting p {
        min-height: 34px;
        margin: 0;
        color: var(--muted);
        font-size: 10px;
        line-height: 1.45;
      }
      .setting p-select {
        grid-column: 1/-1;
      }
      .savebar {
        position: sticky;
        bottom: 14px;
        z-index: 5;
        margin-top: 15px;
        padding: 15px 18px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        box-shadow: 0 15px 35px rgba(30, 30, 28, 0.14);
      }
      .savebar strong,
      .savebar small {
        display: block;
      }
      .savebar strong {
        font-size: 12px;
      }
      .savebar small {
        margin-top: 4px;
        color: var(--muted);
        font-size: 10px;
      }
      .action {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
        align-items: center;
        padding: 13px 0;
        border-top: 1px solid var(--line);
      }
      .action strong,
      .action small {
        display: block;
      }
      .action strong {
        font-size: 12px;
      }
      .action small {
        max-width: 230px;
        margin-top: 4px;
        color: var(--muted);
        font-size: 10px;
        line-height: 1.4;
      }
      .notice {
        margin-top: 16px;
      }
      .notice i {
        margin-right: 6px;
      }
      .error {
        display: flex;
        gap: 18px;
        align-items: flex-start;
      }
      .error > i {
        font-size: 24px;
        color: #b94b3c;
      }
      .error h2 {
        margin: 0;
        font-size: 18px;
      }
      .error p {
        color: var(--muted);
        font-size: 12px;
      }
      @media (max-width: 1020px) {
        .layout {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 680px) {
        .settings-grid {
          grid-template-columns: 1fr;
        }
        .savebar {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  private readonly api = inject(PrinterApiService);
  protected options: ConfigurationOptions | null = null;
  protected selections: Record<string, string | null> = {};
  protected loading = true;
  protected saving = false;
  protected error = '';
  protected activeAction = '';
  ngOnInit(): void {
    void this.load();
  }
  protected async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      this.options = await this.api.getConfigurationOptions();
      this.selections = Object.fromEntries(
        this.options.settings.map((setting) => [setting.title, null]),
      );
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Usługa nie odpowiada.';
    } finally {
      this.loading = false;
    }
  }
  protected selectedCount(): number {
    return Object.values(this.selections).filter(Boolean).length;
  }
  protected availableActions(): ActionDefinition[] {
    return (this.options?.actions ?? []).filter((action) => action.commands.length > 0);
  }
  protected async save(): Promise<void> {
    const entries = Object.entries(this.selections)
      .filter((entry): entry is [string, string] => !!entry[1])
      .map(([setting, option]) => ({ setting, option }));
    if (!entries.length || this.saving) return;
    this.saving = true;
    try {
      await this.api.configure(entries);
      this.selections = Object.fromEntries(Object.keys(this.selections).map((key) => [key, null]));
    } finally {
      this.saving = false;
    }
  }
  protected async runAction(action: ActionDefinition, command?: string): Promise<void> {
    if (this.activeAction) return;
    this.activeAction = action.title;
    try {
      await this.api.performAction(action.title, command);
    } finally {
      this.activeAction = '';
    }
  }
  protected prettyName(value: string): string {
    return (
      (
        {
          'Set Printing mode': 'Tryb drukowania',
          'Cutting Setting': 'Automatyczne cięcie',
          'Set Density Level': 'Gęstość druku',
          'Set Default Char': 'Domyślny znak',
          'Set Default Page': 'Strona kodowa',
          'Setting DHCP': 'DHCP',
          'USB Type': 'Tryb USB',
          'Print width': 'Szerokość papieru',
          'Set up the buzzer': 'Buzzer',
          'Set Printer Baud': 'Prędkość transmisji',
          'Set Font': 'Zestaw znaków',
          'Set Voice swith': 'Komunikaty głosowe',
          'Enable Cutter(PIT)': 'Nóż (PIT)',
          'Setting speed': 'Prędkość druku',
          'USB Port': 'Przypisanie USB',
        } as Record<string, string>
      )[value] ?? value
    );
  }
  protected settingIcon(title: string): string {
    const value = title.toLowerCase();
    if (value.includes('cut')) return 'pi pi-minus';
    if (value.includes('usb')) return 'pi pi-link';
    if (value.includes('speed') || value.includes('baud')) return 'pi pi-gauge';
    if (value.includes('width')) return 'pi pi-arrows-h';
    if (value.includes('density')) return 'pi pi-sun';
    if (value.includes('font') || value.includes('char') || value.includes('page'))
      return 'pi pi-language';
    return 'pi pi-cog';
  }
}
