import { describe, expect, it, vi } from 'vitest';
import { GameSession, formatWorldTime } from '@frontier/game-core';
import { createInitialState, ingredients } from './index';
describe('initial game data', () => {
  it('starts on day one at 08:00 with 100 coins', () => {
    const state = createInitialState();
    expect(state.money).toBe(100); expect(state.worldTime).toBe(480);
    expect(formatWorldTime(state.worldTime)).toBe('Day 1 · 08:00');
    expect(formatWorldTime(1440)).toBe('Day 2 · 00:00');
  });
  it('has the starter and discoverable ingredients and costs', () => {
    expect(ingredients.slice(0, 9).map(({id,name,category,baseCost}) => [id,name,category,baseCost])).toEqual([
      ['mushroom','Mushroom','mushroom',5],['potato','Potato','vegetable',3],['carrot','Carrot','vegetable',3],['fish','Fish','fish',12],['milk','Milk','dairy',6],['radish','Radish','vegetable',2],['tomato','Tomato','vegetable',4],['cabbage','Cabbage','vegetable',5],['pumpkin','Pumpkin','vegetable',8]
    ]);
  });
  it('gives every usable ingredient one unit and creates independent serializable states', () => {
    const a = createInitialState(), b = createInitialState();
    expect(a.inventory).toEqual(ingredients.map(item => ({ingredientId:item.id,quantity:1})));
    expect(a.inventory).not.toBe(b.inventory); expect(a.player).not.toBe(b.player);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
    expect(a.player.sceneId).toBe('kitchen'); expect(Number.isFinite(a.player.x)).toBe(true);
    expect(a.restaurant.isOpen).toBe(false);
  });
  it('publishes stable immutable snapshots and unsubscribes cleanly', () => {
    const session = new GameSession(createInitialState()), listener = vi.fn();
    const original = session.getSnapshot(); const unsubscribe = session.subscribe(listener);
    expect(session.getSnapshot()).toBe(original); expect(Object.isFrozen(original.inventory[0])).toBe(true);
    session.setPlayerPosition('village', 1, 2);
    expect(listener).toHaveBeenCalledTimes(1); expect(session.getSnapshot().player.x).toBe(1);
    expect(original.player.x).not.toBe(1); unsubscribe(); session.setPlayerPosition('village', 3, 4);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(() => session.setPlayerPosition('village', NaN, 0)).toThrow();
  });
});


