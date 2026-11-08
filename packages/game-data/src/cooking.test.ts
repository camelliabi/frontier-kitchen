import { describe, expect, it, vi } from 'vitest';
import { GameSession, createDish } from '@frontier/game-core';
import { createInitialState, ingredients, cookingRules } from './index';

// Transaction fixtures intentionally have repeated stock, independent of the playable starting kit.
const start = () => new GameSession({ ...createInitialState(),
  inventory: ingredients.slice(0, 6).map(item => ({ ingredientId: item.id, quantity: 3 })),
}, ingredients, cookingRules);

describe('cooking and menu transactions', () => {
  it('uses the complete rules instead of the former milk soup shortcut', () => {
    expect(createDish(['milk', 'potato'], ingredients, cookingRules).stats.resultId).toBe('Item_Cook_K_09');
    expect(createDish(['milk', 'potato', 'Item_Ore_H'], ingredients, cookingRules).stats.resultId).toBe('Item_Cook_K_07');
    expect(createDish(['milk'], ingredients, cookingRules).name).toBe('Milk');
  });
  it('canonicalizes repeated ingredients without depending on selection order', () => {
    const a = createDish(['potato', 'radish', 'potato'], ingredients, cookingRules);
    expect(a).toEqual(createDish(['radish', 'potato', 'potato'], ingredients, cookingRules));
    expect(a.id).not.toBe(createDish(['radish', 'potato'], ingredients, cookingRules).id);
    expect(a.name).toBe('Hearty Fried Wild Greens');
    expect(a.hiddenValue).toBeGreaterThan(0);
  });
  it('rejects empty, oversized, unknown and insufficient inputs atomically', () => {
    const session = start(), before = session.getSnapshot(), listener = vi.fn();
    session.subscribe(listener);
    for (const ids of [[], Array(6).fill('potato'), ['unknown'], Array(4).fill('potato'), ['tomato']]) {
      expect(session.cook(ids).ok).toBe(false);
      expect(session.getSnapshot()).toBe(before);
    }
    expect(listener).not.toHaveBeenCalled();
  });
  it('only cooks in the kitchen', () => {
    const session = start(); session.setPlayerPosition('village', 1, 2);
    expect(session.cook(['potato'])).toEqual({ ok: false, code: 'kitchenOnly' });
  });
  it('consumes up to five portions and creates one dish with a frozen recipe', () => {
    const session = start();
    const result = session.cook(['potato', 'potato', 'radish', 'radish', 'radish']);
    expect(result.ok).toBe(true);
    const state = session.getSnapshot();
    expect(state.inventory.find(item => item.ingredientId === 'potato')?.quantity).toBe(1);
    expect(state.inventory.some(item => item.ingredientId === 'radish')).toBe(false);
    expect(state.cookedInventory[0].quantity).toBe(1);
    expect(Object.isFrozen(state.dishes[0].ingredients[0])).toBe(true);
    expect(state.recipes).toHaveLength(0);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
  it('stacks identical dishes and records recipe/menu only once without consuming stock', () => {
    const session = start(); session.cook(['potato', 'radish']); session.cook(['radish', 'potato']);
    const dishId = session.getSnapshot().dishes[0].id;
    expect(session.getSnapshot().dishes).toHaveLength(1);
    expect(session.getSnapshot().cookedInventory[0].quantity).toBe(2);
    session.addDishToMenu(dishId); session.addDishToMenu(dishId);
    expect(session.getSnapshot().recipes).toHaveLength(1);
    expect(session.getSnapshot().menu).toEqual([{ dishId, isForSale: false, price: null }]);
    expect(session.getSnapshot().cookedInventory[0].quantity).toBe(2);
    expect(Object.isFrozen(session.getSnapshot().recipes[0].ingredients[0])).toBe(true);
  });
  it('rejects invalid prices without changing saved menu settings', () => {
    const session = start(); session.cook(['potato']);
    const dishId = session.getSnapshot().dishes[0].id; session.addDishToMenu(dishId);
    const before = session.getSnapshot();
    for (const price of [null, 0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(session.updateMenuItem(dishId, true, price).ok).toBe(false);
      expect(session.getSnapshot()).toBe(before);
    }
  });
  it('sells only listed, in-stock dishes at the saved price and settles immediately', () => {
    const session = start(); session.cook(['potato']);
    const dishId = session.getSnapshot().dishes[0].id;
    expect(session.sellDish(dishId).ok).toBe(false);
    session.addDishToMenu(dishId);
    expect(session.sellDish(dishId)).toEqual({ ok: false, code: 'notForSale' });
    session.updateMenuItem(dishId, true, 20);
    expect(session.sellDish(dishId)).toMatchObject({ ok: true, income: 20 });
    expect(session.getSnapshot().money).toBe(120);
    expect(session.getSnapshot().cookedInventory).toHaveLength(0);
    const before = session.getSnapshot();
    expect(session.sellDish(dishId)).toEqual({ ok: false, code: 'soldOut' });
    expect(session.getSnapshot()).toBe(before);
    expect(before.recipes).toHaveLength(1);
    session.cook(['potato']);
    expect(session.sellDish(dishId).ok).toBe(true);
    expect(session.getSnapshot().money).toBe(140);
  });
  it('allows taking dishes off sale and rejects fabricated dish IDs', () => {
    const session = start(); session.cook(['potato']);
    const dishId = session.getSnapshot().dishes[0].id;
    session.addDishToMenu(dishId); session.updateMenuItem(dishId, true, 10);
    session.updateMenuItem(dishId, false, 10);
    expect(session.sellDish(dishId).ok).toBe(false);
    expect(session.addDishToMenu('fake').ok).toBe(false);
    expect(session.updateMenuItem('fake', true, 10).ok).toBe(false);
    expect(session.sellDish('fake').ok).toBe(false);
  });
  it('prevents unsafe coin totals', () => {
    const session = new GameSession({ ...createInitialState(), money: Number.MAX_SAFE_INTEGER }, ingredients, cookingRules);
    session.cook(['potato']); const dishId = session.getSnapshot().dishes[0].id;
    session.addDishToMenu(dishId); session.updateMenuItem(dishId, true, 1);
    const before = session.getSnapshot();
    expect(session.sellDish(dishId)).toEqual({ ok: false, code: 'moneyLimit' });
    expect(session.getSnapshot()).toBe(before);
  });
});
