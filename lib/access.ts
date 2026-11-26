import {env} from 'cloudflare:workers';
import {and,eq,isNull} from 'drizzle-orm';
import {headers} from 'next/headers';
import type {ChatGPTUser} from '../app/chatgpt-auth';
import {getDb} from '../db';
import {newsroomMembers} from '../db/schema';
import {getCookie, getEditorSession, sessionCookie, validSecret} from './editor-session';
import {SITE_ORIGIN} from './site-url';

export type NewsroomRole = 'owner' | 'approver' | 'contributor';
export type NewsroomUser = ChatGPTUser & {role: NewsroomRole};

export function runtime(name: string) {
  return (env as unknown as Record<string,string>)[name] || '';
}
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export function ownerEmails() {
  return runtime('ADMIN_EMAILS').split(',').map(normalizeEmail).filter(Boolean);
}

export async function newsroomRole(identity: Pick<ChatGPTUser,'email'|'userId'>): Promise<NewsroomRole | null> {
  const email = normalizeEmail(identity.email);
  if (ownerEmails().includes(email)) return 'owner';
  const db = getDb();
  const member = await db.select().from(newsroomMembers).where(eq(newsroomMembers.email,email)).get();
  if (!member) return null;
  if (member.userId !== null) return member.userId === identity.userId ? member.role : null;
  // Bind the invitation to the provider's authenticated account on first use.
  const [accepted] = await db.update(newsroomMembers).set({userId:identity.userId,acceptedAt:new Date().toISOString()})
    .where(and(eq(newsroomMembers.email,email),isNull(newsroomMembers.userId))).returning({role:newsroomMembers.role});
  if (accepted) return accepted.role;
  const current = await db.select({role:newsroomMembers.role}).from(newsroomMembers)
    .where(and(eq(newsroomMembers.email,email),eq(newsroomMembers.userId,identity.userId))).get();
  return current?.role ?? null;
}

export async function newsroomUser(): Promise<NewsroomUser | null> {
  const requestHeaders = await headers();
  if (requestHeaders.get('host') !== new URL(SITE_ORIGIN).host) return null;
  const token = getCookie(requestHeaders.get('cookie'), sessionCookie);
  const identity = validSecret(token) ? await getEditorSession(token) : null;
  if (!identity) return null;
  const role = await newsroomRole(identity);
  return role ? {...identity,role} : null;
}

export async function admin() {
  const user = await newsroomUser();
  return user?.role === 'owner' || user?.role === 'approver' ? user : null;
}
export async function newsroomOwner() {
  const user = await newsroomUser();
  return user?.role === 'owner' ? user : null;
}
export function sameOrigin(req: Request) {
  return req.headers.get('origin') === new URL(req.url).origin;
}
