'use client';

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import type { Placement, PublicAdPlacements } from '../../lib/ad-placements';
import type { PublicLocale } from '../../lib/i18n';
import { usePublicLocale } from '../language-select';
import { AdFrame } from './ad-frame';
import { sectionText } from './section-copy';
import './ad-slot.css';

const PlacementsContext = createContext<PublicAdPlacements>({});
export function AdPlacementsProvider({ placements, children }: { placements: PublicAdPlacements; children: ReactNode }) {
  return <PlacementsContext.Provider value={placements}>{children}</PlacementsContext.Provider>;
}

function AdSenseUnit({ client, slot }: { client: string; slot: string }) {
  const element = useRef<HTMLModElement>(null);
  const requested = useRef(false);
  useEffect(() => {
    const unit = element.current;
    if (!unit) return;

    function requestAd() {
      if (!unit || requested.current || unit.hasAttribute('data-adsbygoogle-status') || !unit.clientWidth) return;
      // Google consumes one push per unit. React can run effects more than once.
      requested.current = true;
      const host = window as Window & { adsbygoogle?: { push(config: Record<string, never>): unknown } };
      try {
        if (!host.adsbygoogle) host.adsbygoogle = [];
        host.adsbygoogle.push({});
      } catch {
        // A blocked or unavailable ad must leave the article usable.
      }
    }
    requestAd();
    if (requested.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      requestAd();
      if (requested.current) observer.disconnect();
    });
    observer.observe(unit);
    return () => observer.disconnect();
  }, []);
  return <ins ref={element} className="adsbygoogle" style={{ display: 'block' }} data-ad-client={client}
    data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />;
}

export function AdSlot({ placement, locale }: { placement: Placement; locale?: PublicLocale }) {
  const current = usePublicLocale();
  const lang = locale ?? current;
  const campaign = useContext(PlacementsContext)[placement];
  if (campaign?.mode === 'hidden') return null;
  const label = sectionText(lang,'advert');
  return <aside className="by-ad" aria-label={label} data-ad-slot={placement}>
    <span className="by-ad-disclosure">{label}</span>
    {campaign?.mode === 'adsense' && <AdSenseUnit key={campaign.adClient + '-' + campaign.adSlot}
      client={campaign.adClient} slot={campaign.adSlot} />}
    {campaign?.mode === 'embed' && <AdFrame name={campaign.name} url={campaign.url} />}
    {campaign?.mode === 'script' && <AdFrame script name={campaign.name} url={campaign.url} />}
    {campaign?.mode === 'campaign' && <a className="by-ad-campaign" href={campaign.url} rel="sponsored">
      {campaign.image && <img src={campaign.image} width={900} height={100} alt={campaign.alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" />}
      <span dir="auto">{campaign.name}</span>
    </a>}
    {!campaign && <div className="by-ad-open">{sectionText(lang,'adAvailable')}</div>}
  </aside>;
}
