import { env } from 'cloudflare:workers';
import { NEW_SITE_ORIGIN } from './site-url';

export function clerkConfiguration() {
  const bindings = env as unknown as Record<string, string | undefined>;
  const key = bindings.CLERK_PUBLISHABLE_KEY || '';
  const pk = /^pk_(?:live|test)_([a-zA-Z0-9+/=_-]+)$/.exec(key);
  if (!pk || !bindings.CLERK_SECRET_KEY) return null;
  try {
    const domain = atob(pk[1].replace(/-/g,'+').replace(/_/g,'/'));
    if (!/^([a-z0-9-]+\.)+[a-z0-9-]+\$$/.test(domain)) return null;
    return {publishableKey:key, issuer:'https://' + domain.slice(0, -1), secret:bindings.CLERK_SECRET_KEY};
  } catch { return null; }
}

function jwtBytes(value: string) {
  return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')), char => char.charCodeAt(0));
}

async function fetchClerkJson(url: string, secret?: string) {
  const response = await fetch(url, {
    redirect:'manual',
    signal:AbortSignal.timeout(7000),
    headers: secret ? {Authorization:'Bearer ' + secret, Accept:'application/json'} : {Accept:'application/json'},
  });
  if (response.status === 404 || response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error('Clerk is unavailable');
  return response.json();
}

type PublicKey = JsonWebKey & {kid?:string};
type ClerkSession = {id:string; user_id:string; status:string; expire_at:number};
type ClerkUser = {
  id:string; banned?:boolean; locked?:boolean; first_name:string|null; last_name:string|null;
  primary_email_address_id:string; email_addresses:{id:string;email_address:string;verification?:{status?:string}}[];
};

export async function verifyReaderToken(token: string, config: NonNullable<ReturnType<typeof clerkConfiguration>>) {
  if (token.length > 8192 || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) return null;
  const [header, claims, signature] = token.split('.');
  let jwtHeader, payload, signatureBytes;
  try {
    jwtHeader = JSON.parse(new TextDecoder().decode(jwtBytes(header)));
    payload = JSON.parse(new TextDecoder().decode(jwtBytes(claims)));
    signatureBytes = jwtBytes(signature);
  } catch { return null; }
  const now = Date.now() / 1000;
  if (jwtHeader?.alg !== 'RS256' || typeof jwtHeader.kid !== 'string' || jwtHeader.crit !== undefined ||
      payload?.iss !== config.issuer || payload.azp !== NEW_SITE_ORIGIN ||
      !Number.isSafeInteger(payload.exp) || payload.exp <= now ||
      !Number.isSafeInteger(payload.iat) || payload.iat > now + 5 ||
      !Number.isSafeInteger(payload.nbf) || payload.nbf > now + 5 ||
      payload.exp <= payload.iat || payload.sts === 'pending' ||
      typeof payload.sid !== 'string' || !/^sess_[a-z0-9]+$/i.test(payload.sid) ||
      typeof payload.sub !== 'string' || !/^user_[a-z0-9]+$/i.test(payload.sub)) return null;
  const jwks = await fetchClerkJson(config.issuer + '/.well-known/jwks.json') as {keys:PublicKey[]} | null;
  const jwk = jwks?.keys?.find(k => k.kid === jwtHeader.kid && k.kty === 'RSA' &&
    (!k.use || k.use === 'sig') && (!k.alg || k.alg === 'RS256'));
  if (!jwk) return null;
  const algorithm = {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'};
  const key = await crypto.subtle.importKey('jwk', jwk, algorithm, false, ['verify']);
  if (!await crypto.subtle.verify(algorithm.name, key, signatureBytes, new TextEncoder().encode(header + '.' + claims))) return null;

  const backend = 'https://api.clerk.com/v1';
  const [session, user] = await Promise.all([
    fetchClerkJson(backend + '/sessions/' + payload.sid, config.secret) as Promise<ClerkSession|null>,
    fetchClerkJson(backend + '/users/' + payload.sub, config.secret) as Promise<ClerkUser|null>,
  ]);
  if (session?.status !== 'active' || session.id !== payload.sid || session.user_id !== payload.sub ||
      !Number.isFinite(session.expire_at) || session.expire_at <= Date.now() ||
      !user || user.id !== payload.sub || user.banned || user.locked) return null;
  const email = user.email_addresses.find(address => address.id === user.primary_email_address_id);
  if (!email?.email_address || email.verification?.status !== 'verified') return null;
  return {identity:{userId:'clerk:' + user.id, email:email.email_address, firstName:user.first_name, lastName:user.last_name},
    expiresAt:Math.floor(session.expire_at / 1000)};
}
