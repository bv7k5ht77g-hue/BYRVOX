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
type Params = {searchParams:Promise<Record<string,string|string[]|undefined>>};
const accountMode = (mode:unknown):ReaderMode => mode === 'inscription' || mode === 'sortie' ? mode : 'connexion';

export async function generateMetadata({searchParams}:Params) {
  const params = await searchParams;
  return {title:readerText(await resolvePublicLocale(params), accountMode(params.mode)), robots:{index:false,follow:false}};
}

export default async function ReaderAccount({searchParams}:Params) {
  const params = await searchParams;
  const lang = await resolvePublicLocale(params);
  const mode = accountMode(params.mode);
  const returnTo = localizedHref(readerReturnPath(params.return_to),lang);
  const host = (await headers()).get('host');
  if (host !== new URL(NEW_SITE_ORIGIN).host) redirect(readerAccountUrl(mode,returnTo,lang));
  const config = clerkConfiguration();
  return <main className="reader-account" lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
    <a className="brand edition-brand" href={localizedHref('/',lang)} aria-label="BYRVOX"><span className="brand-mark" aria-hidden="true"/></a>
    <section aria-labelledby="account-title">
      <h1 id="account-title">{readerText(lang,mode)}</h1>
      <ClerkReader publishableKey={config?.publishableKey || ''} issuer={config?.issuer || ''} mode={mode} returnTo={returnTo} lang={lang}/>
      {mode === 'connexion' && <p><a href={legacyBookmarksUrl(lang)}>{readerText(lang,'legacy')}</a></p>}
    </section>
    <a href={returnTo}>{readerText(lang,'back')}</a>
  </main>;
}
