import { categoryHref, orderedCategories } from '@/lib/editorial-sections';
import { features } from '@/lib/content';
import { editionHref, type Section } from '@/lib/edition';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { articles } from '@/db/schema';
import { articleUrl, SITE_ORIGIN } from '@/lib/site-url';
import { xml, xmlResponse } from '@/lib/xml';

export async function GET() {
  const urls = new Map<string, string | null>();
  urls.set(SITE_ORIGIN + '/', null);
  const sections: Section[] = ['actualites', 'radio', 'tv', 'podcasts', 'emissions', 'dossiers', 'direct', 'presentations'];
  for (const section of sections) {
    urls.set(new URL(editionHref(section), SITE_ORIGIN).href, null);
  }
  const publishedCategories = await getDb().selectDistinct({category:articles.category}).from(articles).where(eq(articles.status,'published'));
  for (const category of orderedCategories(publishedCategories.map(row=>row.category))) {
    urls.set(new URL(categoryHref(category),SITE_ORIGIN).href,null);
  }
  for (const feature of features) urls.set(articleUrl(feature.slug), null);
  const publications = await getDb()
    .select({ slug: articles.slug, updatedAt: articles.updatedAt, publishedAt: articles.publishedAt })
    .from(articles)
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articles.publishedAt), desc(articles.slug))
    .limit(50000 - urls.size);
  for (const story of publications) {
    urls.set(articleUrl(story.slug), story.updatedAt || story.publishedAt);
  }

  const entries = Array.from(urls, ([url, date]) => {
    const timestamp = Date.parse(date || '');
    const lastmod = Number.isFinite(timestamp) ? `<lastmod>${new Date(timestamp).toISOString()}</lastmod>` : '';
    return `<url><loc>${xml(url)}</loc>${lastmod}</url>`;
  });
  return xmlResponse(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`);
}
