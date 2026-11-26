import { NEW_SITE_ORIGIN } from './site-url';
import { xml, xmlResponse } from './xml';

// Keep growing archives discoverable. Shards use the same route and a one-based page parameter.
export function sitemapPage(request:Request, path:string, total:number, size:number) {
  const pages = Math.max(1, Math.ceil(total/size));
  const page = new URL(request.url).searchParams.get('page');
  if (page === null && pages > 1) {
    const maps = Array.from({length:pages},(_,index)=>
      '<sitemap><loc>'+xml(NEW_SITE_ORIGIN+path+'?page='+(index+1))+'</loc></sitemap>');
    return {response:xmlResponse('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+maps.join('\n')+'</sitemapindex>')};
  }
  if(page!==null && (!/^[1-9]\d*$/.test(page) || Number(page)>pages)) {
    return {response:new Response('Not found',{status:404})};
  }
  return {offset:(Number(page || 1)-1)*size};
}
