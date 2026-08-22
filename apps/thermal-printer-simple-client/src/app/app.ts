import { Component, effect, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { PopoverModule } from 'primeng/popover';
import { PrinterApiService } from './core/printer-api.service';
import { I18nService, UiLanguage } from './core/i18n.service';
import { TranslatePipe } from './core/translate.pipe';
import { TextEncoding } from './core/printer.models';
import { TEXT_ENCODING_OPTIONS } from './shared/printer-options';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ToastModule,
    TooltipModule,
    PopoverModule,
    TranslatePipe,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly api = inject(PrinterApiService);
  protected readonly i18n = inject(I18nService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly updateDocumentTitle = effect(() => {
    this.i18n.language();
    const titleByPath = {
      '/': 'route.dashboard',
      '/linia': 'route.typewriter',
      '/markdown': 'route.markdown',
      '/obraz': 'route.image',
      '/listy': 'route.lists',
      '/esc-pos': 'route.raw',
      '/ustawienia': 'route.settings',
    } as const;
    const path = this.router.url.split(/[?#]/)[0] as keyof typeof titleByPath;
    document.title = this.i18n.t(titleByPath[path] ?? 'route.dashboard');
  });
  protected readonly navigation = [
    { labelKey: 'nav.dashboard' as const, icon: 'pi pi-home', route: '/' },
    { labelKey: 'nav.typewriter' as const, icon: 'pi pi-pencil', route: '/linia' },
    { labelKey: 'nav.markdown' as const, icon: 'pi pi-file-edit', route: '/markdown' },
    { labelKey: 'nav.image' as const, icon: 'pi pi-image', route: '/obraz' },
    { labelKey: 'nav.lists' as const, icon: 'pi pi-list', route: '/listy' },
    { labelKey: 'nav.raw' as const, icon: 'pi pi-code', route: '/esc-pos' },
    { labelKey: 'nav.settings' as const, icon: 'pi pi-cog', route: '/ustawienia' },
  ];
  protected textEncodings() {
    return TEXT_ENCODING_OPTIONS.map((option) => ({
      ...option,
      printerPage: option.printerPageKey ? this.i18n.t(option.printerPageKey) : option.printerPage,
    }));
  }

  protected selectTextEncoding(value: TextEncoding): void {
    this.api.setTextEncoding(value);
  }
  protected setLanguage(language: UiLanguage): void {
    this.i18n.setLanguage(language);
  }
  protected selectedEncodingLabel(): string {
    return (
      this.textEncodings().find((item) => item.value === this.api.textEncoding())?.label ??
      this.api.textEncoding()
    );
  }

  ngOnInit(): void {
    void this.api.refreshStatus(false);
  }
}
