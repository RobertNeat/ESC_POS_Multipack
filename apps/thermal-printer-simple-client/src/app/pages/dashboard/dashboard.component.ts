import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PrinterApiService } from '../../core/printer-api.service';

@Component({
  imports: [FormsModule, RouterLink, ButtonModule, InputTextModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  protected readonly api = inject(PrinterApiService);
  protected endpoint = this.api.endpoint();
  protected readonly shortcuts = [
    {
      title: 'Drukuj obraz',
      description: 'Raster 1-bit i dithering',
      icon: 'pi pi-image',
      route: '/obraz',
    },
    {
      title: 'Surowe komendy',
      description: 'Hex, Base64 lub bajty',
      icon: 'pi pi-code',
      route: '/esc-pos',
    },
    {
      title: 'Konfiguracja',
      description: 'Opcje firmware drukarki',
      icon: 'pi pi-sliders-h',
      route: '/ustawienia',
    },
    {
      title: 'Dokument .md',
      description: 'Wczytaj i wydrukuj plik',
      icon: 'pi pi-upload',
      route: '/markdown',
    },
  ];
  protected connect(): void {
    this.api.setEndpoint(this.endpoint);
    void this.api.refreshStatus();
  }
}
