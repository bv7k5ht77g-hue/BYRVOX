export const SITE_ORIGIN = 'https://byrvox.h2y4xnnm6g.chatgpt.site';

export function articleUrl(slug: string) {
  return new URL('/article/' + encodeURIComponent(slug), SITE_ORIGIN).href;
}
