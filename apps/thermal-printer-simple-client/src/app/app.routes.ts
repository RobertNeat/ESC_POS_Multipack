import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { I18nService } from './core/i18n.service';

const translatedTitle = (key: Parameters<I18nService['t']>[0]) => () => inject(I18nService).t(key);
export const routes: Routes = [
  {
    path: '',
    title: translatedTitle('route.dashboard'),
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'linia',
    title: translatedTitle('route.typewriter'),
    loadComponent: () =>
      import('./pages/typewriter/typewriter.component').then((m) => m.TypewriterComponent),
  },
  {
    path: 'markdown',
    title: translatedTitle('route.markdown'),
    loadComponent: () =>
      import('./pages/markdown/markdown.component').then((m) => m.MarkdownComponent),
  },
  {
    path: 'obraz',
    title: translatedTitle('route.image'),
    loadComponent: () => import('./pages/image/image.component').then((m) => m.ImageComponent),
  },
  {
    path: 'listy',
    title: translatedTitle('route.lists'),
    loadComponent: () => import('./pages/lists/lists.component').then((m) => m.ListsComponent),
  },
  {
    path: 'esc-pos',
    title: translatedTitle('route.raw'),
    loadComponent: () => import('./pages/raw/raw.component').then((m) => m.RawComponent),
  },
  {
    path: 'ustawienia',
    title: translatedTitle('route.settings'),
    loadComponent: () =>
      import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
  },
  { path: '**', redirectTo: '' },
];
