import type { Recipe } from './cooking';
import type { Ingredient } from './index';

/** Pot-cooked value: single-precision multiplier, truncate, then round up to tens. */
export function calculateDishValue(
  recipe: Recipe,
  ingredients: readonly Ingredient[],
  resultId?: string,
  multipliers: readonly number[] = [1.5, 1.8, 2.1, 2.4, 2.8],
): number {
  if (['Item_Cook_C_16', 'Item_Cook_O_01', 'Item_Cook_O_02'].includes(resultId ?? '')) return 2;
  let sell = 0, buy = 0, count = 0;
  for (const item of recipe.ingredients) {
    const material = ingredients.find(ingredient => ingredient.id === item.ingredientId)?.cooking;
    if (!material) throw new Error('Missing material pricing');
    count += item.quantity;
    sell += (material.lowPrice ? 1 : material.sellPrice) * item.quantity;
    buy += (material.lowPrice ? 1 : material.buyPrice) * item.quantity;
  }
  if (count < 1 || count > 5) throw new Error('Expected one to five portions');
  const pre = Math.trunc(Math.fround(Math.fround(sell) * Math.fround(multipliers[count - 1])));
  const rounded = pre > 0 ? 10 * Math.ceil(pre / 10) : 0;
  return Math.max(2, Math.min(buy, rounded));
}
