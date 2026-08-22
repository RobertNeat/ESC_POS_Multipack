import { TestBed } from '@angular/core/testing';
import { ThemeService, THEME_STORAGE_KEY } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('app-dark');
    document.documentElement.style.colorScheme = '';
    TestBed.configureTestingModule({});
  });

  it('applies and persists the selected semantic color theme', () => {
    const service = TestBed.inject(ThemeService);

    service.setTheme('dark');
    TestBed.flushEffects();
    expect(document.documentElement.classList.contains('app-dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    service.toggleTheme();
    TestBed.flushEffects();
    expect(service.theme()).toBe('light');
    expect(document.documentElement.classList.contains('app-dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });
});
