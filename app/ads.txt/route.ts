import { getAdSenseSettings } from '@/lib/ad-placement-store';
import { adClientPattern } from '@/lib/adsense.mjs';
import { NEW_SITE_ORIGIN } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const headers = {'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'public, max-age=300'};
  if (new URL(request.url).origin !== NEW_SITE_ORIGIN) return new Response(null, {status:404, headers});
  const {client, enabled} = await getAdSenseSettings();
  if (!enabled || !adClientPattern.test(client)) return new Response(null, {status:404, headers});
  return new Response(`google.com, ${client.slice(3)}, DIRECT, f08c47fec0942fa0\n`, {headers});
}
