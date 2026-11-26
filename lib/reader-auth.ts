import { getChatGPTUserFromHeaders } from '../app/chatgpt-auth';
import { and, eq, gt, lt, or } from 'drizzle-orm';
import { getDb } from '../db';
import { preferences, readerAccounts, readerSessions } from '../db/schema';
import { cookieHeader, getCookie, hashSecret, randomSecret, validSecret } from './editor-session';
import { recordReaderActivity, recordReaderSignIn, type ReaderStatus } from './reader-accounts';
import { preferredLocale } from './i18n';
import { legacySignOutUrl, readerAccountUrl, readerText } from './reader-links';
import { NEW_SITE_ORIGIN, SIGN_IN_ORIGIN } from './site-url';

export const readerCookie = '__Host-byrvox-reader';
const now = () => Math.floor(Date.now() / 1000);
const tokenFrom = (request: Request) => getCookie(request.headers.get('cookie'), readerCookie);

// Only the platform's canonical authentication origin supplies trusted native credentials.
async function getLegacyReader(request:Request) {
  const native = getChatGPTUserFromHeaders(request.headers);
  if (!native || native.userId.startsWith('clerk:')) return null;
  const db = getDb();
  const reader = await db.select({userId:readerAccounts.userId,email:readerAccounts.email,status:readerAccounts.status,
    firstName:readerAccounts.firstName,lastName:readerAccounts.lastName}).from(readerAccounts)
    .where(eq(readerAccounts.userId,native.userId)).get();
  if (reader) return reader;
  // Only established preference owners can use this recovery path. Keep the original provider ID.
  const old = await db.select({id:preferences.userId}).from(preferences).where(eq(preferences.userId,native.userId)).get();
  if (!old) return null;
  const identity = {userId:native.userId,email:native.email,firstName:null,lastName:null};
  const status = await recordReaderSignIn(identity,request);
  return {...identity,status};
}

async function getReader(request: Request) {
  if (new URL(request.url).origin === SIGN_IN_ORIGIN) return getLegacyReader(request);
  const token = tokenFrom(request);
  if (!validSecret(token) || new URL(request.url).origin !== NEW_SITE_ORIGIN) return null;
  return await getDb().select({
    userId:readerAccounts.userId, email:readerAccounts.email, status:readerAccounts.status,
    firstName:readerAccounts.firstName, lastName:readerAccounts.lastName,
  }).from(readerSessions).innerJoin(readerAccounts, eq(readerSessions.userId, readerAccounts.userId))
    .where(and(eq(readerSessions.digest,await hashSecret(token)),gt(readerSessions.expiresAt,now()))).get();
}

export async function getActiveReader(request: Request) {
  const reader = await getReader(request);
  return reader?.status === 'active' ? {...reader, displayName:[reader.firstName,reader.lastName].filter(Boolean).join(' ') || reader.email} : null;
}

export async function startReaderSession(userId:string, providerExpiry:number, request:Request) {
  const token = randomSecret();
  const previous = tokenFrom(request);
  const expired = lt(readerSessions.expiresAt, now());
  const age = Math.max(0, Math.min(8 * 60 * 60, providerExpiry - now()));
  const db = getDb();
  await db.batch([
    db.delete(readerSessions).where(validSecret(previous) ? or(expired,eq(readerSessions.digest,await hashSecret(previous))) : expired),
    db.insert(readerSessions).values({digest:await hashSecret(token), userId, expiresAt:now()+age}),
  ]);
  return cookieHeader(readerCookie,token,age);
}

export async function endReaderSession(request: Request) {
  const token = tokenFrom(request);
  if (validSecret(token)) {
    const [row] = await getDb().delete(readerSessions).where(eq(readerSessions.digest,await hashSecret(token)))
      .returning({userId:readerSessions.userId});
    if (row) await recordReaderActivity(row.userId,'signout',null,request);
  }
  return cookieHeader(readerCookie,'',0);
}

export async function handleReaderAccess(request: Request, ctx: Pick<ExecutionContext,'waitUntil'>) {
  const url = new URL(request.url);
  if (url.origin === SIGN_IN_ORIGIN) {
    if (!request.headers.get('oai-authenticated-user-id')) return null;
  } else if (url.origin !== NEW_SITE_ORIGIN || !validSecret(tokenFrom(request))) return null;
  // Enforce account status before delivery, including cached public HTML and profile data.
  if (['/compte','/signin-with-chatgpt','/signout-with-chatgpt','/callback'].includes(url.pathname) || /^\/(?:admin|editeur|api\/(?:reader-session|editor-session|newsroom)|_next|assets|media|brand)(?:\/|$)/.test(url.pathname)) return null;
  const reader = await getReader(request);
  if (!reader) return null;
  if (reader.status !== 'active') return blockedReaderResponse(request,reader.status);
  if (request.method === 'GET' && (url.pathname === '/' || url.pathname.startsWith('/article/')) &&
      request.headers.get('accept')?.includes('text/html') && !request.headers.has('rsc') &&
      !request.headers.has('next-router-prefetch') && ![request.headers.get('purpose'), request.headers.get('sec-purpose')].some(value => value?.includes('prefetch'))) {
    ctx.waitUntil(recordReaderActivity(reader.userId,'page',url.pathname,request));
  }
  return null;
}

function blockedReaderResponse(request: Request, status: Exclude<ReaderStatus,'active'>) {
  const url = new URL(request.url);
  const locale = preferredLocale(url.searchParams.get('lang'),getCookie(request.headers.get('cookie'),'byrvox-language'));
  const message = readerText(locale,status);
  const headers = {'Cache-Control':'private, no-store','X-Robots-Tag':'noindex'};
  if (url.pathname.startsWith('/api/')) return Response.json({error:message,status}, {status:403,headers});
  const logout = (url.origin === SIGN_IN_ORIGIN ? legacySignOutUrl(locale) : readerAccountUrl('sortie','/',locale)).replaceAll('&','&amp;');
  const html = '<!doctype html><html lang="' + locale + '" dir="' + (locale === 'ar' ? 'rtl' : 'ltr') +
    '"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BYRVOX</title>' +
    '<main><p>BYRVOX</p><h1>' + message + '</h1><p><a href="' + logout + '">' + readerText(locale,'sortie') + '</a></p></main></html>';
  return new Response(html, {status:403,headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
}
