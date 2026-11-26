import { Newspaper } from 'lucide-react';
import { localizedHref } from '../../../lib/i18n';
import { resolvePublicLocale } from '../../../lib/public-locale';
import { readerLabels } from '../reader-labels';
import '../reader.css';

export default async function ArticleNotFound() {
  const locale = await resolvePublicLocale({});
  const copy = readerLabels(locale);
  return <main className="reader-main reader-heading" lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <h1>{copy.missing}</h1>
    <p className="reader-deck">{copy.missingDetail}</p>
    <a href={localizedHref('/?rubrique=actualites',locale)} className="reader-back">
      <Newspaper size={16} aria-hidden="true"/> {copy.browse}
    </a>
  </main>;
}
