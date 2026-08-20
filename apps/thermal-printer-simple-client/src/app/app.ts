import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { PrinterApiService } from './core/printer-api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastModule, TooltipModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly api = inject(PrinterApiService);
  protected readonly navigation = [
    { label: 'Pulpit', icon: 'pi pi-home', route: '/' },
    { label: 'Maszyna do pisania', icon: 'pi pi-pencil', route: '/linia' },
    { label: 'Dokument Markdown', icon: 'pi pi-file-edit', route: '/markdown' },
    { label: 'Listy', icon: 'pi pi-list', route: '/listy' },
    { label: 'ESC/POS', icon: 'pi pi-code', route: '/esc-pos' },
    { label: 'Ustawienia', icon: 'pi pi-cog', route: '/ustawienia' }
  ];

  ngOnInit(): void { void this.api.refreshStatus(false); }
}
