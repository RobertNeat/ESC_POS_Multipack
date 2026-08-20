import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', title: 'Pulpit | Thermal Console', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'linia', title: 'Maszyna do pisania | Thermal Console', loadComponent: () => import('./pages/typewriter/typewriter.component').then(m => m.TypewriterComponent) },
  { path: 'markdown', title: 'Markdown | Thermal Console', loadComponent: () => import('./pages/markdown/markdown.component').then(m => m.MarkdownComponent) },
  { path: 'obraz', title: 'Obraz | Thermal Console', loadComponent: () => import('./pages/image/image.component').then(m => m.ImageComponent) },
  { path: 'listy', title: 'Listy | Thermal Console', loadComponent: () => import('./pages/lists/lists.component').then(m => m.ListsComponent) },
  { path: 'esc-pos', title: 'ESC/POS | Thermal Console', loadComponent: () => import('./pages/raw/raw.component').then(m => m.RawComponent) },
  { path: 'ustawienia', title: 'Ustawienia | Thermal Console', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },
  { path: '**', redirectTo: '' }
];
