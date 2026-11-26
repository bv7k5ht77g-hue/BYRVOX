import { and, count, desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { articles } from '@/db/schema';
import { articleUrl, NEW_SITE_ORIGIN } from '@/lib/site-url';
import { sitemapPage } from '@/lib/sitemap';
import { xml, xmlResponse } from '@/lib/xml';

const pageSize=1000;
export async function GET(request:Request) {
  const now=Date.now(), db=getDb();
  const recent=and(eq(articles.status,'published'),
    sql`julianday(${articles.publishedAt}) between julianday(${new Date(now-48*3600000).toISOString()}) and julianday(${new Date(now).toISOString()})`);
  const [{total}]=await db.select({total:count()}).from(articles).where(recent);
  const page=sitemapPage(request,'/news-sitemap.xml',total,pageSize);
  if(page.response) return page.response;
  const stories=await db.select({slug:articles.slug,title:articles.title,publishedAt:articles.publishedAt})
    .from(articles).where(recent).orderBy(desc(articles.publishedAt),desc(articles.slug)).limit(pageSize).offset(page.offset);
  const entries=stories.map(story=>'<url><loc>'+xml(articleUrl(story.slug,NEW_SITE_ORIGIN))+'</loc><news:news>'+
    '<news:publication><news:name>BYRVOX</news:name><news:language>fr</news:language></news:publication>'+
    '<news:publication_date>'+new Date(story.publishedAt!).toISOString()+'</news:publication_date><news:title>'+xml(story.title)+'</news:title></news:news></url>');
  return xmlResponse('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n'+entries.join('\n')+'\n</urlset>');
}
