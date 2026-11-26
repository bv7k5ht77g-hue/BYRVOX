import type { ReactNode } from 'react';
import { getPublicAdPlacements } from '../../lib/ad-placement-store';
import type { PublicLocale } from '../../lib/i18n';
import { PublicLocaleProvider } from '../language-select';
import { AdPlacementsProvider } from './ad-slot';

export async function PublicEditionProvider({ locale, children }: { locale: PublicLocale; children: ReactNode }) {
  const placements = await getPublicAdPlacements().catch(() => ({}));
  return <PublicLocaleProvider locale={locale}>
    <AdPlacementsProvider placements={placements}>{children}</AdPlacementsProvider>
  </PublicLocaleProvider>;
}
