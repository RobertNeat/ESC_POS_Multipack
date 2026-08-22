import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PrinterApiService } from '../../core/printer-api.service';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  imports: [FormsModule, RouterLink, ButtonModule, InputTextModule, TranslatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  protected readonly api = inject(PrinterApiService);
  protected endpoint = this.api.endpoint();
  protected readonly shortcuts = [
    {
      titleKey: 'dashboard.imageTitle' as const,
      descriptionKey: 'dashboard.imageDescription' as const,
      icon: 'pi pi-image',
      route: '/obraz',
    },
    {
      titleKey: 'dashboard.rawTitle' as const,
      descriptionKey: 'dashboard.rawDescription' as const,
      icon: 'pi pi-code',
      route: '/esc-pos',
    },
    {
      titleKey: 'dashboard.configTitle' as const,
      descriptionKey: 'dashboard.configDescription' as const,
      icon: 'pi pi-sliders-h',
      route: '/ustawienia',
    },
    {
      titleKey: 'dashboard.documentTitle' as const,
      descriptionKey: 'dashboard.documentDescription' as const,
      icon: 'pi pi-upload',
      route: '/markdown',
    },
  ];
  protected connect(): void {
    this.api.setEndpoint(this.endpoint);
    void this.api.refreshStatus();
  }
}
