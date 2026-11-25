export const SITE_ORIGIN = 'https://byrvox.abuzz-cat-7434.chatgpt.site';

export function articleUrl(slug: string) {
  return new URL('/article/' + encodeURIComponent(slug), SITE_ORIGIN).href;
}
