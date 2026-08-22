import { routes } from './app.routes';

describe('application route titles', () => {
  it.each([
    ['', 'Thermal'],
    ['linia', 'Thermal | Typewriter'],
    ['markdown', 'Thermal | Markdown'],
    ['obraz', 'Thermal | Image'],
    ['listy', 'Thermal | List'],
    ['esc-pos', 'Thermal | Command'],
    ['ustawienia', 'Thermal | Settings'],
  ])('uses the expected title for /%s', (path, title) => {
    expect(routes.find((route) => route.path === path)?.title).toBe(title);
  });
});
