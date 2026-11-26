import { recentHour } from '../../lib/newswire/edition';
import { EditionDelivery } from './edition-delivery';

export const dynamic = 'force-dynamic';
export const metadata = {title:'Livraison de l’édition horaire', robots:{index:false,follow:false}};

export default async function Page({searchParams}:{searchParams:Promise<{hour?:string}>}) {
  const {hour} = await searchParams;
  const selected = hour || new Date().toISOString().slice(0,13);
  return <main className="wrap" style={{maxWidth:760,paddingBlock:42}}>
    <a href="/">BYRVOX</a>
    <h1 style={{fontSize:'2rem',marginBlock:20}}>Édition horaire</h1>
    {recentHour(selected) ? <EditionDelivery hour={selected}/> : <p>L’heure indiquée est invalide ou dépasse le délai de reprise de trois jours.</p>}
  </main>;
}
