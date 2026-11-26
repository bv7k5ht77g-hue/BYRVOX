import { and, eq, gt, lt } from 'drizzle-orm';
import { getDb } from '../db';
import { editorSessions } from '../db/schema';
import type { ChatGPTUser } from '../app/chatgpt-auth';

export const sessionCookie = '__Host-byrvox-editor';
export const verifierCookie = '__Host-byrvox-editor-proof';
export const sessionLifetime = 8 * 60 * 60;
export const validSecret = (value: string | null | undefined): value is string => Boolean(value && /^[0-9a-f]{64}$/.test(value));
const toHex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
export const randomSecret = () => toHex(crypto.getRandomValues(new Uint8Array(32)));
export async function hashSecret(value: string) {
  return toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))));
}
export function getCookie(header: string | null, key: string) {
  for (const pair of (header || '').split(';')) {
    const text = pair.trim();
    if (text.startsWith(key + '=')) return text.slice(key.length + 1);
  }
  return null;
}
export function cookieHeader(key: string, value: string, age: number) {
  return key + '=' + value + '; Path=/; Secure; HttpOnly; SameSite=' + (key === verifierCookie ? 'None' : 'Lax') + '; Max-Age=' + age;
}
const now = () => Math.floor(Date.now() / 1000);
export async function issueGrant(user: ChatGPTUser, proofHash: string) {
  const grant = randomSecret();
  const db = getDb();
  await db.batch([
    db.delete(editorSessions).where(lt(editorSessions.expiresAt, now())),
    db.insert(editorSessions).values({ digest: await hashSecret(grant), proofHash, userId: user.userId, email: user.email, expiresAt: now() + 120 }),
  ]);
  return grant;
}
export async function exchangeGrant(grant: string, proof: string) {
  const token = randomSecret();
  // Replace the one-time grant with the session atomically. A concurrent exchange cannot reuse it.
  const [row] = await getDb().update(editorSessions)
    .set({ digest: await hashSecret(token), proofHash: '', expiresAt: now() + sessionLifetime })
    .where(and(eq(editorSessions.digest, await hashSecret(grant)), eq(editorSessions.proofHash, await hashSecret(proof)), gt(editorSessions.expiresAt, now())))
    .returning({ email:editorSessions.email, userId:editorSessions.userId });
  return row ? {token, ...row} : null;
}
export async function getEditorSession(token: string): Promise<ChatGPTUser | null> {
  const row = await getDb().select({ userId:editorSessions.userId, email:editorSessions.email }).from(editorSessions)
    .where(and(eq(editorSessions.digest, await hashSecret(token)), eq(editorSessions.proofHash, ''), gt(editorSessions.expiresAt, now()))).get();
  return row ? { ...row, displayName:row.email, fullName:null } : null;
}
export async function revokeEditorSession(token: string) {
  await getDb().delete(editorSessions).where(and(eq(editorSessions.digest, await hashSecret(token)), eq(editorSessions.proofHash, '')));
}
