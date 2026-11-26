import { env } from 'cloudflare:workers';
import { photoNamePattern, photoTypes } from '../../../../lib/article-photo';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const match = photoNamePattern.exec(name);
  const noCache = { 'Cache-Control': 'no-store' };
  if (!match) return new Response(null, { status: 404, headers: noCache });
  if (!env.BUCKET) return new Response(null, { status: 503, headers: noCache });
  const object = await env.BUCKET.get('ad-images/' + name);
  if (!object) return new Response(null, { status: 404, headers: noCache });

  return new Response(object.body, { headers: {
    'Content-Type': photoTypes[match[1] as keyof typeof photoTypes],
    'Content-Length': String(object.size),
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'",
    'Cross-Origin-Resource-Policy': 'same-origin',
  } });
}
