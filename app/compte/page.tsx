import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { clerkConfiguration } from '../../lib/reader-clerk';
import { legacyBookmarksUrl, readerAccountUrl, readerReturnPath, readerText, type ReaderMode } from '../../lib/reader-links';
import { resolvePublicLocale } from '../../lib/public-locale';
import { localizedHref } from '../../lib/i18n';
import { NEW_SITE_ORIGIN } from '../../lib/site-url';
import { ArrowLeft } from 'lucide-react';
import { AccountControls, ClerkReader } from './reader';
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
    <div className="reader-account-controls"><AccountControls lang={lang} mode={mode} returnTo={returnTo}/></div>
    <div className="reader-account-content">
      <span className="brand edition-brand" role="img" aria-label="BYRVOX"><span className="brand-mark" aria-hidden="true"/></span>
      <section className="reader-account-form" aria-label={readerText(lang,mode)}>
        <ClerkReader publishableKey={config?.publishableKey || ''} issuer={config?.issuer || ''} mode={mode} returnTo={returnTo} lang={lang}/>
      </section>
      {mode === 'connexion' && <a className="reader-account-legacy" href={legacyBookmarksUrl(lang)}>{readerText(lang,'legacy')}</a>}
      <a className="reader-account-back" href={returnTo}><ArrowLeft size={16} aria-hidden="true"/>{readerText(lang,'back')}</a>
    </div>
  </main>;
}
