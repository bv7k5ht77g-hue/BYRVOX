import { clerkConfiguration, verifyReaderToken } from '../../../../lib/reader-clerk';
import { recordReaderSignIn } from '../../../../lib/reader-accounts';
import { startReaderSession, endReaderSession } from '../../../../lib/reader-auth';
import { NEW_SITE_ORIGIN } from '../../../../lib/site-url';

export async function POST(request:Request,{params}:{params:Promise<{action:string}>}) {
  const {action} = await params;
  const headers = new Headers({'Cache-Control':'private, no-store'});
  if (new URL(request.url).origin !== NEW_SITE_ORIGIN || request.headers.get('origin') !== NEW_SITE_ORIGIN) {
    return Response.json({error:'Accès interdit.'},{status:403,headers});
  }
  if (action === 'logout') {
    headers.set('Set-Cookie',await endReaderSession(request));
    return Response.json({ok:true},{headers});
  }
  if (action !== 'activate') return new Response(null,{status:404,headers});
  const config = clerkConfiguration();
  if (!config) return Response.json({error:'Connexion temporairement indisponible.'},{status:503,headers});
  const bearer = /^Bearer ([^\s]+)$/.exec(request.headers.get('authorization') || '');
  const result = bearer ? await verifyReaderToken(bearer[1],config).catch(() => undefined) : null;
  if (result === undefined) return Response.json({error:'Connexion temporairement indisponible.'},{status:503,headers});
  if (!result) return Response.json({error:'Session non vérifiée.'},{status:401,headers});
  const status = await recordReaderSignIn(result.identity,request);
  // Retain the verified subject for restricted accounts so the Worker can display their status on navigation.
  headers.set('Set-Cookie',await startReaderSession(result.identity.userId,result.expiresAt,request));
  return Response.json({status},{status:status === 'active' ? 200 : 403, headers});
}
