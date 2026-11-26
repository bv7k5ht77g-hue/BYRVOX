import { env } from 'cloudflare:workers';
import { adManagementDenial } from '../../../../lib/access';
import { photoByteLimit, photoFormat, photoTypes } from '../../../../lib/article-photo';
import { boundedBytes } from '../../../../lib/input';

const headers = { 'Cache-Control': 'private, no-store' };
const problem = (error: string, status: number) => Response.json({ error }, { status, headers });

export async function POST(request: Request) {
  const denied = await adManagementDenial(request);
  if (denied) return denied;
  if (!env.BUCKET) return problem('Le stockage des bannières est indisponible.', 503);

  const declaredType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (!Object.values(photoTypes).some(type => type === declaredType)) {
    return problem('Formats acceptés : JPEG, PNG et WebP.', 415);
  }

  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = await boundedBytes(request, photoByteLimit);
  } catch (error) {
    return error instanceof RangeError ? problem('La bannière dépasse 8 Mio.', 413) : problem('Fichier illisible.', 400);
  }
  const format = photoFormat(bytes);
  if (!format || photoTypes[format] !== declaredType) return problem('Le format du fichier ne correspond pas au type annoncé.', 415);

  const name = crypto.randomUUID() + '.' + format;
  await env.BUCKET.put('ad-images/' + name, bytes, { httpMetadata: { contentType: photoTypes[format] } });
  return Response.json({ url: '/api/ad-images/' + name }, { status: 201, headers });
}
