import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { getDb } from '../../../../db';
import { publishedPhotos } from '../../../../db/schema';
import { belongsToContributorArticle } from '../../../../lib/private-photo';
import { newsroomUser } from '../../../../lib/access';
import { photoNamePattern, photoRoute, photoTypes } from '../../../../lib/article-photo';

export const dynamic = 'force-dynamic';
const cacheHeaders = { 'Cache-Control': 'private, no-store' };

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const match = photoNamePattern.exec(name);
  const missing = () => new Response(null, { status: 404, headers: cacheHeaders });
  if (!match) return missing();
  if (!env.BUCKET) return new Response(null, { status: 503, headers: cacheHeaders });
  const published = await getDb().select({ id: publishedPhotos.articleId }).from(publishedPhotos)
    .where(eq(publishedPhotos.url, photoRoute + name)).limit(1).get();
  const user = published ? null : await newsroomUser();
  if (!published && !user) return missing();
  const object = await env.BUCKET.get('photos/' + name);
  if (!object) return missing();
  if (!published && user?.role === 'contributor' && object.customMetadata?.userId !== user.userId &&
      !await belongsToContributorArticle(user.userId, photoRoute + name)) {
    await object.body.cancel();
    return missing();
  }
  return new Response(object.body, { headers: {
    ...cacheHeaders, 'Content-Type': photoTypes[match[1] as keyof typeof photoTypes],
    'Content-Length': String(object.size), 'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'", 'Cross-Origin-Resource-Policy': 'same-origin',
  } });
}
