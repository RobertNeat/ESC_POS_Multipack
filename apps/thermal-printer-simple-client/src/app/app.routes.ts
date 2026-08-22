import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    title: 'Thermal',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'linia',
    title: 'Thermal | Typewriter',
    loadComponent: () =>
      import('./pages/typewriter/typewriter.component').then((m) => m.TypewriterComponent),
  },
  {
    path: 'markdown',
    title: 'Thermal | Markdown',
    loadComponent: () =>
      import('./pages/markdown/markdown.component').then((m) => m.MarkdownComponent),
  },
  {
    path: 'obraz',
    title: 'Thermal | Image',
    loadComponent: () => import('./pages/image/image.component').then((m) => m.ImageComponent),
  },
  {
    path: 'listy',
    title: 'Thermal | List',
    loadComponent: () => import('./pages/lists/lists.component').then((m) => m.ListsComponent),
  },
  {
    path: 'esc-pos',
    title: 'Thermal | Command',
    loadComponent: () => import('./pages/raw/raw.component').then((m) => m.RawComponent),
  },
  {
    path: 'ustawienia',
    title: 'Thermal | Settings',
    loadComponent: () =>
      import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
  },
  { path: '**', redirectTo: '' },
];
