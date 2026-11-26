import { NEW_SITE_ORIGIN } from '@/lib/site-url';

export function GET() {
  const rules = [
    'User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /editeur', 'Disallow: /api/',
    'Allow: /api/photos/', 'Sitemap: ' + NEW_SITE_ORIGIN + '/sitemap.xml',
    'Sitemap: ' + NEW_SITE_ORIGIN + '/news-sitemap.xml',
  ];
  return new Response(rules.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control':'public, max-age=300' }
  });
}
