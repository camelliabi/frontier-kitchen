import { resolveDishName, type Dish } from '@frontier/game-core';
import { ingredients, cookingRules, localizedMaterialName, zhDishes } from '@frontier/game-data';
import { LanguageStore, messages, type MessageKey } from '../i18n';

export function ingredientName(id: string, language: LanguageStore): string {
  const ingredient = ingredients.find(item => item.id === id);
  if (!ingredient) return id;
  if (Object.prototype.hasOwnProperty.call(messages.en, id)) return language.t(id as MessageKey);
  return localizedMaterialName(id, ingredient.name, language.getSnapshot());
}

const effectKeys: Readonly<Record<string, MessageKey>> = {
  LifeMaxUp: 'effectHearty', GutsRecover: 'effectEnergizing', ExGutsMaxUp: 'effectEnduring',
  AttackUp: 'effectMighty', DefenseUp: 'effectTough', MovingSpeed: 'effectHasty',
  Quietness: 'effectSneaky', ResistCold: 'effectSpicy', ResistHot: 'effectChilly',
  ResistElectric: 'effectElectro', Fireproof: 'effectFireproof',
};
export function effectName(id: string, language: LanguageStore): string {
  return effectKeys[id] ? language.t(effectKeys[id]) : id;
}

export function dishName(dish: Dish, language: LanguageStore): string {
  const names = { ...cookingRules.names, ...(language.getSnapshot() === 'zh-CN' ? zhDishes : {}),
    ...Object.fromEntries(Object.keys(effectKeys).map(id => [`effect:${id}`, effectName(id, language)])),
  };
  return resolveDishName(dish.stats, names, language.getSnapshot() === 'zh-CN' ? '' : ' ');
}
