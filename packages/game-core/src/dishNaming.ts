import type { CookingStats } from './cookingTypes';

/** Resolve localized result and effect IDs; names never participate in recipe matching. */
export function resolveDishName(
  stats: Pick<CookingStats, 'resultId' | 'effectId'>,
  names: Readonly<Record<string, string>>,
  effectJoiner = ' ',
): string {
  const base = names[stats.resultId] ?? stats.resultId;
  const prefix = stats.effectId ? names[`effect:${stats.effectId}`] : '';
  return prefix ? `${prefix}${effectJoiner}${base}` : base;
}
