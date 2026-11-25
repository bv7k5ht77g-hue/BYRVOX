import { listPublishedArticles } from '@/lib/public-articles';
import { articleUrl, SITE_ORIGIN } from '@/lib/site-url';
import { xml, xmlResponse } from '@/lib/xml';

export async function GET() {
  const stories = await listPublishedArticles(50);
  const items = stories.map(story => {
    const url = xml(articleUrl(story.slug));
    const date = Date.parse(story.publishedAt || '');
    const pubDate = Number.isFinite(date) ? `<pubDate>${new Date(date).toUTCString()}</pubDate>` : '';
    return `<item><title>${xml(story.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><description>${xml(story.summary)}</description><category>${xml(story.category)}</category>${pubDate}</item>`;
  });
  return xmlResponse(`<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>BYRVOX — Actualités</title><link>${SITE_ORIGIN}/</link>
<description>Les dernières publications de la rédaction de BYRVOX.</description><language>fr-ca</language>
<atom:link href="${SITE_ORIGIN}/rss.xml" rel="self" type="application/rss+xml"/>
${items.join('\n')}
</channel></rss>`, 'application/rss+xml');
}
