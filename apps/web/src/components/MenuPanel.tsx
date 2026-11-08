import { useState, useSyncExternalStore } from 'react';
import type { ActionResult, Dish, GameSession, MenuItem } from '@frontier/game-core';
import { LanguageStore } from '../i18n';
import { dishName, ingredientName } from './dishText';
import { DishDetails } from './DishDetails';

function MenuRow({ item, dish, quantity, session, language, report }: {
  item: MenuItem; dish: Dish; quantity: number; session: GameSession; language: LanguageStore; report: (result: ActionResult) => void;
}) {
  const [forSale, setForSale] = useState(item.isForSale);
  const [price, setPrice] = useState(item.price?.toString() ?? '');
  const t = language.t;
  return <article className="dish-card menu-card">
    <h3>{dishName(dish, language)}</h3>
    <DishDetails dish={dish} language={language}/>
    <p className="recipe-line">{t('boil')} · {dish.ingredients.map(ingredient => `${ingredientName(ingredient.ingredientId, language)} ×${ingredient.quantity}`).join(', ')}</p>
    <p>{t('stock')}: {quantity} · {t(!item.isForSale ? 'offSale' : quantity > 0 ? 'forSale' : 'soldOutLabel')}</p>
    <div className="menu-fields"><label>{t('forSale')}<select value={forSale ? 'yes' : 'no'} onChange={event => setForSale(event.target.value === 'yes')}><option value="no">{t('no')}</option><option value="yes">{t('yes')}</option></select></label>
      <label>{t('price')}<input type="number" min="1" step="1" inputMode="numeric" value={price} onChange={event => setPrice(event.target.value)}/></label></div>
    <button onClick={() => report(session.updateMenuItem(item.dishId, forSale, price.trim() === '' ? null : Number(price)))}>{t('saveMenu')}</button>
    <p>{t('savedPrice')}: {item.price ?? '—'}</p>
    <button className="primary" disabled={!item.isForSale || quantity <= 0 || item.price === null} onClick={() => report(session.sellDish(item.dishId))}>{t('testPurchase')}</button>
  </article>;
}

export function MenuPanel({ session, language, report }: {
  session: GameSession; language: LanguageStore; report: (result: ActionResult) => void;
}) {
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const t = language.t;
  return <><h2>{t('recordedRecipes')}: {state.recipes.length}</h2><p>{t('testCustomerHint')}</p>
    {!state.menu.length && <p className="empty-state">{t('emptyMenu')}</p>}
    <div className="dish-grid">{state.menu.map(item => {
      const dish = state.dishes.find(dish => dish.id === item.dishId)!;
      const quantity = state.cookedInventory.find(stack => stack.dishId === item.dishId)?.quantity ?? 0;
      return <MenuRow key={item.dishId} item={item} dish={dish} quantity={quantity} session={session} language={language} report={report}/>;
    })}</div>
  </>;
}
