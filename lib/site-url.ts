export const SITE_ORIGIN = 'https://byrvox.noventra.ca';
export const NEW_SITE_ORIGIN = 'https://byrvox.today';
export const SIGN_IN_ORIGIN = 'https://byrvox.h2y4xnnm6g.chatgpt.site';
export const NEWSROOM_URL = SITE_ORIGIN + '/admin';
export function articleUrl(slug: string, origin: string) {
  return new URL('/article/' + encodeURIComponent(slug), origin).href;
}

// The site identity is shared by the homepage and the articles it publishes.
export const publicPublisher = {
  '@type':'NewsMediaOrganization', '@id':NEW_SITE_ORIGIN+'/#publisher',
  name:'BYRVOX', url:NEW_SITE_ORIGIN+'/',
  logo:{'@type':'ImageObject',url:NEW_SITE_ORIGIN+'/brand/logo-dark.png'},
};
