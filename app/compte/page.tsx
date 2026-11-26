import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { clerkConfiguration } from '../../lib/reader-clerk';
import { legacyBookmarksUrl, readerAccountUrl, readerReturnPath, readerText, type ReaderMode } from '../../lib/reader-links';
import { resolvePublicLocale } from '../../lib/public-locale';
import { localizedHref } from '../../lib/i18n';
import { NEW_SITE_ORIGIN } from '../../lib/site-url';
import { ClerkReader } from './reader';
import './reader.css';

export const dynamic = 'force-dynamic';
export const metadata = {title:'Compte lecteur · BYRVOX',robots:{index:false,follow:false}};

export default async function ReaderAccount({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const params = await searchParams;
  const lang = await resolvePublicLocale(params);
  const mode:ReaderMode = params.mode === 'inscription' || params.mode === 'sortie' ? params.mode : 'connexion';
  const returnTo = localizedHref(readerReturnPath(params.return_to),lang);
  const host = (await headers()).get('host');
  if (host !== new URL(NEW_SITE_ORIGIN).host) redirect(readerAccountUrl(mode,returnTo,lang));
  const config = clerkConfiguration();
  return <main className="reader-account" lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
    <a className="reader-wordmark" href={localizedHref('/',lang)}>BYRVOX</a>
    <section aria-labelledby="account-title">
      <h1 id="account-title">{readerText(lang,mode)}</h1>
      <ClerkReader publishableKey={config?.publishableKey || ''} issuer={config?.issuer || ''} mode={mode} returnTo={returnTo} lang={lang}/>
      {mode === 'connexion' && <p><a href={legacyBookmarksUrl(lang)}>{readerText(lang,'legacy')}</a></p>}
    </section>
    <a href={returnTo}>{readerText(lang,'back')}</a>
  </main>;
}
