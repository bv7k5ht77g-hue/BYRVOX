export const SITE_ORIGIN = 'https://byrvox.noventra.ca';

// Sites establishes the newsroom session on its registered sign-in origin.
export const NEWSROOM_URL = 'https://byrvox.h2y4xnnm6g.chatgpt.site/admin';

export function articleUrl(slug: string) {
  return new URL('/article/' + encodeURIComponent(slug), SITE_ORIGIN).href;
}
