import { EditorPortal } from '../../components/editor-portal';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Portail éditeur', robots: { index: false, follow: false } };

export default function Page() {
  return EditorPortal({ returnTo: "/editeur" });
}
