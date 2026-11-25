import type { ArticlePhoto } from './article-photo';
import collectionA from './editorial-photos-a.json';
import collectionB from './editorial-photos-b.json';

export type CoverPhoto = ArticlePhoto & { license?: string; licenseUrl?: string; thumbnailUrl?: string };

type CatalogEntry = Omit<CoverPhoto, 'url'> & { src: string };
const catalog: Record<string, CatalogEntry> = { ...collectionA, ...collectionB };

export function catalogCover(slug: string): CoverPhoto | null {
  if (!Object.hasOwn(catalog, slug)) return null;
  const { src, alt, caption, credit, sourceUrl, license, licenseUrl } = catalog[slug];
  const thumbnailUrl = src.replace('/media/editorial/', '/media/editorial/thumbs/');
  return { url: src, thumbnailUrl, alt, caption, credit, sourceUrl, license, licenseUrl };
}

export function resolveCover(slug: string, photo: ArticlePhoto | null, hidden = false): CoverPhoto | null {
  if (hidden) return null;
  if (!photo) return catalogCover(slug);
  const { url, alt, caption, credit, sourceUrl } = photo;
  return { url, alt, caption, credit, ...(sourceUrl ? { sourceUrl } : {}) };
}
