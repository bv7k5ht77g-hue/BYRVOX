'use client';

import { AudioLines, Bookmark, BookOpenCheck } from 'lucide-react';
import { usePublicLocale } from '../language-select';
import { localizedHref, sectionLabel, type PublicLocale } from '../../lib/i18n';
import { editionHref } from '../../lib/edition';
import { sectionText } from './section-copy';
import './ad-slot.css';

// Each placement has its own creative and destination. These first-party house
// campaigns also fill the slots while commercial inventory is unbooked.
const campaigns = {
  home: { advertiser: 'BYRVOX RADIO', title: 'radioAd', action: 'aboutRadio', href: '/article/radio', icon: AudioLines },
  news: { advertiser: 'BYRVOX', title: 'savedAd', action: 'favoris', href: editionHref('favoris'), icon: Bookmark },
  article: { advertiser: 'BYRVOX', title: 'methodAd', action: 'methodButton', href: '/article/verification', icon: BookOpenCheck },
} as const;

type Placement = keyof typeof campaigns;
export function AdSlot({ placement, locale }: { placement: Placement; locale?: PublicLocale }) {
  const selected = usePublicLocale();
  const lang = locale ?? selected;
  const campaign = campaigns[placement];
  const label = sectionText(lang, 'advert');
  return <aside className="by-ad" aria-label={label} data-ad-slot={placement}>
    <span className="by-ad-disclosure">{label}</span>
    <a href={localizedHref(campaign.href, lang)} className="by-ad-creative">
      <campaign.icon aria-hidden="true" className="by-ad-icon" strokeWidth={1.2} />
      <div className="by-ad-copy"><span dir="ltr">{campaign.advertiser}</span><strong>{sectionText(lang, campaign.title)}</strong></div>
      <span className="by-ad-action">{campaign.action === 'favoris' ? sectionLabel('favoris', lang) : sectionText(lang, campaign.action)}</span>
    </a>
  </aside>;
}
