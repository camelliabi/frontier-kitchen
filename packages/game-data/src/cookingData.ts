import type { CookingRules, Ingredient, MaterialProperties } from '@frontier/game-core';
import ruleData from './botw/rules.json';
import materialData from './botw/materials.json';
import dishNames from './botw/dish-names.en.json';
import chinese from './locales/zh-CN.json';

interface RawMaterial {
  hp: number; effect: string; potency: number; tags: string[]; name: string;
  time_boost: number; hp_boost: number; sell_price: number | null; buy_price: number | null;
  cook_low_price: boolean; roast_item: boolean; boost_success_rate: number; key_item: boolean;
}
export const referenceMaterials: Readonly<Record<string, RawMaterial>> = materialData.items;
const englishEffects: Record<string, string> = {
  LifeMaxUp: 'Hearty', GutsRecover: 'Energizing', ExGutsMaxUp: 'Enduring', AttackUp: 'Mighty',
  DefenseUp: 'Tough', MovingSpeed: 'Hasty', Quietness: 'Sneaky', ResistCold: 'Spicy',
  ResistHot: 'Chilly', ResistElectric: 'Electro', Fireproof: 'Fireproof',
};
export const cookingRules: CookingRules = { ...ruleData,
  names: { ...dishNames, ...Object.fromEntries(Object.entries(englishEffects).map(([id, name]) => [`effect:${id}`, name])) },
};

function category(tags: readonly string[]): string {
  return tags.includes('CookMushroom') ? 'mushroom' : tags.includes('CookFish') ? 'fish'
    : tags.includes('CookMeat') ? 'meat' : tags.includes('CookFruit') ? 'fruit'
    : tags.includes('CookPlant') ? 'vegetable' : tags.includes('CookInsect') ? 'insect'
    : tags.includes('CookEnemy') ? 'monster' : tags.includes('CookOre') ? 'ore' : 'spice';
}

// The supplied reference also contains world actors and transformed/key items.
// Keep distinct actor IDs; only eligible held-material forms enter the cooking catalog.
export function isCookingMaterial(id: string, item: RawMaterial): boolean {
  return !item.key_item && !item.roast_item && !id.startsWith('Item_Plant_')
    && !id.startsWith('Animal_Fish_') && !['Animal_Insect_K', 'Animal_Insect_O', 'Animal_Insect_Z'].includes(id);
}
function properties(actorId: string): MaterialProperties {
  const item = referenceMaterials[actorId];
  if (!item) throw new Error(`Missing material ${actorId}`);
  return { actorId, tags: item.tags, hp: item.hp, effect: item.effect, potency: item.potency,
    timeBoost: item.time_boost, hpBoost: item.hp_boost, sellPrice: Math.max(0, item.sell_price ?? 0),
    buyPrice: Math.max(0, item.buy_price ?? 0), lowPrice: item.cook_low_price,
    boostSuccessRate: item.boost_success_rate, canCook: isCookingMaterial(actorId, item) };
}
export const importedIngredients: readonly Ingredient[] = Object.entries(referenceMaterials)
  .filter(([id, item]) => isCookingMaterial(id, item)).map(([id, item]) => ({ id, name: item.name,
    category: category(item.tags), baseCost: Math.max(0, item.buy_price ?? 0), cooking: properties(id),
  }));

export function legacyMaterial(id: string, name: string, baseCost: number, actorId?: string): Ingredient {
  if (actorId) return { id, name, baseCost, category: actorId === 'Item_Material_05' ? 'dairy' : category(referenceMaterials[actorId].tags), cooking: properties(actorId) };
  // Explicit Frontier Kitchen extensions: not asserted to be original-game materials.
  return { id, name, baseCost, category: 'vegetable', cooking: {
    actorId: `frontier:${id}`, tags: ['CookPlant'], hp: 4, effect: '', potency: 0, timeBoost: 0,
    hpBoost: 0, sellPrice: baseCost, buyPrice: baseCost * 4, lowPrice: false, boostSuccessRate: 0, canCook: true,
  } };
}

const zhIngredients: Readonly<Record<string, string>> = chinese.ingredients;
const zhDishes: Readonly<Record<string, string>> = chinese.dishes;
export function localizedMaterialName(id: string, english: string, locale: 'en' | 'zh-CN'): string {
  if (locale === 'en') return english;
  const direct = zhIngredients[id];
  if (direct && direct !== id) return direct;
  // Localization only: no actor identity, tags or matching behavior is merged.
  const translated = Object.entries(referenceMaterials).find(([actorId, item]) => item.name === english && zhIngredients[actorId] && zhIngredients[actorId] !== actorId);
  return translated ? zhIngredients[translated[0]] : english;
}
export { zhDishes };
