import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PrinterPreferencesService } from './printer-preferences.service';

@Injectable({ providedIn: 'root' })
export class PrinterHttpClient {
  private readonly http = inject(HttpClient);
  private readonly preferences = inject(PrinterPreferencesService);

  get<T>(path: string): Promise<T> {
    return firstValueFrom(this.http.get<T>(this.url(path)));
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.post<T>(this.url(path), body));
  }

  private url(path: string): string {
    return `${this.preferences.endpoint()}${path}`;
  }
}
