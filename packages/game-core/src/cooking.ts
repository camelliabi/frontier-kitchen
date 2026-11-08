import type { Ingredient } from './index';
import { resolveDishName } from './dishNaming';
import { calculateDishValue } from './dishValue';
import { type CookingOptions, type CookingRules, type CookingStats, type MaterialGroup } from './cookingTypes';
import { matchRecipe } from './recipeMatcher';
import { calculateCookingStats } from './cookingEffects';

export interface RecipeIngredient {
  readonly ingredientId: string;
  readonly quantity: number;
}

export interface Recipe {
  readonly dishId: string;
  readonly method: 'boil';
  readonly ingredients: readonly RecipeIngredient[];
}

export interface Dish extends Recipe {
  readonly id: string;
  readonly name: string;
  readonly hiddenValue: number | null;
  readonly stats: CookingStats;
}
export interface DishStack { readonly dishId: string; readonly quantity: number }
export interface MenuItem {
  readonly dishId: string;
  readonly isForSale: boolean;
  readonly price: number | null;
}

export type ActionCode = 'cooked' | 'menuAdded' | 'menuSaved' | 'sold'
  | 'kitchenOnly' | 'invalidPortion' | 'unknownIngredient' | 'insufficientIngredients'
  | 'unknownDish' | 'invalidPrice' | 'notForSale' | 'soldOut' | 'moneyLimit';
export type ActionResult =
  | { readonly ok: true; readonly code: ActionCode; readonly dishId: string; readonly income?: number }
  | { readonly ok: false; readonly code: ActionCode };

/** Canonical ordering makes the same quantities yield the same dish in any selection order. */
export function createDish(ids: readonly string[], catalog: readonly Ingredient[], rules: CookingRules, options: CookingOptions = {}): Dish {
  if (ids.length < 1 || ids.length > 5) throw new Error('Expected one to five portions');
  const counts = new Map<string, number>();
  const groups: MaterialGroup[] = [];
  for (const id of ids) {
    const material = catalog.find(item => item.id === id)?.cooking;
    if (!material?.canCook) throw new Error('Ingredient cannot be cooked');
    counts.set(id, (counts.get(id) ?? 0) + 1);
    const index = groups.findIndex(group => group.material.actorId === material.actorId);
    if (index < 0) groups.push({ material, count: 1 });
    else groups[index] = { ...groups[index], count: groups[index].count + 1 };
  }
  const ingredients = [...counts].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([ingredientId, quantity]) => ({ ingredientId, quantity }));
  const stats = calculateCookingStats(groups, matchRecipe(groups, rules), rules, options);
  const recipeKey = ingredients.map(item => `${encodeURIComponent(item.ingredientId)}:${item.quantity}`).join('|');
  const id = `${stats.resultId}|${recipeKey}|${JSON.stringify(stats)}`;
  const recipe: Recipe = { dishId: id, method: 'boil', ingredients };
  const hiddenValue = calculateDishValue(recipe, catalog, stats.resultId, rules.System.NMMR);
  const finalStats = { ...stats, sellPrice: hiddenValue };
  return { ...recipe, id, stats: finalStats,
    name: resolveDishName(finalStats, rules.names), hiddenValue };
}
