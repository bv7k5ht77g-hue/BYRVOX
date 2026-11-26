'use client';
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { ChevronDown, Languages } from 'lucide-react';
import { isPublicLocale, nativeNames, localeLabels, localizedHref, publicLocales, type PublicLocale } from '../lib/i18n';

const shortName = (code: PublicLocale) => code.split('-')[0].toUpperCase();

const ReadingLocale = createContext<PublicLocale>('fr');
export const usePublicLocale = () => useContext(ReadingLocale);
export function PublicLocaleProvider({locale, children}:{locale:PublicLocale;children:ReactNode}) {
  useEffect(()=>{
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl':'ltr';
  },[locale]);
  return <ReadingLocale.Provider value={locale}><div lang={locale} dir={locale === 'ar' ? 'rtl':'ltr'} style={{display:'contents'}}>{children}</div></ReadingLocale.Provider>;
}
export function LanguageSelect({locale: explicit, hrefForLocale}:{locale?:PublicLocale; hrefForLocale?:(locale: PublicLocale) => string} = {}) {
  const inherited = usePublicLocale();
  const locale = explicit || inherited;
  function change(value:string) {
    if (!isPublicLocale(value)) return;
    document.cookie = 'byrvox-language='+value+'; Path=/; Max-Age=31536000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');
    location.assign(hrefForLocale ? hrefForLocale(value) : localizedHref(location.pathname+location.search+location.hash,value));
  }
  return <label className="byrvox-language" dir={locale === 'ar' ? 'rtl' : 'ltr'} title={nativeNames[locale]}>
    <Languages size={17} aria-hidden="true" />
    <select aria-label={localeLabels[locale].language} value={locale} onChange={e=>change(e.target.value)}>
      {publicLocales.map(code=><option key={code} value={code} aria-label={nativeNames[code]}>{shortName(code)}</option>)}
    </select>
    <ChevronDown className="byrvox-language-chevron" size={13} aria-hidden="true" />
  </label>;
}
