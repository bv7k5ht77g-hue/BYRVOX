import { z } from 'zod';
import { admin, sameOrigin } from '@/lib/access';
import { getHomepageLead, setHomepageLead } from '@/lib/homepage-lead';
import { boundedJson } from '@/lib/input';

const choice = z.object({ articleId: z.string().min(1).max(100).nullable() }).strict();
const privateHeaders = { 'Cache-Control': 'private, no-store' };
function reply(value: unknown, status = 200) {
  return Response.json(value, { status, headers: privateHeaders });
}

export async function GET() {
  if (!await admin()) return reply({ error: 'Accès réservé à la rédaction.' }, 403);
  const story = await getHomepageLead();
  return reply({ articleId: story?.articleId ?? null, title: story?.title ?? null });
}

export async function PUT(req: Request) {
  if (!await admin() || !sameOrigin(req)) return reply({ error: 'Accès refusé.' }, 403);
  let input: z.infer<typeof choice>;
  try {
    input = choice.parse(await boundedJson(req, 1024));
  } catch {
    return reply({ error: 'Choix de la une invalide.' }, 400);
  }
  const result = await setHomepageLead(input.articleId);
  return result ? reply(result) : reply({ error: 'Choisis un article publié.' }, 422);
}
