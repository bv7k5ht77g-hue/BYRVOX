import { SITE_ORIGIN } from '@/lib/site-url';

export function GET() {
  return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
