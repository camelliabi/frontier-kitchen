import { useState, useSyncExternalStore } from 'react';
import type { ActionResult, GameSession } from '@frontier/game-core';
import { LanguageStore } from '../i18n';
import { KitchenPanel } from './KitchenPanel';
import { MenuPanel } from './MenuPanel';
import { dishName } from './dishText';
import { Modal } from './Modal';
import { DishArtwork } from './DishArtwork';
import { DishDetails } from './DishDetails';

export function KitchenWorkbench({ session, language, initialTab = 'cook' }: { session: GameSession; language: LanguageStore; initialTab?: 'cook' | 'menu' }) {
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot);
  useSyncExternalStore(language.subscribe, language.getSnapshot);
  const t = language.t;
  const [tab, setTab] = useState<'cook' | 'menu'>(initialTab);
  const [notice, setNotice] = useState<ActionResult | null>(null);
  const [completedId, setCompletedId] = useState<string | null>(null);
  const completed = state.dishes.find(item => item.id === completedId);
  const report = (result: ActionResult) => {
    setNotice(result);
    if (result.ok && result.code === 'cooked') setCompletedId(result.dishId);
  };
  const dish = notice?.ok ? state.dishes.find(item => item.id === notice.dishId) : undefined;
  return <section id="workbench" className="workbench" aria-label={t('cooking')}>
    <nav aria-label={t('kitchen')}>
      <button aria-pressed={tab === 'cook'} onClick={() => setTab('cook')}>{t('cooking')}</button>
      <button aria-pressed={tab === 'menu'} onClick={() => setTab('menu')}>{t('menuTitle')} <span>{state.menu.length}</span></button>
    </nav>
    <p className="session-note">{t('sessionOnly')}</p>
    <div className={'action-notice' + (notice && !notice.ok ? ' error' : '')} role="status" aria-live="polite">
      {notice && <>{t(notice.code)}{dish && <> · {dishName(dish, language)}</>}{notice.ok && notice.income !== undefined && <> · +{notice.income} {t('coins')}</>}</>}
    </div>
    {tab === 'cook' ? <KitchenPanel session={session} language={language} report={report}/> : <MenuPanel session={session} language={language} report={report}/>}
    {completed && <Modal title={t('cookingSuccess')} closeLabel={t('closeWindow')} close={() => setCompletedId(null)} className="result-modal">
      <DishArtwork dish={completed} language={language}/>
      <h3 className="result-dish-name">{dishName(completed, language)}</h3>
      <p className="result-quantity">× 1</p>
      <DishDetails dish={completed} language={language}/>
      <div className="result-actions"><button disabled={state.menu.some(item => item.dishId === completed.id)} onClick={() => report(session.addDishToMenu(completed.id))}>{t(state.menu.some(item => item.dishId === completed.id) ? 'onMenu' : 'addToMenu')}</button>
        <button className="primary" onClick={() => setCompletedId(null)}>{t('continueCooking')}</button></div>
    </Modal>}
  </section>;
}
