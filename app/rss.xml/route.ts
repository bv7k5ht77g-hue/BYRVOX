import { listPublishedArticles } from '@/lib/public-articles';
import { articleUrl, publicSiteOrigin } from '@/lib/site-url';
import { xml, xmlResponse } from '@/lib/xml';

// Keep the original feed identifiers stable for readers subscribed before the domain change.
const feedIdOrigin = 'https://byrvox.h2y4xnnm6g.chatgpt.site';

export async function GET(request: Request) {
  const origin = publicSiteOrigin(new URL(request.url).host);
  const stories = await listPublishedArticles(50);
  const items = stories.map(story => {
    const url = xml(articleUrl(story.slug, origin));
    const guid = xml(new URL('/article/' + encodeURIComponent(story.slug), feedIdOrigin).href);
    const date = Date.parse(story.publishedAt || '');
    const pubDate = Number.isFinite(date) ? `<pubDate>${new Date(date).toUTCString()}</pubDate>` : '';
    return `<item><title>${xml(story.title)}</title><link>${url}</link><guid isPermaLink="false">${guid}</guid><description>${xml(story.summary)}</description><category>${xml(story.category)}</category>${pubDate}</item>`;
  });
  return xmlResponse(`<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>BYRVOX — Actualités</title><link>${origin}/</link>
<description>Les dernières publications de la rédaction de BYRVOX.</description><language>fr-ca</language>
<atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml"/>
${items.join('\n')}
</channel></rss>`, 'application/rss+xml');
}
