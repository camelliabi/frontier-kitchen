import type { Dish } from '@frontier/game-core';
import { LanguageStore } from '../i18n';
import { effectName } from './dishText';

export function DishDetails({ dish, language }: { dish: Dish; language: LanguageStore }) {
  const s = dish.stats;
  const t = language.t;
  return <div className="dish-stats">
    <span>{t('recovery')}: {s.fullRecovery ? t('fullRecovery') : `${s.recoveryHp / 4} ♥`}</span>
    {s.bonusHearts > 0 && <span>{t('bonusHearts')}: +{s.bonusHearts} ♥</span>}
    {s.staminaRecovery > 0 && <span>{t('staminaRecovery')}: {s.staminaRecovery}</span>}
    {s.bonusStamina > 0 && <span>{t('bonusStamina')}: +{s.bonusStamina}</span>}
    {s.effectId && s.durationSeconds > 0 && <span>{effectName(s.effectId, language)} · {t('effectLevel')} {s.effectStrength} · {Math.floor(s.durationSeconds / 60)}:{String(s.durationSeconds % 60).padStart(2, '0')}</span>}
    {s.critical && <span>{t('criticalCooking')}</span>}
  </div>;
}
