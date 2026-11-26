export const SITE_ORIGIN = 'https://byrvox.noventra.ca';
export const SIGN_IN_ORIGIN = 'https://byrvox.h2y4xnnm6g.chatgpt.site';
export const NEWSROOM_URL = SITE_ORIGIN + '/admin';
export function articleUrl(slug: string) {
  return new URL('/article/' + encodeURIComponent(slug), SITE_ORIGIN).href;
}
