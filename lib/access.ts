import {env} from 'cloudflare:workers';
import {headers} from 'next/headers';
import { getChatGPTUser } from '../app/chatgpt-auth';
import { getCookie, getEditorSession, sessionCookie, validSecret } from './editor-session';
import { SITE_ORIGIN } from './site-url';

export function runtime(name: string) {
  return (env as unknown as Record<string,string>)[name] || '';
}
export function canEdit(email: string) {
  return runtime('ADMIN_EMAILS').toLowerCase().split(',').map(value => value.trim()).filter(Boolean).includes(email.toLowerCase());
}
export async function admin() {
  const requestHeaders = await headers();
  if (requestHeaders.get('host') !== new URL(SITE_ORIGIN).host) {
    const native = await getChatGPTUser();
    return native && canEdit(native.email) ? native : null;
  }
  const token = getCookie(requestHeaders.get('cookie'), sessionCookie);
  if (!validSecret(token)) return null;
  const user = await getEditorSession(token);
  return user && canEdit(user.email) ? user : null;
}
export function sameOrigin(req: Request) {
  return req.headers.get('origin') === new URL(req.url).origin;
}
