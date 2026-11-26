import Image from 'next/image';
import { editionHref } from '../../lib/edition';
import { localizedHref, type PublicLocale } from '../../lib/i18n';
import { sectionText } from './section-copy';

export function RadioYO({ lang, compact = false }: { lang: PublicLocale; compact?: boolean }) {
  const logo = <Image src="/brand/radioyo.png" width={1490} height={278} alt="RadioYO" unoptimized />;
  return compact
    ? <a className="by-radioyo-promo" href={localizedHref(editionHref('radio'),lang) + '#radioyo'}>{logo}<span>{sectionText(lang,'radioBrands')}</span></a>
    : <section className="by-radioyo-panel" id="radioyo" aria-label="RadioYO">{logo}<p>{sectionText(lang,'radioBrandInfo')}</p></section>;
}
