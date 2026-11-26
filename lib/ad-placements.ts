import { validSourceUrl } from './editorial.mjs';

export const PLACEMENTS = [
  'home', 'masthead', 'home-lower', 'news', 'news-lower', 'radio', 'article-photo', 'article',
] as const;

export type Placement = typeof PLACEMENTS[number];
export const AD_MODES = ['available', 'hidden', 'campaign', 'adsense', 'embed', 'script'] as const;

export type AdPlacement = {
  placement: Placement;
  mode: typeof AD_MODES[number];
  name: string;
  url: string;
  image: string;
  alt: string;
  adClient: string;
  adSlot: string;
  version: number;
};

export type AdSenseSettings = {enabled: boolean; client: string; version: number};

export type PublicAdPlacements = Partial<Record<Placement,
  | {mode: 'hidden'}
  | {mode: 'adsense'; adClient: string; adSlot: string}
  | {mode: 'embed'; name: string; url: string}
  | {mode: 'script'; name: string; url: string}
  | ({mode: 'campaign'} & Pick<AdPlacement, 'name' | 'url' | 'image' | 'alt'>)
>>;

export function validAdImageUrl(value: string): boolean {
  if (!value || /[\u0000-\u0020\u007f\\]/.test(value)) return false;
  return validSourceUrl(value) || (value.startsWith('/') && !value.startsWith('//'));
}
