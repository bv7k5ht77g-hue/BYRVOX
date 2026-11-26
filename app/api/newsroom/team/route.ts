import {asc,eq,sql} from 'drizzle-orm';
import {z} from 'zod';
import {getDb} from '../../../../db';
import {editorSessions,newsroomMembers} from '../../../../db/schema';
import {newsroomOwner, normalizeEmail, ownerEmails, sameOrigin} from '../../../../lib/access';
import {boundedJson} from '../../../../lib/input';

const emailSchema = z.string().trim().max(254).email().transform(normalizeEmail);
const invitation = z.object({email:emailSchema,role:z.enum(['contributor','approver'])}).strict();
const removal = z.object({email:emailSchema}).strict();
const reply = (body:unknown, status=200) => Response.json(body, {status,headers:{'Cache-Control':'private, no-store'}});
const denied = () => reply({error:'La gestion des accès est réservée au propriétaire.'},403);

export async function GET() {
  if (!await newsroomOwner()) return denied();
  const members = await getDb().select({
    email:newsroomMembers.email, role:newsroomMembers.role, createdAt:newsroomMembers.createdAt, acceptedAt:newsroomMembers.acceptedAt,
  }).from(newsroomMembers).orderBy(asc(newsroomMembers.email));
  return reply({owners:ownerEmails(),members});
}

export async function POST(req:Request) {
  const owner = await newsroomOwner();
  if (!owner || !sameOrigin(req)) return denied();
  const parsed = invitation.safeParse(await boundedJson(req,2048).catch(()=>null));
  if (!parsed.success) return reply({error:'Indique un courriel valide et un rôle de rédaction.'},422);
  const {email,role} = parsed.data;
  if (ownerEmails().includes(email)) return reply({error:'Ce compte est déjà propriétaire.'},409);
  await getDb().insert(newsroomMembers).values({email,role,invitedBy:owner.userId,createdAt:new Date().toISOString()})
    .onConflictDoUpdate({target:newsroomMembers.email,set:{role}});
  return reply({ok:true});
}

export async function DELETE(req:Request) {
  if (!await newsroomOwner() || !sameOrigin(req)) return denied();
  const parsed = removal.safeParse(await boundedJson(req,2048).catch(()=>null));
  if (!parsed.success) return reply({error:'Indique un courriel valide.'},422);
  const {email} = parsed.data;
  if (ownerEmails().includes(email)) return reply({error:'Le rôle de propriétaire est protégé.'},409);
  const db = getDb();
  await db.batch([
    db.delete(newsroomMembers).where(eq(newsroomMembers.email,email)),
    db.delete(editorSessions).where(eq(sql<string>`lower(${editorSessions.email})`,email)),
  ]);
  return reply({ok:true});
}
