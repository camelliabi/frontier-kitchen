import type { CookingRules, MaterialGroup, RegularRule, SingleRule } from './cookingTypes';

export interface RecipeMatch { readonly resultId: string; readonly hpBonus: number; readonly timeBonus: number; readonly section: 'regular' | 'single' | 'fallback'; readonly order: number }
const matched = (rule: RegularRule | SingleRule, section: 'regular' | 'single'): RecipeMatch => ({
  resultId: rule.result_id, hpBonus: rule.HB, timeBonus: rule.TB, section, order: rule.order,
});

/** Deliberately greedy: preserve both candidate order and first-appearance material order. */
export function matchRecipe(groups: readonly MaterialGroup[], rules: CookingRules): RecipeMatch {
  if (groups.length > 1) {
    for (const rule of rules.Recipes) {
      const used = new Set<number>();
      let valid = true;
      for (const field of ['actors', 'tags'] as const) {
        for (const alternatives of rule[field]) {
          let found = -1;
          for (const candidate of alternatives) {
            found = groups.findIndex((group, index) => !used.has(index) && (field === 'actors'
              ? group.material.actorId === candidate : group.material.tags.includes(candidate)));
            if (found >= 0) break;
          }
          if (found < 0) { valid = false; break; }
          used.add(found);
        }
        if (!valid) break;
      }
      if (valid) return matched(rule, 'regular');
    }
  }
  const main = groups.length === 1 ? groups : groups.filter(group => !group.material.tags.includes('CookSpice'));
  if (main.length === 1) {
    const material = main[0].material;
    for (const rule of rules.SingleRecipes) {
      if (groups.length < rule.Num) continue;
      if (rule.actors.length && !rule.actors.includes(material.actorId)) continue;
      if (rule.tags.length && !rule.tags.some(tag => material.tags.includes(tag))) continue;
      return matched(rule, 'single');
    }
  }
  return { resultId: rules.System.FA, hpBonus: 0, timeBonus: 0, section: 'fallback', order: -1 };
}
