import { publicSiteOrigin } from '@/lib/site-url';

export function GET(request: Request) {
  const origin = publicSiteOrigin(new URL(request.url).host);
  return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /editeur\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
