import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';

export type ColorTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'thermal-console-theme';
const DARK_THEME_CLASS = 'app-dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly themeSignal = signal<ColorTheme>(readInitialTheme());

  readonly theme = this.themeSignal.asReadonly();

  constructor() {
    effect(() => {
      const theme = this.themeSignal();
      const root = this.document.documentElement;

      root.classList.toggle(DARK_THEME_CLASS, theme === 'dark');
      root.style.colorScheme = theme;
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    });
  }

  setTheme(theme: ColorTheme): void {
    this.themeSignal.set(theme);
  }

  toggleTheme(): void {
    this.setTheme(this.themeSignal() === 'dark' ? 'light' : 'dark');
  }
}

function readInitialTheme(): ColorTheme {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;

  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
