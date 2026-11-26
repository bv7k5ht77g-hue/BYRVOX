'use client';
import {useState} from 'react';

export function EditionDelivery({hour,maxRank}:{hour:string;maxRank:number}) {
  const [running,setRunning] = useState(false);
  const [results,setResults] = useState<string[]>([]);
  async function deliver(){
    if (running) return;
    setRunning(true); setResults([]);
    let published = 0, failures = 0;
    try {
      // Deliver the top-ranked article last so it can lead an automatically ordered edition.
      for (let rank=maxRank;rank>=1;rank--) {
        try {
          const response = await fetch('/api/newswire',{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({hour,rank})});
          const data = await response.json() as {status?: string; slug?: string; error?: string};
          if (!response.ok) {
            failures++;
            setResults(lines=>[...lines,'Rang '+rank+' · '+(data.error || 'Échec de livraison')]);
            if (response.status===400) break;
          } else if (data.status!=='no_entry') {
            if (data.status==='published') published++;
            setResults(lines=>[...lines,'Rang '+rank+' · '+data.slug+' · '+(data.status==='published'?'publié':'déjà traité')]);
          }
        } catch {
          failures++;
          setResults(lines=>[...lines,'Rang '+rank+' · connexion interrompue. Relance la livraison.']);
        }
      }
    } finally {
      setResults(lines=>[...lines,published+' nouvelle(s) publication(s) · '+failures+' échec(s).']);
      setRunning(false);
    }
  }
  return <section>
    <p>Livraison de l’édition du <strong>{hour.slice(0,13).replace('T',' à ')} h UTC</strong> depuis le dépôt de la rédaction.</p>
    <button type="button" className="red" disabled={running} onClick={deliver} style={{marginBlock:18}}>
      {running?'Livraison en cours…':'Publier l’édition GitHub'}
    </button>
    <ol aria-live="polite">{results.map((r,i)=><li key={i}>{r}</li>)}</ol>
    <p><a href="/api/newswire">Consulter le registre des publications</a></p>
  </section>;
}
