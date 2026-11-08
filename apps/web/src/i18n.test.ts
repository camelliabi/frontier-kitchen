import { expect, it, vi } from 'vitest';
import { LanguageStore, localizedTime, messages, readSavedLocale } from './i18n';
import { ingredients } from '@frontier/game-data';
import { ingredientName } from './components/dishText';

it('has matching translation keys and every ingredient in both languages', () => {
  expect(Object.keys(messages.en).sort()).toEqual(Object.keys(messages['zh-CN']).sort());
  for (const ingredient of ingredients) {
    expect(ingredientName(ingredient.id, new LanguageStore('en'))).toBeTruthy();
    expect(ingredientName(ingredient.id, new LanguageStore('zh-CN'))).toBeTruthy();
  }
});
it('updates subscribers and cleans up subscriptions', () => {
  const language = new LanguageStore('zh-CN');
  const listener = vi.fn();
  const unsubscribe = language.subscribe(listener);
  language.setLocale('en');
  expect(language.t('stove')).toBe('Stove');
  language.setLocale('en');
  expect(listener).toHaveBeenCalledTimes(1);
  unsubscribe(); language.setLocale('zh-CN');
  expect(listener).toHaveBeenCalledTimes(1);
});
it('formats day boundaries in both languages', () => {
  expect(localizedTime(480, 'en')).toBe('Day 1 · 08:00');
  expect(localizedTime(1440, 'zh-CN')).toBe(messages['zh-CN'].dayTime.replace('{day}', '2').replace('{clock}', '00:00'));
  expect(localizedTime(1440, 'en')).toBe('Day 2 · 00:00');
});
it('falls back safely when preference storage is unavailable', () => {
  expect(readSavedLocale()).toBe('en');
  expect(new LanguageStore().getSnapshot()).toBe('en');
});
