import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { PopoverModule } from 'primeng/popover';
import { PrinterApiService } from './core/printer-api.service';
import { TextEncoding } from './core/printer.models';
import { TEXT_ENCODING_OPTIONS } from './shared/printer-options';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastModule, TooltipModule, PopoverModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly api = inject(PrinterApiService);
  protected readonly navigation = [
    { label: 'Pulpit', icon: 'pi pi-home', route: '/' },
    { label: 'Maszyna do pisania', icon: 'pi pi-pencil', route: '/linia' },
    { label: 'Dokument Markdown', icon: 'pi pi-file-edit', route: '/markdown' },
    { label: 'Obraz', icon: 'pi pi-image', route: '/obraz' },
    { label: 'Listy', icon: 'pi pi-list', route: '/listy' },
    { label: 'ESC/POS', icon: 'pi pi-code', route: '/esc-pos' },
    { label: 'Ustawienia drukarki', icon: 'pi pi-cog', route: '/ustawienia' },
  ];
  protected readonly textEncodings = TEXT_ENCODING_OPTIONS;

  protected selectTextEncoding(value: TextEncoding): void {
    this.api.setTextEncoding(value);
  }
  protected selectedEncodingLabel(): string {
    return (
      this.textEncodings.find((item) => item.value === this.api.textEncoding())?.label ??
      this.api.textEncoding()
    );
  }

  ngOnInit(): void {
    void this.api.refreshStatus(false);
  }
}
