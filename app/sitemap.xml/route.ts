import { asc, count, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { articles } from '@/db/schema';
import { categoryHref, orderedCategories } from '@/lib/editorial-sections';
import { features } from '@/lib/content';
import { editionHref, type Section } from '@/lib/edition';
import { resolveCover } from '@/lib/cover-photo';
import { articleUrl, NEW_SITE_ORIGIN } from '@/lib/site-url';
import { isoDate } from '@/lib/publication-date';
import { sitemapPage } from '@/lib/sitemap';
import { xml, xmlResponse } from '@/lib/xml';

const pageSize=1000;
const sections:Section[]=['actualites','radio','tv','podcasts','emissions','dossiers','direct','presentations'];

export async function GET(request: Request) {
  const db=getDb(), origin=NEW_SITE_ORIGIN;
  const live=eq(articles.status,'published');
  const [{total}] = await db.select({total:count()}).from(articles).where(live);
  const page = sitemapPage(request,'/sitemap.xml',total,pageSize);
  if (page.response) return page.response;
  const entries: string[]=[];
  if(page.offset===0) {
    const categories=await db.selectDistinct({category:articles.category}).from(articles).where(live);
    const routes=new Set(['/',...sections.map(section=>editionHref(section)),
      ...orderedCategories(categories.map(row=>row.category)).map(categoryHref),
      ...features.map(story=>articleUrl(story.slug,origin))]);
    for(const route of routes) entries.push('<url><loc>'+xml(new URL(route,origin).href)+'</loc></url>');
  }
  const rows=await db.select({slug:articles.slug,updatedAt:articles.updatedAt,publishedAt:articles.publishedAt,
    photo:articles.photo,photoHidden:articles.photoHidden}).from(articles)
    .where(live).orderBy(asc(articles.slug)).limit(pageSize).offset(page.offset);
  for(const row of rows) {
    const photo=resolveCover(row.slug,row.photo,row.photoHidden);
    const image=photo ? '<image:image><image:loc>'+xml(new URL(photo.url,origin).href)+'</image:loc></image:image>' : '';
    const date=isoDate(row.updatedAt) || isoDate(row.publishedAt);
    entries.push('<url><loc>'+xml(articleUrl(row.slug,origin))+'</loc>'+(date?'<lastmod>'+date+'</lastmod>':'')+image+'</url>');
  }
  return xmlResponse('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'+entries.join('\n')+'\n</urlset>');
}
