import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../../../../db';
import { readerAccounts, readerActivity } from '../../../../db/schema';
import { admin, sameOrigin } from '../../../../lib/access';
import { boundedJson } from '../../../../lib/input';

const pageSize = 25;
const statuses = z.enum(['active','suspended','banned']);
const mutation = z.object({userId:z.string().min(1).max(256),expectedStatus:statuses,status:statuses}).strict();
const reply = (body: unknown,status = 200) => Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
const denied = () => reply({error:'La gestion des lecteurs est réservée aux responsables de la rédaction.'},403);

export async function GET(request:Request) {
  if (!await admin()) return denied();
  const query = new URL(request.url).searchParams;
  const db = getDb();
  if (query.has('id')) {
    const id = query.get('id')!;
    if (!id || id.length > 256) return reply({error:'Identifiant invalide.'},422);
    const reader = await db.select().from(readerAccounts).where(eq(readerAccounts.userId,id)).get();
    if (!reader) return reply({error:'Compte introuvable.'},404);
    const activity = await db.select({
      id:readerActivity.id,action:readerActivity.action,path:readerActivity.path,occurredAt:readerActivity.occurredAt,
    }).from(readerActivity).where(eq(readerActivity.userId,id)).orderBy(desc(readerActivity.id)).limit(100);
    return reply({reader,activity});
  }
  const page = Number(query.get('page') || '1');
  const search = (query.get('search') || '').trim();
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || search.length > 160) {
    return reply({error:'Recherche ou page invalide.'},422);
  }
  const rows = await db.select({
    userId:readerAccounts.userId,email:readerAccounts.email,firstName:readerAccounts.firstName,lastName:readerAccounts.lastName,
    status:readerAccounts.status,lastSeenAt:readerAccounts.lastSeenAt,
  }).from(readerAccounts)
    .where(search ? sql`instr(lower(email || ' ' || first_name || ' ' || last_name),lower(${search})) > 0` : undefined)
    .orderBy(desc(readerAccounts.lastSeenAt),desc(readerAccounts.userId)).limit(pageSize+1).offset((page-1)*pageSize);
  return reply({readers:rows.slice(0,pageSize),page,hasMore:rows.length>pageSize});
}

export async function PATCH(request:Request) {
  if (!sameOrigin(request)) return denied();
  const moderator = await admin();
  if (!moderator) return denied();
  const parsed = mutation.safeParse(await boundedJson(request,2048).catch(()=>null));
  if (!parsed.success) return reply({error:'Action ou compte invalide.'},422);
  const {userId, status, expectedStatus} = parsed.data;
  if (status === expectedStatus) return reply({error:'Ce statut est déjà sélectionné.'},422);
  const db = getDb();
  const [updated] = await db.update(readerAccounts).set({
    status,moderatedAt:new Date().toISOString(),moderatedBy:moderator.email,
  }).where(and(eq(readerAccounts.userId,userId),eq(readerAccounts.status,expectedStatus)))
    .returning({status:readerAccounts.status});
  if (updated) return reply(updated);
  const exists = await db.select({status:readerAccounts.status}).from(readerAccounts).where(eq(readerAccounts.userId,userId)).get();
  return exists ? reply({error:'Le statut a changé. Consulte la fiche actualisée.'},409) : reply({error:'Compte introuvable.'},404);
}
