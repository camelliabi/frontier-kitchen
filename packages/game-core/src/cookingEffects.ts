import type { CookingOptions, CookingRules, CookingStats, MaterialGroup } from './cookingTypes';
import { seededRandom } from './cookingTypes';
import type { RecipeMatch } from './recipeMatcher';

const thresholds: Readonly<Record<string, readonly number[]>> = {
  AttackUp: [1, 5, 7], DefenseUp: [1, 5, 7], MovingSpeed: [1, 5, 7],
  Quietness: [1, 6, 9], ResistCold: [1, 6], ResistHot: [1, 6],
  ResistElectric: [1, 4, 6], Fireproof: [1, 7],
};
const staminaTable = [0, .2, .4, .8, 1, 1.4, 1.6, 1.8, 2.2, 2.4, 2.8, 3];
const enduraThresholds = [1, 4, 6, 8, 10, 12, 14, 16, 18, 20];
const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value));

export function calculateCookingStats(groups: readonly MaterialGroup[], match: RecipeMatch, rules: CookingRules, options: CookingOptions = {}): CookingStats {
  const random = options.random ?? seededRandom(options.seed ?? 1);
  const roll = () => {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('Random source must return [0,1)');
    return value;
  };
  const total = groups.reduce((sum, group) => sum + group.count, 0);
  const baseHp = groups.reduce((sum, group) => sum + group.material.hp * group.count, 0);
  const active = groups.filter(group => group.material.effect && group.material.potency > 0);
  const effects = [...new Set(active.map(group => group.material.effect))];
  let effectId: string | null = effects.length === 1 ? effects[0] : null;
  let resultId = match.resultId;
  if (resultId === rules.System.FCA) effectId = null;
  if (resultId === 'Item_Cook_C_17' && !effectId) resultId = rules.System.FA;
  const failed = resultId === rules.System.FA || resultId === 'Item_Cook_O_02';
  const empty: CookingStats = {
    resultId, effectId: null, effectStrength: 0, rawEffectPoints: 0, recoveryHp: 0,
    durationSeconds: 0, fullRecovery: false, bonusHearts: 0, staminaRecovery: 0,
    bonusStamina: 0, critical: false, bonus: 'none', monsterExtract: false, sellPrice: 2,
  };
  if (failed) return { ...empty, recoveryHp: resultId === 'Item_Cook_O_02' ? rules.System.SFALR : Math.max(rules.System.FALR, Math.trunc(baseHp)) };

  const points = effectId ? active.filter(group => group.material.effect === effectId)
    .reduce((sum, group) => sum + group.count * group.material.potency, 0) : 0;
  const config = rules.System.CEI.find(effect => effect.effect_id === effectId);
  const timed = !!effectId && !!thresholds[effectId];
  const maxLevel = effectId && timed ? thresholds[effectId].length : 0;
  let level = timed ? thresholds[effectId!].filter(value => points >= value).length : 0;
  let bonusHearts = effectId === 'LifeMaxUp' ? points / 4 : 0;
  let stamina = effectId === 'GutsRecover' ? staminaTable[Math.min(11, Math.floor(points))] : 0;
  let bonusStamina = effectId === 'ExGutsMaxUp' ? enduraThresholds.filter(value => points >= value).length / 5 : 0;
  const fullRecovery = effectId === 'LifeMaxUp';
  let hp = rules.System.LRMR * baseHp;
  const matchingUnits = effectId ? active.filter(group => group.material.effect === effectId).reduce((sum, group) => sum + group.count, 0) : 0;
  let duration = timed ? 30 * total + (config?.BT ?? 0) * matchingUnits : 0;
  const monsterExtract = groups.some(group => group.material.actorId === rules.System.MEA);
  let critical = false;
  let bonus: CookingStats['bonus'] = 'none';
  const canStrengthen = () => timed ? level < maxLevel : fullRecovery ? bonusHearts < 27
    : effectId === 'GutsRecover' ? stamina < 3 : effectId === 'ExGutsMaxUp' && bonusStamina < 2;
  const strengthen = () => {
    if (timed) level++;
    else if (fullRecovery) bonusHearts++;
    else if (effectId === 'GutsRecover') stamina += .4;
    else if (effectId === 'ExGutsMaxUp') bonusStamina += .4;
  };
  if (monsterExtract) {
    const choices: (() => void)[] = [];
    if (!fullRecovery && (hp > 0 || !effectId)) choices.push(() => { hp += 12; }, () => { hp = 1; });
    if (effectId) {
      if (canStrengthen()) choices.push(strengthen);
      choices.push(() => {
        if (timed) level = config?.Mi ?? 1;
        else if (fullRecovery) bonusHearts = (config?.Mi ?? 4) / 4;
        else if (effectId === 'GutsRecover') stamina = staminaTable[1];
        else if (effectId === 'ExGutsMaxUp') bonusStamina = .2;
      });
    }
    if (choices.length) choices[Math.floor(roll() * choices.length)]();
    if (timed) duration = [60, 600, 1800][Math.floor(roll() * 3)];
  } else {
    const chance = Math.min(100, rules.System.NMSSR[groups.length - 1] + Math.max(0, ...groups.map(group => group.material.boostSuccessRate)));
    critical = !!options.alwaysBoost || roll() * 100 < chance;
    if (critical) {
      const choices: CookingStats['bonus'][] = [];
      if (!fullRecovery && (hp > 0 || !effectId) && hp < 120) choices.push('recovery');
      if (timed && duration < 1800) choices.push('duration');
      if (effectId && canStrengthen()) choices.push('strength');
      if (choices.length) {
        bonus = choices[Math.floor(roll() * choices.length)];
        if (bonus === 'recovery') hp += 12;
        if (bonus === 'duration') duration += rules.System.SSAET;
        if (bonus === 'strength') strengthen();
      }
    }
  }
  // Distinct spice species contribute once; monster parts contribute per portion.
  for (const { material, count } of groups) {
    if (material.tags.includes('CookEnemy')) { if (timed) duration += material.timeBoost * count; }
    else if (material.tags.includes('CookSpice')) {
      hp += material.hpBoost;
      if (timed) duration += material.timeBoost;
    }
  }
  hp = clamp(Math.trunc(hp + match.hpBonus), 120);
  if (!effectId && hp === 0) hp = 1;
  const effectStrength = timed ? clamp(level, maxLevel) : fullRecovery ? Math.floor(clamp(bonusHearts, 27))
    : effectId === 'GutsRecover' ? clamp(stamina, 3) : effectId === 'ExGutsMaxUp' ? clamp(bonusStamina, 2) : 0;
  return { ...empty, resultId, effectId, effectStrength, rawEffectPoints: points,
    recoveryHp: hp, durationSeconds: timed ? Math.trunc(clamp(duration + match.timeBonus, 1800)) : 0,
    fullRecovery, bonusHearts: fullRecovery ? effectStrength : 0,
    staminaRecovery: effectId === 'GutsRecover' ? Number(effectStrength.toFixed(2)) : 0,
    bonusStamina: effectId === 'ExGutsMaxUp' ? Number(effectStrength.toFixed(2)) : 0,
    critical, bonus, monsterExtract,
  };
}
