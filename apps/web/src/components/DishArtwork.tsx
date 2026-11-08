import type { Dish } from '@frontier/game-core';
import { LanguageStore } from '../i18n';
import { dishName } from './dishText';

/** Original vector illustrations selected by the cooked result; no external game assets. */
export function DishArtwork({ dish, language }: { dish: Dish; language: LanguageStore }) {
  const name = dish.name;
  const bottle = /Elixir|Tonic/.test(name);
  const soup = /Soup|Stew|Chowder|Milk/.test(name);
  const skewer = /Skewer/.test(name);
  const sweet = /Cake|Pie|Tart|Pudding|Crepe|Candy/.test(name);
  const failed = /Dubious|Rock-Hard/.test(name);
  const color = failed ? '#837985' : sweet ? '#dca77b' : soup ? '#e4c992' : '#d5bd80';
  return <svg className="dish-artwork" viewBox="0 0 320 220" role="img" aria-label={`${language.t('dishImage')}: ${dishName(dish, language)}`}>
    <ellipse cx="160" cy="191" rx="106" ry="13" fill="#40543a" opacity=".12"/>
    <circle cx="160" cy="106" r="90" fill="#e6e9d6"/>
    {bottle ? <>
      <path d="M140 42h40v38c0 14 38 34 38 66s-22 43-58 43-58-11-58-43 38-52 38-66z" fill="#dae5d9" stroke="#7f9e8c" strokeWidth="4"/>
      <path d="M111 133h98c11 29-2 47-49 47s-60-18-49-47" fill={dish.stats.effectId ? '#b3a0bc' : '#c2c98c'}/>
      <rect x="134" y="35" width="52" height="17" rx="4" fill="#ab8259"/>
      <path d="M126 139q8-24 20-30" fill="none" stroke="#fff9e8" strokeWidth="6" strokeLinecap="round" opacity=".7"/>
    </> : soup ? <>
      <path d="M64 119q8 74 96 74t96-74" fill="#809b91"/>
      <ellipse cx="160" cy="119" rx="96" ry="38" fill="#eee7d4"/>
      <ellipse cx="160" cy="120" rx="84" ry="29" fill={color}/>
      {[110, 143, 186, 212].map((x, i) => <g key={x}><ellipse cx={x} cy={114 + i % 2 * 12} rx="12" ry="6" fill={i % 2 ? '#97a66c' : '#c6956b'}/><path d={`M${x-4} ${114+i%2*12}l6 -3`} stroke="#f6e8b9" strokeWidth="2"/></g>)}
      <path d="M130 70q-12-15 0-30m32 30q-12-15 0-30m32 30q-12-15 0-30" fill="none" stroke="#b6be9d" strokeWidth="4" strokeLinecap="round"/>
    </> : <>
      <ellipse cx="160" cy="151" rx="111" ry="43" fill="#839c91"/>
      <ellipse cx="160" cy="144" rx="107" ry="39" fill="#f5edda"/>
      <ellipse cx="160" cy="144" rx="87" ry="29" fill="#e6dbc0"/>
      {skewer ? [0, 1].map(row => <g key={row} transform={`translate(0 ${row*28})`}>
        <path d="M90 120l145 13" stroke="#977247" strokeWidth="5" strokeLinecap="round"/>
        {[112, 143, 174, 205].map((x, i) => <rect key={x} x={x-12} y="104" width="27" height="25" rx="7" fill={i%2 ? '#8d9b62' : '#c98d62'} transform={`rotate(7 ${x} 120)`}/>)}</g>)
        : sweet ? <><path d="M103 111h114v48q-58 23-114 0z" fill="#ac7b52"/><ellipse cx="160" cy="109" rx="57" ry="23" fill={color}/><path d="M112 122q48 18 96 0" fill="none" stroke="#f4e4bf" strokeWidth="8"/><circle cx="160" cy="100" r="11" fill="#b77365"/><path d="M160 90q4-15 17-13" fill="none" stroke="#819363" strokeWidth="4"/></>
        : <><path d="M98 145q-4-57 59-64 62 8 64 64-60 31-123 0" fill={color}/>{[116,145,174,199].map((x,i)=><ellipse key={x} cx={x} cy={122+i%2*16} rx="12" ry="7" fill={failed ? '#6a656a' : i%2 ? '#8d9b62' : '#c18b63'}/>)}<path d="M130 101l7 5m25-10 4 6m19 8 6-3" stroke="#f7e9c7" strokeWidth="4" strokeLinecap="round"/></>}
    </>}
  </svg>;
}
