import { useEffect, useState, useSyncExternalStore } from 'react';
import type { GameSession } from '@frontier/game-core';
import { ingredients } from '@frontier/game-data';
import { LanguageStore } from '../i18n';
import { IngredientIcon } from './IngredientIcon';
import { ingredientName } from './dishText';

const PAGE_SIZE = 20;

export function InventoryPanel({ session, language, close, embedded = false }: {
  session: GameSession; language: LanguageStore; close: () => void; embedded?: boolean;
}) {
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot);
  useSyncExternalStore(language.subscribe, language.getSnapshot);
  const [pageIndex, setPageIndex] = useState(0);
  const t = language.t;
  const owned = ingredients.map(ingredient => ({ ingredient,
    quantity: state.inventory.filter(item => item.ingredientId === ingredient.id).reduce((sum, item) => sum + item.quantity, 0),
  })).filter(item => item.quantity > 0);
  const pageCount = Math.max(1, Math.ceil(owned.length / PAGE_SIZE));
  const page = Math.min(pageIndex, pageCount - 1);
  useEffect(() => { setPageIndex(current => Math.min(current, pageCount - 1)); }, [pageCount]);
  const visible = owned.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return <aside id="inventory" aria-label={t('bag')}>
    {!embedded && <div className="bag-heading"><h2>{t('bagTitle')}</h2><button onClick={close} aria-label={t('close')}>×</button></div>}
    <ul className="inventory-grid">{Array.from({ length: PAGE_SIZE }, (_, slot) => {
      const item = visible[slot];
      if (!item) return <li key={`empty-${slot}`} className="inventory-empty" aria-hidden="true"/>;
      const name = ingredientName(item.ingredient.id, language);
      return <li className="ingredient-card" key={item.ingredient.id} data-ingredient-id={item.ingredient.id} title={name} aria-label={`${name} × ${item.quantity}`}>
        <IngredientIcon id={item.ingredient.id}/><span className="ingredient-name">{name}</span>
        <span className="ingredient-quantity">× {item.quantity}</span>
      </li>;
    })}</ul>
    <nav className="inventory-pagination" aria-label={t('inventoryPages')}>
      <button disabled={page === 0} onClick={() => setPageIndex(page - 1)} aria-label={t('previousPage')}>‹</button>
      <span role="status">{t('inventoryPage').replace('{current}', String(page + 1)).replace('{total}', String(pageCount))}</span>
      <button disabled={page === pageCount - 1} onClick={() => setPageIndex(page + 1)} aria-label={t('nextPage')}>›</button>
    </nav>
  </aside>;
}
