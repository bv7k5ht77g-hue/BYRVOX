import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { NEWSROOM_URL, NEW_SITE_ORIGIN, SITE_ORIGIN } from '../lib/site-url';
import { newsroomUser } from '../lib/access';
import { PortalThemeToggle } from '../app/admin/theme-toggle';
import Admin from '../app/admin/ui';
import '../app/admin/portal.css';

export async function EditorPortal() {
  if ((await headers()).get('host') !== new URL(SITE_ORIGIN).host) redirect(NEWSROOM_URL);
  const user = await newsroomUser();
  if (user) return <Admin initialRole={user.role}/>;
  return <main className="portal-entry">
    <div className="portal-entry-box">
      <div className="portal-entry-header"><a className="brand edition-brand" href={NEW_SITE_ORIGIN} aria-label="BYRVOX, accueil"><span className="brand-mark" aria-hidden="true"/></a><PortalThemeToggle/></div>
      <h1>Portail éditeur</h1>
      <p>Utilise le compte ChatGPT associé à l’adresse que la rédaction a invitée.</p>
      <a className="red" href="/api/editor-session/start" target="_top">Se connecter à la rédaction</a>
      <a className="portal-return" href={NEW_SITE_ORIGIN}>Retour au site</a>
    </div>
  </main>;
}
