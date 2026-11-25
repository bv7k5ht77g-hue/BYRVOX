export const SITE_ORIGIN = 'https://byrvox.noventra.ca';

export function articleUrl(slug: string) {
  return new URL('/article/' + encodeURIComponent(slug), SITE_ORIGIN).href;
}
