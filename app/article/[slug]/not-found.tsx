import { Newspaper } from 'lucide-react';
import { localizedHref, preferredLocale } from '../../../lib/i18n';
import { headers } from 'next/headers';
import { readerLabels } from '../reader-labels';
import '../reader.css';

export default async function ArticleNotFound() {
  const locale = preferredLocale((await headers()).get('x-byrvox-language'), undefined);
  const copy = readerLabels(locale);
  return <main className="reader-main reader-heading" lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <h1>{copy.missing}</h1>
    <p className="reader-deck">{copy.missingDetail}</p>
    <a href={localizedHref('/?rubrique=actualites',locale)} className="reader-back">
      <Newspaper size={16} aria-hidden="true"/> {copy.browse}
    </a>
  </main>;
}
