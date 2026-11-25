import { env } from 'cloudflare:workers';
import { admin, sameOrigin } from '../../../../lib/access';
import { photoByteLimit, photoFormat, photoRoute, photoTypes } from '../../../../lib/article-photo';
import { boundedBytes } from '../../../../lib/input';

function problem(error: string, status: number) {
  return Response.json({ error }, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(req: Request) {
  if (!await admin() || !sameOrigin(req)) return problem('Accès réservé à la rédaction.', 403);
  if (!env.BUCKET) return problem('Le stockage des photos est indisponible.', 503);
  const declaredType = req.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (!Object.values(photoTypes).some(type => declaredType === type)) return problem('Formats acceptés : JPEG, PNG et WebP.', 415);
  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = await boundedBytes(req, photoByteLimit);
  } catch (error) {
    return error instanceof RangeError ? problem('La photo dépasse 8 Mio.', 413) : problem('Fichier illisible.', 400);
  }
  const format = photoFormat(bytes);
  if (!format || photoTypes[format] !== declaredType) return problem('Le fichier ne correspond pas au format annoncé.', 415);
  const name = crypto.randomUUID() + '.' + format;
  await env.BUCKET.put('photos/' + name, bytes, { httpMetadata: { contentType: photoTypes[format] } });
  return Response.json({ url: photoRoute + name }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
}
