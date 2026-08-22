import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';
import { EN_TRANSLATIONS, PL_TRANSLATIONS } from './translations';

describe('I18nService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('switches all translations reactively and updates the document language', () => {
    const service = TestBed.inject(I18nService);

    service.setLanguage('pl');
    TestBed.flushEffects();
    expect(service.t('nav.dashboard')).toBe('Pulpit');
    expect(document.documentElement.lang).toBe('pl');

    service.setLanguage('en');
    TestBed.flushEffects();
    expect(service.t('nav.dashboard')).toBe('Dashboard');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('thermal-console-language')).toBe('en');
  });

  it('keeps Polish and English dictionaries complete', () => {
    expect(Object.keys(EN_TRANSLATIONS).sort()).toEqual(Object.keys(PL_TRANSLATIONS).sort());
  });

  it('interpolates dynamic values', () => {
    const service = TestBed.inject(I18nService);
    service.setLanguage('en');
    expect(service.t('notification.processed', { count: 3 })).toBe('Processed: 3');
  });
});
