import { requireChatGPTUser } from '../app/chatgpt-auth';
import { admin } from '../lib/access';
import Admin from '../app/admin/ui';

export async function EditorPortal({ returnTo }: { returnTo: '/admin' | '/editeur' }) {
  await requireChatGPTUser(returnTo);
  if (!await admin()) {
    return <main className="article-page"><h1>Accès réservé</h1>
      <p>Seuls les membres autorisés de la rédaction peuvent ouvrir le portail éditeur.</p>
      <a className="outline" href="/">Retour au site</a>
    </main>;
  }
  return <Admin />;
}
