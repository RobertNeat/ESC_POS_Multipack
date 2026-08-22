import { TestBed } from '@angular/core/testing';
import { I18nService } from './core/i18n.service';
import { routes } from './app.routes';

describe('application route titles', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    TestBed.inject(I18nService).setLanguage('en');
  });

  it.each([
    ['', 'Thermal Console'],
    ['linia', 'Thermal Console | Typewriter'],
    ['markdown', 'Thermal Console | Markdown'],
    ['obraz', 'Thermal Console | Image'],
    ['listy', 'Thermal Console | Lists'],
    ['esc-pos', 'Thermal Console | Commands'],
    ['ustawienia', 'Thermal Console | Settings'],
  ])('uses the expected title for /%s', (path, title) => {
    const resolver = routes.find((route) => route.path === path)?.title as () => string;
    expect(TestBed.runInInjectionContext(() => resolver())).toBe(title);
  });
});
