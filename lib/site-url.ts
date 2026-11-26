export const SITE_ORIGIN = 'https://byrvox.noventra.ca';
export const NEW_SITE_ORIGIN = 'https://byrvox.today';
export const SIGN_IN_ORIGIN = 'https://byrvox.h2y4xnnm6g.chatgpt.site';
export const NEWSROOM_URL = SITE_ORIGIN + '/admin';
export function publicSiteOrigin(host: string | null) {
  return host === 'byrvox.today' ? NEW_SITE_ORIGIN : SITE_ORIGIN;
}
export function articleUrl(slug: string, origin: string) {
  return new URL('/article/' + encodeURIComponent(slug), origin).href;
}
