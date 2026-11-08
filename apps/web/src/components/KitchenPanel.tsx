import { useEffect, useState, useSyncExternalStore } from 'react';
import type { ActionResult, GameSession } from '@frontier/game-core';
import { ingredients } from '@frontier/game-data';
import { LanguageStore } from '../i18n';
import { IngredientIcon } from './IngredientIcon';
import { dishName, ingredientName } from './dishText';
import { DishDetails } from './DishDetails';

export function KitchenPanel({ session, language, report }: {
  session: GameSession; language: LanguageStore; report: (result: ActionResult) => void;
}) {
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const [selected, setSelected] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const t = language.t;
  const owned = ingredients.map(ingredient => ({ ingredient,
    quantity: state.inventory.filter(item => item.ingredientId === ingredient.id).reduce((sum, item) => sum + item.quantity, 0),
  })).filter(item => item.quantity > 0);
  const pageCount = Math.max(1, Math.ceil(owned.length / 20));
  const page = Math.min(pageIndex, pageCount - 1);
  useEffect(() => { setPageIndex(current => Math.min(current, pageCount - 1)); }, [pageCount]);
  const visible = owned.slice(page * 20, (page + 1) * 20);
  const cook = () => {
    const result = session.cook(selected);
    report(result);
    if (result.ok) setSelected([]);
  };
  return <>
    <p>{t('cookingHint')}</p>
    <div className="cooking-layout">
      <div><h2>{t('availableIngredients')}</h2>
        <ul className="ingredient-picker">{Array.from({ length: 20 }, (_, slot) => {
          const item = visible[slot];
          if (!item) return <li key={`empty-${slot}`} className="picker-empty" aria-hidden="true"/>;
          const { ingredient, quantity } = item;
          const used = selected.filter(id => id === ingredient.id).length;
          const name = ingredientName(ingredient.id, language);
          return <li key={ingredient.id} data-ingredient-id={ingredient.id}><button className="ingredient-select" title={name} aria-label={`${t('add')} ${name}`} disabled={selected.length >= 5 || used >= quantity} onClick={() => setSelected([...selected, ingredient.id])}><IngredientIcon id={ingredient.id}/><span>{name}</span><small>× {quantity - used}</small></button></li>;
        })}</ul>
        <nav className="inventory-pagination picker-pagination" aria-label={t('inventoryPages')}>
          <button disabled={page === 0} onClick={() => setPageIndex(page - 1)} aria-label={t('previousPage')}>‹</button>
          <span>{t('inventoryPage').replace('{current}', String(page + 1)).replace('{total}', String(pageCount))}</span>
          <button disabled={page === pageCount - 1} onClick={() => setPageIndex(page + 1)} aria-label={t('nextPage')}>›</button>
        </nav>
      </div>
      <div className="pot-panel"><h2>{t('pot')} <span>{selected.length}/5</span></h2><p className="method-label">{t('boil')}</p>
        {selected.length === 0 ? <p className="empty-state">{t('emptyPot')}</p> : <ul className="pot-items">{selected.map((id, index) => {
          const ingredient = ingredients.find(item => item.id === id)!;
          return <li key={`${id}-${index}`}><IngredientIcon id={ingredient.id}/><span>{ingredientName(ingredient.id, language)}</span><button aria-label={`${t('remove')} ${ingredientName(ingredient.id, language)}`} onClick={() => setSelected(selected.filter((_, i) => i !== index))}>×</button></li>;
        })}</ul>}
        <div className="cooking-actions"><button disabled={!selected.length} onClick={() => setSelected([])}>{t('clearPot')}</button><button className="primary" disabled={!selected.length} onClick={cook}>{t('cook')}</button></div>
      </div>
    </div>
    <h2 className="section-heading">{t('cookedDishes')}</h2>
    {!state.dishes.length && <p className="empty-state">{t('emptyDishes')}</p>}
    <div className="dish-grid">{state.dishes.map(dish => {
      const quantity = state.cookedInventory.find(item => item.dishId === dish.id)?.quantity ?? 0;
      const onMenu = state.menu.some(item => item.dishId === dish.id);
      return <article className="dish-card" key={dish.id}><h3>{dishName(dish, language)}</h3>
        <DishDetails dish={dish} language={language}/>
        <p className="recipe-line">{t('boil')} · {dish.ingredients.map(item => `${ingredientName(item.ingredientId, language)} ×${item.quantity}`).join(', ')}</p><p>{t('stock')}: {quantity}</p>
        <button disabled={onMenu} onClick={() => report(session.addDishToMenu(dish.id))}>{t(onMenu ? 'onMenu' : 'addToMenu')}</button></article>;
    })}</div>
  </>;
}

