import { and, eq, lte, sql } from 'drizzle-orm';
import { getDb } from '../db';
import { readerAccounts, readerActivity } from '../db/schema';
import { readerNetwork } from './reader-network';

export type ReaderStatus = typeof readerAccounts.$inferSelect.status;
type VerifiedReader = {userId:string; email:string; firstName:string|null; lastName:string|null};

function lastSeen(request:Request, now:string) {
  const {lastIp, lastLocation} = readerNetwork(request);
  return {lastSeenAt:now, lastIp:lastIp ?? undefined, lastLocation:lastLocation ?? undefined};
}

export async function recordReaderSignIn(identity: VerifiedReader, request: Request): Promise<ReaderStatus> {
  const now = new Date().toISOString();
  const profile = {
    email:identity.email.trim().slice(0,320),
    firstName:(identity.firstName ?? '').trim().slice(0,160),
    lastName:(identity.lastName ?? '').trim().slice(0,160),
    ...lastSeen(request,now),
  };
  const db = getDb();
  const [rows] = await db.batch([
    db.insert(readerAccounts).values({userId:identity.userId,createdAt:now,...profile})
      .onConflictDoUpdate({target:readerAccounts.userId,set:profile})
      .returning({status:readerAccounts.status}),
    db.insert(readerActivity).select(sql`
      select null, user_id, 'signin', null, ${now}
      from reader_accounts where user_id = ${identity.userId} and status = 'active'`),
  ]);
  return rows[0].status;
}

export async function recordReaderActivity(userId:string, action:'page'|'signout', path:string|null, request:Request) {
  let page: string | null = null;
  if (action === 'page') {
    page = (path || '').split(/[?#]/,1)[0];
    if (page !== '/' && !/^\/article\/[a-z0-9][a-z0-9-]{0,229}\/?$/.test(page)) return;
  }
  const now = new Date().toISOString();
  const db = getDb();
  await db.batch([
    db.update(readerAccounts).set(lastSeen(request,now))
      .where(and(eq(readerAccounts.userId,userId),eq(readerAccounts.status,'active'),lte(readerAccounts.lastSeenAt,now))),
    db.insert(readerActivity).select(sql`
      select null, user_id, ${action}, ${page}, ${now}
      from reader_accounts where user_id = ${userId} and status = 'active'`),
  ]);
}
