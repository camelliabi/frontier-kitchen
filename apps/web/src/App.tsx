import { useEffect, useState, useSyncExternalStore } from 'react';
import { LanguageStore, localizedTime, type Locale } from './i18n';
import { type GameSession } from '@frontier/game-core';
import { village, kitchen } from '@frontier/game-data';
import { InventoryPanel } from './components/InventoryPanel';
import { GameCanvas } from './components/GameCanvas';
import { KitchenWorkbench } from './components/KitchenWorkbench';
import { Modal } from './components/Modal';

export function App({ session, language }: { session: GameSession; language: LanguageStore }) {
  const locale = useSyncExternalStore(language.subscribe, language.getSnapshot);
  const t = language.t;
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t('title');
    try { localStorage.setItem('frontier-kitchen.locale', locale); } catch { /* Optional preference storage. */ }
  }, [locale, t]);
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const [panel, setPanel] = useState<'inventory' | 'cook' | 'menu' | null>(null);
  const bagOpen = panel === 'inventory';
  const indoors = state.player.sceneId === kitchen.id;
  const destination = indoors ? village : kitchen;
  return <main className="game-app">
    <header><div className="brand"><span className="brand-mark" aria-hidden="true">{t('brandMark')}</span><div><h1>{t('title')}</h1></div></div>
      <div className="hud"><span><small>{t('time')}</small>{localizedTime(state.worldTime, locale)}</span><span><small>{t('coins')}</small><b className="coin">●</b> {state.money}</span><button aria-expanded={bagOpen} aria-controls="inventory" onClick={() => setPanel('inventory')}>{t('bag')} <span>{state.inventory.reduce((total, item) => total + item.quantity, 0)}</span></button><select aria-label={t('language')} value={locale} onChange={event => language.setLocale(event.target.value as Locale)}><option value="zh-CN">{t('chinese')}</option><option value="en">{t('english')}</option></select></div>
    </header>
    <section className={'world' + (indoors ? ' kitchen-world' : '')} aria-label={t('view')}><GameCanvas session={session} language={language}/><div className="location"><span>●</span> {t(indoors ? 'kitchen' : 'village')}<small>{t(indoors ? 'indoors' : 'weather')}</small></div><div className="scene-note">{indoors && <><button className="travel-button" onClick={() => setPanel('cook')}>{t('openStove')}</button><button className="travel-button" onClick={() => setPanel('menu')}>{t('menuTitle')}</button></>}<button className="travel-button" onClick={() => session.setPlayerPosition(destination.id, destination.spawn.x, destination.spawn.y)}>{t(indoors ? 'outside' : 'inside')}</button></div>
    </section>
    {bagOpen && <Modal title={t('bagTitle')} closeLabel={t('closeWindow')} close={() => setPanel(null)} className="inventory-modal"><InventoryPanel session={session} language={language} close={() => setPanel(null)} embedded/></Modal>}
    {indoors && (panel === 'cook' || panel === 'menu') && <Modal title={t('kitchen')} closeLabel={t('closeWindow')} close={() => setPanel(null)} className="workbench-modal"><KitchenWorkbench session={session} language={language} initialTab={panel}/></Modal>}
  </main>;
}




