export type Locale = 'zh-CN' | 'en';
import { en, type MessageKey } from './i18n/en';
import { zhCN } from './i18n/zh-CN';
export type { MessageKey } from './i18n/en';
export const messages: Record<Locale, Record<MessageKey,string>> = { en, 'zh-CN': zhCN };
export class LanguageStore {
 private locale: Locale;
 private listeners = new Set<() => void>();
 constructor(initial: Locale = 'en') { this.locale = initial; }
 getSnapshot = (): Locale => this.locale;
 subscribe = (listener: () => void): (() => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
 t = (key: MessageKey): string => messages[this.locale][key];
 setLocale = (locale: Locale): void => { if(locale === this.locale) return; this.locale = locale; this.listeners.forEach(listener => listener()); };
}
export function readSavedLocale(): Locale {
 try { return localStorage.getItem('frontier-kitchen.locale') === 'zh-CN' ? 'zh-CN' : 'en'; } catch { return 'en'; }
}
export function localizedTime(minutes:number, locale:Locale):string {
 const total=Math.max(0,Math.floor(minutes)), day=Math.floor(total/1440)+1;
 const clock=`${String(Math.floor(total%1440/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
 return messages[locale].dayTime.replace('{day}', String(day)).replace('{clock}', clock);
}

