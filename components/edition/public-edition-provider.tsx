import type { ReactNode } from 'react';
import { getPublicAdConfiguration, getReservedArticlePlacements } from '../../lib/ad-placement-store';
import type { PublicLocale } from '../../lib/i18n';
import { PublicLocaleProvider } from '../language-select';
import { AdPlacementsProvider } from './ad-slot';

export async function PublicEditionProvider({ locale, children, allowThirdParty = true, adsEnabled = true, reserveArticleSpaces = false }: {
  locale: PublicLocale; children: ReactNode; allowThirdParty?: boolean; adsEnabled?: boolean; reserveArticleSpaces?: boolean;
}) {
  const { placements, client } = adsEnabled
    ? await getPublicAdConfiguration(allowThirdParty).catch(() => ({ placements: {}, client: '' }))
    : { placements: reserveArticleSpaces ? await getReservedArticlePlacements().catch(() => null) : null, client: '' };
  return <PublicLocaleProvider locale={locale}>
    {client && <script async crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`} />}
    <AdPlacementsProvider placements={placements}>{children}</AdPlacementsProvider>
  </PublicLocaleProvider>;
}
