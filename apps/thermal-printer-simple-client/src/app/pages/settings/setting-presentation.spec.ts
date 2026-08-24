import {
  printerActionCommandNameKey,
  printerActionDescriptionKey,
  printerActionTitleKey,
} from './setting-presentation';

describe('device action presentation', () => {
  it.each([
    ['NV Logo Down', 'action.nvLogo.title', 'action.nvLogo.description'],
    ['Printer Cut', 'action.printerCut.title', 'action.printerCut.description'],
    ['Print Default Page', 'action.defaultPage.title', 'action.defaultPage.description'],
    ['Open Cash Box', 'action.cashBox.title', 'action.cashBox.description'],
    ['Print SelfTest', 'action.selfTest.title', 'action.selfTest.description'],
    ['Test box', 'action.testBox.title', 'action.testBox.description'],
    ['Restore factory', 'action.restoreFactory.title', 'action.restoreFactory.description'],
  ])('maps %s to localized title and description keys', (title, titleKey, descriptionKey) => {
    expect(printerActionTitleKey(title)).toBe(titleKey);
    expect(printerActionDescriptionKey(title)).toBe(descriptionKey);
  });

  it('maps visible action command labels', () => {
    expect(printerActionCommandNameKey('clean logo')).toBe('action.command.cleanLogo');
    expect(printerActionCommandNameKey('Hello World without hex checkbox')).toBe(
      'action.command.helloWorld',
    );
  });
});
