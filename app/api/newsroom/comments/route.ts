import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../../../../db';
import { articleComments } from '../../../../db/schema';
import { admin, sameOrigin } from '../../../../lib/access';
import { boundedJson } from '../../../../lib/input';

const statusSchema = z.enum(['pending','approved','rejected']);
const changeSchema = z.object({
  id: z.string().min(1).max(128),
  expectedStatus: statusSchema,
  status: z.enum(['approved','rejected']),
}).strict();
const reply = (data: unknown, status = 200) => Response.json(data, {status, headers:{'Cache-Control':'private, no-store'}});
const denied = () => reply({error:'Accès réservé à la rédaction.'},403);
const perPage = 25;

export async function GET(request: Request) {
  if (!await admin()) return denied();
  const query = new URL(request.url).searchParams;
  const status = statusSchema.safeParse(query.get('status') ?? 'pending');
  const page = Number(query.get('page') ?? '1');
  if (!status.success || !Number.isSafeInteger(page) || page < 1 || page > 100000) return reply({error:'Filtre ou page invalide.'},422);
  const rows = await getDb().select({
    id:articleComments.id, slug:articleComments.slug, body:articleComments.body, authorName:articleComments.authorName,
    status:articleComments.status, createdAt:articleComments.createdAt,
  }).from(articleComments).where(eq(articleComments.status,status.data))
    .orderBy(desc(articleComments.createdAt),desc(articleComments.id)).limit(perPage + 1).offset((page-1) * perPage);
  return reply({comments:rows.slice(0,perPage), hasMore:rows.length > perPage});
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return denied();
  const moderator = await admin();
  if (!moderator) return denied();
  const change = changeSchema.safeParse(await boundedJson(request,2048).catch(() => null));
  if (!change.success || change.data.expectedStatus === change.data.status) return reply({error:'Décision invalide.'},422);
  const {id, expectedStatus, status} = change.data;
  const db = getDb();
  const [updated] = await db.update(articleComments).set({status,moderatedAt:new Date().toISOString(),moderatedBy:moderator.email})
    .where(and(eq(articleComments.id,id),eq(articleComments.status,expectedStatus))).returning({id:articleComments.id,status:articleComments.status});
  if (updated) return reply(updated);
  const exists = await db.select({id:articleComments.id}).from(articleComments).where(eq(articleComments.id,id)).get();
  return exists ? reply({error:'Le statut du commentaire a changé.'},409) : reply({error:'Commentaire introuvable.'},404);
}
