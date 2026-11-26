import Image from 'next/image';
import { ArrowRight, Radio } from 'lucide-react';
import { editionHref } from '../../lib/edition';
import { localizedHref, type PublicLocale } from '../../lib/i18n';
import { sectionText } from './section-copy';
import './radioyo.css';

export function RadioYO({ lang, compact = false }: { lang: PublicLocale; compact?: boolean }) {
  const hub = localizedHref(editionHref('radio'), lang);
  const logo = <Image src="/brand/radioyo.png" width={1490} height={278} alt="RadioYO" unoptimized />;
  const arrow = <ArrowRight size={19} aria-hidden="true" className="by-direction-arrow" />;
  return <section className="by-radio-studio" aria-label="RadioYO · BYRVOX Radio">
    <div className="by-radio-studio-copy">
      <div className="by-radio-station" id={compact ? undefined : 'radioyo'}>
        <h2>{compact
          ? <a href={hub + '#radioyo'}>{logo}{arrow}</a>
          : logo}</h2>
        <p>{sectionText(lang, 'radioyoIntro')}</p>
      </div>
      <div className="by-radio-station">
        <h2><a href={compact ? hub : localizedHref('/article/radio', lang)}>
          <span className="by-radio-station-wordmark" dir="ltr"><Radio size={26} aria-hidden="true" />BYRVOX Radio</span>
          {arrow}
        </a></h2>
        <p>{sectionText(lang, 'radioChannel')} · {sectionText(lang, 'upcoming')}</p>
      </div>
    </div>
    <picture className="by-radio-studio-art">
      <source media="(max-width: 680px)" srcSet="/media/collection-2026/radio-studio-680.webp" />
      <img src="/media/collection-2026/radio-studio.webp" alt={sectionText(lang, 'radioStudioAlt')} width={1240} height={827} loading="lazy" decoding="async" />
    </picture>
  </section>;
}
