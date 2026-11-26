import { z } from 'zod';
import { validSourceUrl } from '../editorial.mjs';

const webUrl = z.string().max(1800).refine(validSourceUrl);
const line = (min: number, max: number) => z.string().trim().min(min).max(max);
const translated = z.object({
  title: line(1, 400), summary: line(1, 3200), body: line(1, 50000),
  photoAlt: line(8, 300).optional(), photoCaption: line(12, 1000).optional(),
}).refine(copy => Boolean(copy.photoAlt) === Boolean(copy.photoCaption), {
  message: 'La légende et le texte alternatif traduits doivent être fournis ensemble.',
});
const storySchema = z.object({
  eventKey: z.string().min(6).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: line(14, 230), category: line(2, 80), summary: line(40, 1100), body: line(350, 24000),
  verified: z.literal(true),
  sources: z.array(z.object({
    name: line(2, 160), url: webUrl, publishedAt: z.union([z.string().datetime({offset:true}), z.string().date()]),
  })).min(2).max(8),
  photo: z.object({
    download: line(4, 1800), sourceUrl: webUrl, credit: line(2, 200), license: line(2, 100),
    licenseUrl: webUrl, alt: line(8, 300), caption: line(12, 1000),
  }),
  translations: z.object({en:translated, es:translated, ar:translated, 'zh-CN':translated, ru:translated, ko:translated}).partial().optional(),
});
export type WireStory = z.infer<typeof storySchema>;
export const editionSchema = z.object({hour:z.string(), articles:z.array(storySchema).min(1).max(15)});
export type WireEdition = z.infer<typeof editionSchema>;
export const repoBase = 'https://raw.githubusercontent.com/bv7k5ht77g-hue/BYRVOX/main/newswire/';

export function recentHour(hour: unknown, now = Date.now()): hour is string {
  if (typeof hour !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(hour)) return false;
  const t = Date.parse(hour + ':00:00Z');
  return Number.isFinite(t) && new Date(t).toISOString().startsWith(hour + ':') && t <= now && now - t < 72 * 3600000;
}

const imageOrigins = new Set(['upload.wikimedia.org', 'images-assets.nasa.gov', 'images.pexels.com',
  'd1ldvf68ux039x.cloudfront.net', 'media.defense.gov', 'media.esa.int']);
export function imageAddress(download: string, hour: string) {
  if (/^media\/[a-z0-9][a-z0-9-]{0,108}\.(?:jpg|webp|png)$/.test(download)) return repoBase + hour + '/' + download;
  if (!validSourceUrl(download)) return null;
  const u = new URL(download);
  return imageOrigins.has(u.hostname) && !u.port ? u.href : null;
}

export function articleError(story: WireStory, hour: string, now = Date.now()) {
  const publishers = new Set(story.sources.map(s => new URL(s.url).hostname.toLowerCase().replace(/^www\./,'')));
  if (publishers.size < 2) return 'Deux éditeurs distincts sont nécessaires.';
  const end = Date.parse(hour + ':00:00Z') + 3600000;
  const dates = story.sources.map(s => Date.parse(s.publishedAt));
  if (dates.some(date => date >= end || date > now + 300000) || !dates.some(date => date >= end - 49*3600000)) {
    return 'La date des sources ne correspond pas à cette édition.';
  }
  if (!imageAddress(story.photo.download,hour)) return 'Source de la photographie non prise en charge.';
  return null;
}

export function canonicalSource(address: string) {
  const u = new URL(address);
  u.hash = '';
  for (const name of Array.from(u.searchParams.keys())) {
    if (/^utm_|^(fbclid|gclid)$/i.test(name)) u.searchParams.delete(name);
  }
  u.searchParams.sort();
  return u.href;
}
