import { redirect } from 'next/navigation';
import { NEWSROOM_URL } from '../../lib/site-url';
export const metadata = { title: 'Portail éditeur', robots: { index: false, follow: false } };
export default function Page() { redirect(NEWSROOM_URL); }
