'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Placement, PublicAdPlacements } from '../../lib/ad-placements';
import type { PublicLocale } from '../../lib/i18n';
import { usePublicLocale } from '../language-select';
import { sectionText } from './section-copy';
import './ad-slot.css';

const PlacementsContext = createContext<PublicAdPlacements>({});
export function AdPlacementsProvider({ placements, children }: { placements: PublicAdPlacements; children: ReactNode }) {
  return <PlacementsContext.Provider value={placements}>{children}</PlacementsContext.Provider>;
}

export function AdSlot({ placement, locale }: { placement: Placement; locale?: PublicLocale }) {
  const current = usePublicLocale();
  const lang = locale ?? current;
  const campaign = useContext(PlacementsContext)[placement];
  if (campaign?.mode === 'hidden') return null;
  const label = sectionText(lang,'advert');
  return <aside className="by-ad" aria-label={label} data-ad-slot={placement}>
    <span className="by-ad-disclosure">{label}</span>
    {campaign ? <a className="by-ad-campaign" href={campaign.url} rel="sponsored">
      {campaign.image && <img src={campaign.image} width={900} height={100} alt={campaign.alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" />}
      <span dir="auto">{campaign.name}</span>
    </a> : <div className="by-ad-open">{sectionText(lang,'adAvailable')}</div>}
  </aside>;
}
