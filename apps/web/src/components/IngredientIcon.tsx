import type { ReactNode } from 'react';
import type { ingredients } from '@frontier/game-data';
type IngredientId = typeof ingredients[number]['id'];
const drawings: Record<string, ReactNode> = {
 mushroom: <><path fill="#e6d6b8" d="M27 33h12l4 20H23z"/><path fill="#b98265" d="M10 34C10 7 54 7 54 34c-10 5-34 5-44 0"/><circle fill="#eedec4" cx="24" cy="24" r="3"/><circle fill="#eedec4" cx="42" cy="28" r="4"/></>,
 potato: <><ellipse fill="#c7a477" cx="32" cy="34" rx="24" ry="20" transform="rotate(-20 32 34)"/><path d="m22 26 2 2m16-6 2 2m-9 16 2 2m-16-4 2 1" stroke="#9f7d59" strokeWidth="3" strokeLinecap="round"/></>,
 carrot: <><path fill="#dca465" d="M22 23c5-6 17-2 20 4 3 8-22 29-27 29-2-5 2-26 7-33"/><path d="m30 22-1-12m4 13 9-13m-8 14 14-5" stroke="#8eac79" strokeWidth="5" strokeLinecap="round"/></>,
 fish: <><path fill="#8ba5ad" d="m43 31 14-13v28L43 35"/><path fill="#a9c2c5" d="M7 32c11-20 32-20 43 0-11 20-32 20-43 0"/><circle fill="#435c58" cx="18" cy="29" r="2"/><path d="M26 23q7 9 0 18" fill="none" stroke="#78979c" strokeWidth="2"/></>,
 milk: <><path fill="#f0ead6" d="m22 17 7-9h14l5 9v37H18V23z"/><path fill="#8caa9c" d="M22 17h26v8H18v-2z"/><path fill="#c3d4cb" d="M40 25h8v29h-8z"/><path fill="#b6ccd1" d="M23 32h12v14H23z"/></>,
 radish: <><path d="m31 23-8-12m10 12 2-15m0 16 12-11" stroke="#8eac79" strokeWidth="5" strokeLinecap="round"/><path fill="#f0e8d4" d="M18 29c1-13 27-13 28 0 2 17-13 20-14 27-7-5-16-15-14-27"/><path fill="#c4928b" d="M18 30c0-14 28-14 28 0-9 4-19 4-28 0"/></>,
 tomato: <><ellipse fill="#c98672" cx="32" cy="36" rx="23" ry="20"/><path fill="#7e9b76" d="m32 25-13-7 11 1 3-9 3 10 12-2-11 8z"/></>,
 cabbage: <><circle fill="#a9bb8c" cx="32" cy="33" r="23"/><path d="M30 54C8 48 9 24 19 20c-1 12 9 14 13 27M35 54c20-8 20-26 11-34 0 13-11 15-13 26M23 15q9 5 9 22m9-22q-9 5-9 22" fill="none" stroke="#7e9b76" strokeWidth="3" strokeLinecap="round"/></>,
 pumpkin: <><path d="m32 19 3-11 7 1" fill="none" stroke="#7c916d" strokeWidth="5" strokeLinecap="round"/><ellipse fill="#ce9a60" cx="32" cy="36" rx="25" ry="19"/><ellipse fill="#dfb175" cx="32" cy="36" rx="15" ry="19"/><ellipse fill="#e5bc85" cx="32" cy="36" rx="6" ry="19"/></>,
};
export function IngredientIcon({ id }: { id: IngredientId }) {
 return <svg className="ingredient-icon" viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="56" rx="21" ry="3" fill="#435c58" opacity=".09"/>{drawings[id] ?? <><path fill="#b7bd91" d="M18 24h28l5 29H13z"/><path fill="#8b9873" d="M22 15h20v12H22z"/><circle fill="#eeead4" cx="32" cy="39" r="8"/></>}</svg>;
}
