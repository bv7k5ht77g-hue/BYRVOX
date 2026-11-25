import Link from 'next/link';
import { requireChatGPTUser } from '../chatgpt-auth';
import { admin } from '../../lib/access';
import Admin from './ui';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireChatGPTUser('/admin');
  if (!await admin()) {
    return <main className="article-page"><h1>Accès réservé</h1>
      <p>Seuls les membres autorisés de la rédaction peuvent ouvrir le Command Center.</p>
      <Link className="outline" href="/">Retour au site</Link>
    </main>;
  }
  return <Admin/>;
}
