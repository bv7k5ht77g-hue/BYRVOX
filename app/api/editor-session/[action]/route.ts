import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from '../../../chatgpt-auth';
import { newsroomRole, sameOrigin } from '../../../../lib/access';
import { cookieHeader, exchangeGrant, getCookie, hashSecret, issueGrant, randomSecret, revokeEditorSession,
  sessionCookie, sessionLifetime, validSecret, verifierCookie } from '../../../../lib/editor-session';
import { boundedBytes } from '../../../../lib/input';
import { NEWSROOM_URL, SIGN_IN_ORIGIN, SITE_ORIGIN } from '../../../../lib/site-url';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ action: string }> };
const privateHeaders = { 'Cache-Control':'private, no-store', 'Referrer-Policy':'no-referrer', 'X-Frame-Options':'DENY' };
const authorizePath = '/api/editor-session/authorize';
const finishUrl = SITE_ORIGIN + '/api/editor-session/finish';
const denied = () => new Response('Connexion refusée ou expirée. Rouvre le portail BYRVOX pour te reconnecter.', {status:403, headers:privateHeaders});
const go = (url: string) => new Response(null, {status:303, headers:{ ...privateHeaders, Location:url }});

export async function GET(req: Request, { params }: Props) {
  const {action} = await params;
  const url = new URL(req.url);
  if (action === 'start' && url.origin === SITE_ORIGIN) {
    const proof = randomSecret();
    const response = go(SIGN_IN_ORIGIN + authorizePath + '?challenge=' + await hashSecret(proof));
    response.headers.append('Set-Cookie',cookieHeader(verifierCookie,proof,600));
    return response;
  }
  const challenge = url.searchParams.get('challenge');
  if (action !== 'authorize' || url.origin !== SIGN_IN_ORIGIN || !validSecret(challenge)) return denied();
  const native = await getChatGPTUser();
  if (!native) return go(SIGN_IN_ORIGIN + chatGPTSignInPath(authorizePath + '?challenge=' + challenge));
  if (!await newsroomRole(native)) return denied();
  const grant = await issueGrant(native,challenge);
  const nonce = randomSecret();
  // Only the grant is posted. The independent browser proof remains on the custom origin.
  const html = '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Connexion à BYRVOX</title>' +
    '<form method="post" action="' + finishUrl + '"><input type="hidden" name="grant" value="' + grant +
    '"><button>Ouvrir le portail BYRVOX</button></form><script nonce="' + nonce + '">document.forms[0].submit()</script></html>';
  return new Response(html, {headers:{...privateHeaders,'Referrer-Policy':'origin','Content-Type':'text/html; charset=utf-8',
    'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action " + SITE_ORIGIN + "; script-src 'nonce-" + nonce + "'" }});
}

export async function POST(req: Request, {params}: Props) {
  const {action} = await params;
  const origin = new URL(req.url).origin;
  if (action === 'logout' && sameOrigin(req)) {
    const token = getCookie(req.headers.get('cookie'), sessionCookie);
    if (origin === SITE_ORIGIN && validSecret(token)) await revokeEditorSession(token);
    const response = go(origin !== SITE_ORIGIN && await getChatGPTUser() ? origin + chatGPTSignOutPath('/admin') : NEWSROOM_URL);
    response.headers.append('Set-Cookie',cookieHeader(sessionCookie,'',0));
    return response;
  }
  if (action !== 'finish' || origin !== SITE_ORIGIN || req.headers.get('origin') !== SIGN_IN_ORIGIN ||
      req.headers.get('content-type')?.split(';')[0] !== 'application/x-www-form-urlencoded') return denied();
  const proof = getCookie(req.headers.get('cookie'),verifierCookie);
  if (!validSecret(proof)) return denied();
  let body: string;
  try { body = new TextDecoder().decode(await boundedBytes(req, 512)); } catch { return denied(); }
  const grant = new URLSearchParams(body).get('grant');
  if (!validSecret(grant)) return denied();
  const session = await exchangeGrant(grant,proof);
  if (!session || !await newsroomRole(session)) return denied();
  const response = go(NEWSROOM_URL);
  response.headers.append('Set-Cookie',cookieHeader(sessionCookie,session.token,sessionLifetime));
  response.headers.append('Set-Cookie',cookieHeader(verifierCookie,'',0));
  return response;
}
