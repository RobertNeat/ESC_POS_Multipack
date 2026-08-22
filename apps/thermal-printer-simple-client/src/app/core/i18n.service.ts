import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { EN_TRANSLATIONS, PL_TRANSLATIONS, TranslationKey } from './translations';

export type UiLanguage = 'pl' | 'en';
export type TranslationParams = Readonly<Record<string, string | number>>;

const LANGUAGE_STORAGE_KEY = 'thermal-console-language';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly languageSignal = signal<UiLanguage>(readInitialLanguage());

  readonly language = this.languageSignal.asReadonly();
  readonly locale = computed(() => (this.languageSignal() === 'pl' ? 'pl-PL' : 'en-US'));

  constructor() {
    effect(() => {
      const language = this.languageSignal();
      this.document.documentElement.lang = language;
      this.document
        .querySelector<HTMLMetaElement>('meta[name="description"]')
        ?.setAttribute('content', this.t('app.description'));
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    });
  }

  setLanguage(language: UiLanguage): void {
    this.languageSignal.set(language);
  }

  toggleLanguage(): void {
    this.setLanguage(this.languageSignal() === 'pl' ? 'en' : 'pl');
  }

  t(key: TranslationKey, params: TranslationParams = {}): string {
    const translations = this.languageSignal() === 'pl' ? PL_TRANSLATIONS : EN_TRANSLATIONS;
    return interpolate(translations[key], params);
  }
}

function readInitialLanguage(): UiLanguage {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'pl' || stored === 'en') return stored;
  return navigator.language.toLowerCase().startsWith('pl') ? 'pl' : 'en';
}

function interpolate(value: string, params: TranslationParams): string {
  return value.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}
