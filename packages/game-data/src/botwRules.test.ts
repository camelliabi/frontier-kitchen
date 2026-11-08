import { describe, expect, it } from 'vitest';
import { createDish, matchRecipe, GameSession, type MaterialGroup, type CookingRules } from '@frontier/game-core';
import { cookingRules, ingredients, createInitialState, importedIngredients } from './index';

const make = (ids: string[]) => createDish(ids, ingredients, cookingRules, { random: () => .99 });

describe('complete pot recipe table', () => {
  it('preserves all 125 + 13 ordered entries, 118 results and required actor IDs', () => {
    expect(cookingRules.Recipes).toHaveLength(125);
    expect(cookingRules.SingleRecipes).toHaveLength(13);
    expect(new Set([...cookingRules.Recipes, ...cookingRules.SingleRecipes].map(rule => rule.result_id)).size).toBe(118);
    for (const table of [cookingRules.Recipes, cookingRules.SingleRecipes]) table.forEach((rule, i) => {
      expect(rule.order).toBe(i);
      expect(cookingRules.names[rule.result_id]).toBeTruthy();
    });
    const actors = [...cookingRules.Recipes.flatMap(rule => rule.actors.flat()), ...cookingRules.SingleRecipes.flatMap(rule => rule.actors)];
    for (const actor of actors) expect(importedIngredients.some(item => item.cooking?.actorId === actor && item.cooking.canCook)).toBe(true);
    expect(importedIngredients.some(item => item.id === 'Obj_KorokNuts')).toBe(false);
    expect(importedIngredients.some(item => item.id.startsWith('Item_Roast'))).toBe(false);
  });
  it.each([
    [['Item_Fruit_A'], 'Item_Cook_B_02'],
    [Array(5).fill('Item_Fruit_A'), 'Item_Cook_B_02'],
    [['Item_Fruit_A', 'Item_Fruit_B', 'Item_Fruit_C', 'Item_Fruit_F'], 'Item_Cook_B_12'],
    [['Item_Mushroom_A', 'Item_Mushroom_B', 'Item_Mushroom_C', 'Item_Mushroom_E'], 'Item_Cook_B_13'],
    [['Item_FishGet_A', 'Item_FishGet_B', 'Item_FishGet_C', 'Item_FishGet_D'], 'Item_Cook_B_15'],
    [['Item_Fruit_A', 'Item_Fruit_B', 'Item_Material_07', 'Item_Material_01'], 'Item_Cook_N_02'],
    [['Item_Fruit_A', 'Item_Fruit_A', 'Item_Material_07', 'Item_Material_01'], 'Item_Cook_B_02'],
    [['Item_FishGet_F', 'Item_FishGet_K', 'Item_Material_03', 'Item_Material_06', 'Item_Ore_H'], 'Item_Cook_N_01'],
    [['Item_Meat_11', 'Item_Material_03', 'Item_Material_02'], 'Item_Cook_J_09'],
    [['Item_Meat_02', 'Item_Material_03', 'Item_Ore_H'], 'Item_Cook_G_06'],
    [['Item_Meat_01'], 'Item_Cook_B_06'],
    [['Item_FishGet_A'], 'Item_Cook_B_05'],
    [['Item_FishGet_K'], 'Item_Cook_B_23'],
    [['Item_Material_03', 'Item_Mushroom_E'], 'Item_Cook_G_04'],
    [['Item_Material_03', 'Item_Material_07'], 'Item_Cook_O_01'],
    [['Item_Material_05'], 'Item_Cook_K_09'],
    [['Item_Material_05', 'Item_Ore_H', 'Item_Mushroom_E', 'Item_PlantGet_A'], 'Item_Cook_K_06'],
    [['Item_Material_05', 'Item_Mushroom_E'], 'Item_Cook_K_09'],
    [['Item_Fruit_J'], 'Item_Cook_B_01'],
    [['Animal_Insect_F'], 'Item_Cook_C_16'],
    [['Animal_Insect_F', 'Obj_FireWoodBundle'], 'Item_Cook_C_16'],
    [['Animal_Insect_F', 'Item_Fruit_A'], 'Item_Cook_B_02'],
    [['Obj_FireWoodBundle', 'Item_Enemy_48'], 'Item_Cook_O_02'],
    [['Animal_Insect_Q'], 'Item_Cook_O_01'],
    [['Animal_Insect_Q', 'Item_Enemy_00'], 'Item_Cook_C_17'],
    [['Animal_Insect_Q', 'Animal_Insect_N', 'Item_Enemy_00'], 'Item_Cook_O_01'],
    [['Item_Fruit_I'], 'Item_Cook_B_21'],
    [['BeeHome'], 'Item_Cook_I_16'],
    [['Item_Material_04'], 'Item_Cook_A_10'],
    [['Item_Fruit_K'], 'Item_Cook_B_22'],
  ])('matches %j to %s', (ids, resultId) => {
    expect(make(ids as string[]).stats.resultId).toBe(resultId);
  });

  it('keeps greedy candidate order instead of backtracking', () => {
    const material = ingredients.find(item => item.id === 'Item_Fruit_A')!.cooking!;
    const groups: MaterialGroup[] = [
      { material: { ...material, actorId: 'A', tags: ['X', 'Y'] }, count: 1 },
      { material: { ...material, actorId: 'B', tags: ['X'] }, count: 1 },
    ];
    const rules: CookingRules = { ...cookingRules, Recipes: [{ order: 0, result_id: 'first', actors: [], tags: [['X'], ['Y']], HB: 0, TB: 0 }], SingleRecipes: [] };
    expect(matchRecipe(groups, rules).section).toBe('fallback');
    expect(matchRecipe([...groups].reverse(), rules).resultId).toBe('first');
  });
  it('counts project aliases as the same actor, without merging distinct source IDs', () => {
    const dish = make(['fish', 'Item_FishGet_A', 'Item_FishGet_B', 'Item_FishGet_C']);
    expect(dish.stats.resultId).not.toBe('Item_Cook_B_15');
    expect(make(['Item_FishGet_A', 'Item_FishGet_B', 'Item_FishGet_C', 'Item_FishGet_D']).stats.resultId).toBe('Item_Cook_B_15');
  });
  it.each(cookingRules.Recipes)('executes regular row $order without sorting its groups', rule => {
    const pool = importedIngredients.map(item => item.cooking!);
    const selected: MaterialGroup[] = [];
    for (const field of ['actors', 'tags'] as const) for (const alternatives of rule[field]) {
      const material = alternatives.flatMap(candidate => pool.filter(item => field === 'actors'
        ? item.actorId === candidate : item.tags.includes(candidate)))
        .find(item => !selected.some(group => group.material.actorId === item.actorId));
      expect(material, `Missing witness for row ${rule.order}`).toBeTruthy();
      selected.push({ material: material!, count: 1 });
    }
    if (selected.length === 1) {
      const extra = pool.find(item => !selected.some(group => group.material.actorId === item.actorId))!;
      selected.push({ material: extra, count: 1 });
    }
    expect(matchRecipe(selected, { ...cookingRules, Recipes: [rule], SingleRecipes: [] }).resultId).toBe(rule.result_id);
  });
  it.each(cookingRules.SingleRecipes)('executes single-main row $order', rule => {
    const material = importedIngredients.map(item => item.cooking!).find(item =>
      (!rule.actors.length || rule.actors.includes(item.actorId)) && (!rule.tags.length || rule.tags.some(tag => item.tags.includes(tag))))!;
    expect(material).toBeTruthy();
    expect(matchRecipe([{ material, count: 5 }], { ...cookingRules, Recipes: [], SingleRecipes: [rule] }).resultId).toBe(rule.result_id);
  });
});

describe('recovery, effects, randomness and prices', () => {
  it('handles the special recovery bonuses and failure branches', () => {
    expect(make(['Item_Material_05']).stats.recoveryHp).toBe(6);
    expect(make(['Animal_Insect_F']).stats).toMatchObject({ recoveryHp: 28, effectId: null, sellPrice: 2 });
    expect(make(['Obj_FireWoodBundle']).stats).toMatchObject({ recoveryHp: 1, sellPrice: 2, critical: false });
    expect(make(['Item_Enemy_00']).stats).toMatchObject({ recoveryHp: 4, sellPrice: 2 });
    expect(make(['Item_Fruit_A', 'Item_Material_06']).stats.recoveryHp).toBe(8);
  });
  it('cancels conflicting effects while ordinary food is neutral', () => {
    expect(make(['Item_Mushroom_L', 'Item_Mushroom_M', 'Item_Mushroom_L']).stats.effectId).toBeNull();
    expect(make(['Item_Mushroom_L', 'Item_Fruit_A']).stats).toMatchObject({ effectId: 'AttackUp', durationSeconds: 80 });
    expect(make(['Animal_Insect_F', 'Animal_Insect_Q']).stats.effectId).toBeNull();
  });
  it.each([
    ['Item_Mushroom_L', 2, 1], ['Item_Mushroom_L', 3, 2], ['Item_Mushroom_L', 4, 3],
    ['Item_Mushroom_J', 2, 1], ['Item_Mushroom_J', 3, 2], ['Item_Mushroom_J', 5, 3],
    ['Item_Mushroom_C', 2, 1], ['Item_Mushroom_C', 3, 2],
    ['Item_Mushroom_H', 1, 1], ['Item_Mushroom_H', 2, 2], ['Item_Mushroom_H', 3, 3],
  ])('uses effect thresholds for %s x %i', (id, count, level) => {
    expect(make(Array(count).fill(id)).stats.effectStrength).toBe(level);
  });
  it('adds monster-part time per portion, spice time once per species, and caps at 1800', () => {
    expect(make(['Animal_Insect_Q', 'Item_Enemy_00', 'Item_Enemy_00']).stats.durationSeconds).toBe(290);
    expect(make(['Item_Mushroom_L', 'Item_Material_05']).stats.durationSeconds).toBe(130);
    expect(make(['Item_Mushroom_L', 'Item_Material_05', 'Item_Material_05']).stats.durationSeconds).toBe(160);
    expect(make(['Item_Mushroom_L', 'Item_Enemy_48']).stats.durationSeconds).toBe(1800);
  });
  it('uses non-timed hearts and stamina units separately', () => {
    expect(make(['Item_PlantGet_C']).stats).toMatchObject({ fullRecovery: true, bonusHearts: 5, durationSeconds: 0 });
    expect(make(['Item_Mushroom_A']).stats).toMatchObject({ staminaRecovery: .2, durationSeconds: 0 });
    expect(make(['Item_PlantGet_Q']).stats).toMatchObject({ bonusStamina: .4, durationSeconds: 0 });
  });
  it('uses float32 pricing, low-price materials, buy caps and fixed failure prices', () => {
    expect(make(['Item_Fruit_A']).hiddenValue).toBe(10);
    expect(make(Array(5).fill('Item_Meat_11')).hiddenValue).toBe(490);
    expect(make(['Item_Ore_J']).hiddenValue).toBe(2);
    expect(make(['Item_Enemy_00']).hiddenValue).toBe(2);
    expect(make(['Animal_Insect_F']).hiddenValue).toBe(2);
  });
  it('injects randomness and grants only one ordinary critical bonus', () => {
    const dish = createDish(['Item_Mushroom_L', 'Item_Enemy_48'], ingredients, cookingRules, { random: () => .99 });
    expect(dish.stats.critical).toBe(true);
    expect(dish.stats.bonus).toBe('strength');
    expect(dish.stats.effectStrength).toBe(2);
    expect(dish.stats.recoveryHp).toBe(19);
    const failed = createDish(['Obj_FireWoodBundle', 'Item_Enemy_48'], ingredients, cookingRules, { alwaysBoost: true, random: () => 0 });
    expect(failed.stats.critical).toBe(false);
  });
  it('uses distinct-species probability rather than portions', () => {
    expect(createDish(Array(5).fill('Item_Fruit_A'), ingredients, cookingRules, { random: () => .1 }).stats.critical).toBe(false);
    expect(createDish(['Item_Fruit_A', 'Item_Fruit_B', 'Item_Fruit_G'], ingredients, cookingRules, { random: () => .1 }).stats.critical).toBe(true);
  });
  it('handles monster extract before spice bonuses and never also rolls normal critical', () => {
    const rolls = [0, 0];
    const dish = createDish(['Item_Mushroom_L', 'Item_Material_08', 'Item_Material_05'], ingredients, cookingRules, { random: () => rolls.shift() ?? 0, alwaysBoost: true });
    expect(dish.stats).toMatchObject({ monsterExtract: true, critical: false, durationSeconds: 110, recoveryHp: 20, effectStrength: 1 });
  });
  it('is seed-reproducible and preserves random state on rejected cooking', () => {
    const a = createDish(['Item_Mushroom_L', 'Item_Fruit_A'], ingredients, cookingRules, { seed: 777 });
    expect(a).toEqual(createDish(['Item_Mushroom_L', 'Item_Fruit_A'], ingredients, cookingRules, { seed: 777 }));
    const session = new GameSession(createInitialState(), ingredients, cookingRules);
    const seed = session.getSnapshot().cookingSeed;
    session.cook(['Item_Meat_11', 'Item_Meat_11']); expect(session.getSnapshot().cookingSeed).toBe(seed);
    session.cook(['potato']); expect(session.getSnapshot().cookingSeed).not.toBe(seed);
  });
});
