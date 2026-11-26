import { headers } from 'next/headers';
import { chatGPTSignInPath, getChatGPTUser } from '../app/chatgpt-auth';
import { SITE_ORIGIN } from '../lib/site-url';
import { newsroomUser } from '../lib/access';
import { PortalThemeToggle } from '../app/admin/theme-toggle';
import Admin from '../app/admin/ui';
import '../app/admin/portal.css';

export async function EditorPortal() {
  const user = await newsroomUser();
  if (user) return <Admin initialRole={user.role}/>;
  const onCustomDomain = (await headers()).get('host') === new URL(SITE_ORIGIN).host;
  const native = onCustomDomain ? null : await getChatGPTUser();
  const signInHref = onCustomDomain ? '/api/editor-session/start' : chatGPTSignInPath('/admin');
  return <main className="portal-entry">
    <div className="portal-entry-box">
      <div className="portal-entry-header"><a className="brand edition-brand" href={SITE_ORIGIN} aria-label="BYRVOX, accueil"><span className="brand-mark" aria-hidden="true"/></a><PortalThemeToggle/></div>
      <h1>{native ? 'Accès réservé' : 'Portail éditeur'}</h1>
      <p>{native ? 'Demande au propriétaire de la rédaction d’inviter l’adresse de ton compte ou connecte-toi avec l’adresse invitée.' : 'Connecte-toi avec le compte ChatGPT associé à ton adresse de propriétaire ou à l’adresse que la rédaction a invitée.'}</p>
      {native ? <form method="post" action="/api/editor-session/logout"><button className="outline">Changer de compte</button></form>
        : <a className="red" href={signInHref} target="_top">Se connecter à la rédaction</a>}
      <a className="portal-return" href={SITE_ORIGIN}>Retour au site</a>
    </div>
  </main>;
}
