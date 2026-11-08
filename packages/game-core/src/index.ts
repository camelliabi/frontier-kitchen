import { createDish, type ActionResult, type Dish, type DishStack, type Recipe, type MenuItem } from './cooking';
export * from './cooking';
export { resolveDishName } from './dishNaming';
export { calculateDishValue } from './dishValue';
export * from './cookingTypes';
export { matchRecipe } from './recipeMatcher';
import { nextCookingSeed, type MaterialProperties, type CookingRules } from './cookingTypes';
export interface Ingredient { readonly id: string; readonly name: string; readonly category: string; readonly baseCost: number; readonly cooking?: MaterialProperties }
export interface InventoryItem { readonly ingredientId: string; readonly quantity: number }
export interface PlayerState { readonly sceneId: string; readonly x: number; readonly y: number }
export interface RestaurantState { readonly isOpen: boolean }
export interface GameState {
  readonly worldTime: number;
  readonly money: number;
  readonly inventory: readonly InventoryItem[];
  readonly player: PlayerState;
  readonly restaurant: RestaurantState;
  readonly dishes: readonly Dish[];
  readonly cookedInventory: readonly DishStack[];
  readonly recipes: readonly Recipe[];
  readonly menu: readonly MenuItem[];
  readonly cookingSeed: number;
}

// Copy and freeze snapshots so consumers cannot mutate the authoritative state.
function snapshot(state: GameState): GameState {
  const freezeRecipe = <T extends Recipe>(recipe: T): T => Object.freeze({ ...recipe,
    ingredients: Object.freeze(recipe.ingredients.map(item => Object.freeze({ ...item }))),
  });
  return Object.freeze({ ...state,
    inventory: Object.freeze(state.inventory.map(item => Object.freeze({ ...item }))),
    player: Object.freeze({ ...state.player }), restaurant: Object.freeze({ ...state.restaurant }),
    dishes: Object.freeze(state.dishes.map(dish => Object.freeze({ ...freezeRecipe(dish), stats: Object.freeze({ ...dish.stats }) }))),
    recipes: Object.freeze(state.recipes.map(freezeRecipe)),
    cookedInventory: Object.freeze(state.cookedInventory.map(item => Object.freeze({ ...item }))),
    menu: Object.freeze(state.menu.map(item => Object.freeze({ ...item }))),
  });
}
export class GameSession {
  private state: GameState;
  private listeners = new Set<() => void>();
  private readonly catalog: readonly Ingredient[];
  constructor(initialState: GameState, catalog: readonly Ingredient[] = [], private readonly cookingRules?: CookingRules) {
    this.state = snapshot(initialState);
    this.catalog = catalog.map(item => ({ ...item, cooking: item.cooking ? { ...item.cooking, tags: [...item.cooking.tags] } : undefined }));
  }
  getSnapshot = (): GameState => this.state;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  setPlayerPosition(sceneId: string, x: number, y: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Invalid player position');
    this.state = snapshot({ ...this.state, player: { sceneId, x, y } });
    this.listeners.forEach(listener => listener());
  }
  private commit(state: GameState): void {
    this.state = snapshot(state);
    this.listeners.forEach(listener => listener());
  }

  cook(ingredientIds: readonly string[]): ActionResult {
    const state = this.state;
    if (state.player.sceneId !== 'kitchen') return { ok: false, code: 'kitchenOnly' };
    if (ingredientIds.length < 1 || ingredientIds.length > 5) return { ok: false, code: 'invalidPortion' };
    if (ingredientIds.some(id => !this.catalog.some(item => item.id === id && item.cooking?.canCook))) return { ok: false, code: 'unknownIngredient' };
    if (!this.cookingRules) throw new Error('Cooking rules have not been configured');
    const requests = new Map<string, number>();
    for (const id of ingredientIds) requests.set(id, (requests.get(id) ?? 0) + 1);
    for (const [ingredientId, count] of requests) {
      const available = state.inventory.filter(item => item.ingredientId === ingredientId)
        .reduce((sum, item) => sum + item.quantity, 0);
      if (available < count) return { ok: false, code: 'insufficientIngredients' };
    }
    const dish = createDish(ingredientIds, this.catalog, this.cookingRules, { seed: state.cookingSeed });
    const remaining = new Map(dish.ingredients.map(item => [item.ingredientId, item.quantity]));
    const inventory = state.inventory.map(item => {
      const used = Math.min(item.quantity, remaining.get(item.ingredientId) ?? 0);
      remaining.set(item.ingredientId, (remaining.get(item.ingredientId) ?? 0) - used);
      return { ...item, quantity: item.quantity - used };
    }).filter(item => item.quantity > 0);
    const existing = state.cookedInventory.find(item => item.dishId === dish.id);
    const cookedInventory = existing
      ? state.cookedInventory.map(item => item.dishId === dish.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...state.cookedInventory, { dishId: dish.id, quantity: 1 }];
    this.commit({ ...state, inventory, cookedInventory, cookingSeed: nextCookingSeed(state.cookingSeed),
      dishes: state.dishes.some(item => item.id === dish.id) ? state.dishes : [...state.dishes, dish],
    });
    return { ok: true, code: 'cooked', dishId: dish.id };
  }

  addDishToMenu(dishId: string): ActionResult {
    const state = this.state;
    const dish = state.dishes.find(item => item.id === dishId);
    if (!dish) return { ok: false, code: 'unknownDish' };
    if (!state.menu.some(item => item.dishId === dishId)) {
      this.commit({ ...state,
        recipes: state.recipes.some(item => item.dishId === dishId) ? state.recipes : [...state.recipes, {
          dishId, method: dish.method, ingredients: dish.ingredients,
        }],
        menu: [...state.menu, { dishId, isForSale: false, price: null }],
      });
    }
    return { ok: true, code: 'menuAdded', dishId };
  }

  updateMenuItem(dishId: string, isForSale: boolean, price: number | null): ActionResult {
    if (!this.state.menu.some(item => item.dishId === dishId)) return { ok: false, code: 'unknownDish' };
    if ((price !== null && (!Number.isSafeInteger(price) || price <= 0)) || (isForSale && price === null)) {
      return { ok: false, code: 'invalidPrice' };
    }
    this.commit({ ...this.state, menu: this.state.menu.map(item => item.dishId === dishId ? { ...item, isForSale, price } : item) });
    return { ok: true, code: 'menuSaved', dishId };
  }

  sellDish(dishId: string): ActionResult {
    const state = this.state;
    const item = state.menu.find(item => item.dishId === dishId);
    if (!item) return { ok: false, code: 'unknownDish' };
    if (!item.isForSale) return { ok: false, code: 'notForSale' };
    if (item.price === null || !Number.isSafeInteger(item.price) || item.price <= 0) return { ok: false, code: 'invalidPrice' };
    if (!state.cookedInventory.some(stack => stack.dishId === dishId && stack.quantity > 0)) return { ok: false, code: 'soldOut' };
    if (!Number.isSafeInteger(state.money + item.price)) return { ok: false, code: 'moneyLimit' };
    this.commit({ ...state, money: state.money + item.price,
      cookedInventory: state.cookedInventory.map(stack => stack.dishId === dishId ? { ...stack, quantity: stack.quantity - 1 } : stack).filter(stack => stack.quantity > 0),
    });
    return { ok: true, code: 'sold', dishId, income: item.price };
  }
}
export function formatWorldTime(minutes: number): string {
  const total = Math.max(0, Math.floor(minutes));
  const day = Math.floor(total / 1440) + 1;
  return `Day ${day} · ${String(Math.floor(total % 1440 / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

