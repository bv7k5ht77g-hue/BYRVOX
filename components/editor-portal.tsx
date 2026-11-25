import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { chatGPTSignInPath, getChatGPTUser } from '../app/chatgpt-auth';
import { NEWSROOM_URL, SITE_ORIGIN } from '../lib/site-url';
import { admin } from '../lib/access';
import Admin from '../app/admin/ui';

export async function EditorPortal({ returnTo }: { returnTo: '/admin' | '/editeur' }) {
  if (!await getChatGPTUser()) {
    const publicHost = new URL(SITE_ORIGIN).host;
    if (returnTo === '/editeur' || (await headers()).get('host') === publicHost) {
      redirect(NEWSROOM_URL);
    }
    redirect(chatGPTSignInPath('/admin'));
  }
  if (!await admin()) {
    return <main className="article-page"><h1>Accès réservé</h1>
      <p>Seuls les membres autorisés de la rédaction peuvent ouvrir le portail éditeur.</p>
      <a className="outline" href={SITE_ORIGIN}>Retour au site</a>
    </main>;
  }
  return <Admin />;
}
