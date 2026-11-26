'use client';
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { Languages } from 'lucide-react';
import { isPublicLocale, nativeNames, localeLabels, localizedHref, publicLocales, type PublicLocale } from '../lib/i18n';

const ReadingLocale = createContext<PublicLocale>('fr');
export const usePublicLocale = () => useContext(ReadingLocale);
export function PublicLocaleProvider({locale, children}:{locale:PublicLocale;children:ReactNode}) {
  useEffect(()=>{
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl':'ltr';
  },[locale]);
  return <ReadingLocale.Provider value={locale}><div lang={locale} dir={locale === 'ar' ? 'rtl':'ltr'} style={{display:'contents'}}>{children}</div></ReadingLocale.Provider>;
}
export function LanguageSelect({locale: explicit}:{locale?:PublicLocale} = {}) {
  const inherited = usePublicLocale();
  const locale = explicit || inherited;
  function change(value:string) {
    if (!isPublicLocale(value)) return;
    document.cookie = 'byrvox-language='+value+'; Path=/; Max-Age=31536000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');
    location.assign(localizedHref(location.pathname+location.search+location.hash,value));
  }
  return <label className="byrvox-language" data-short={locale === 'zh-CN' ? '中文' : locale.toUpperCase()}><Languages size={17} aria-hidden="true" /><select aria-label={localeLabels[locale].language} value={locale} onChange={e=>change(e.target.value)}>{publicLocales.map(code=><option key={code} value={code} lang={code} dir={code==='ar'?'rtl':'ltr'}>{nativeNames[code]}</option>)}</select></label>;
}
