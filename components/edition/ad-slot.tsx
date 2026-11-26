'use client';

import Image from 'next/image';
import type { PublicLocale } from '../../lib/i18n';
import { usePublicLocale } from '../language-select';
import { sectionText } from './section-copy';
import './ad-slot.css';

type Placement = 'masthead' | 'home' | 'home-lower' | 'news' | 'news-lower' | 'article' | 'article-photo' | 'article-lower' | 'radio';
type Campaign = { name: string; url: string; image: string; alt: string };
// Booked campaigns use local creatives and disclose the advertiser. Unbooked
// placements remain identified without advertising an unlaunched service.
const campaigns: Partial<Record<Placement,Campaign>> = {};
export function AdSlot({ placement, locale }: { placement: Placement; locale?: PublicLocale }) {
  const current = usePublicLocale();
  const lang = locale ?? current;
  const campaign = campaigns[placement];
  const label = sectionText(lang,'advert');
  return <aside className="by-ad" aria-label={label} data-ad-slot={placement}>
    <span className="by-ad-disclosure">{label}</span>
    {campaign ? <a className="by-ad-campaign" href={campaign.url} rel="sponsored">
      <Image unoptimized src={campaign.image} width={900} height={100} alt={campaign.alt} loading="lazy" /><span>{campaign.name}</span>
    </a> : <div className="by-ad-open">{sectionText(lang,'adAvailable')}</div>}
  </aside>;
}
