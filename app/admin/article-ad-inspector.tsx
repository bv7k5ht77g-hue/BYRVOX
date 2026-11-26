import { useState, type FormEvent } from 'react';
import type { ArticleAdState } from '../../lib/article-ad-policy';
import { articleIdentifier } from './open-article';

type Inspection = {slug:string; title:string; state:ArticleAdState; editable:boolean};

const policyCopy: Record<ArticleAdState,string> = {
  allowed:'Diffusion autorisée. Les emplacements configurés peuvent demander une annonce à la régie.',
  pending:'Validation éditoriale en attente. Les emplacements visibles sont réservés et aucune annonce n’est demandée pour cet article.',
  off:'Publicité désactivée par la rédaction. Tous les emplacements de cet article sont masqués, y compris son pied de page.',
};

export function ArticleAdInspector({busy, openReview}: {busy:boolean; openReview:(slug:string)=>Promise<void>}) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Inspection|null>(null);
  const [error, setError] = useState('');
  async function inspect(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const identifier = articleIdentifier(input);
    setError(''); setResult(null);
    if (!identifier) { setError('Saisis le lien d’un article BYRVOX ou son identifiant.'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/newsroom/ads?' + new URLSearchParams({article:identifier}), {cache:'no-store'});
      const data = await response.json() as {article?:Inspection; error?:string};
      if (!response.ok || !data.article) throw Error(data.error || 'Impossible de vérifier cet article.');
      setResult(data.article);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Impossible de vérifier cet article.'); }
    finally { setLoading(false); }
  }
  return <details className="panel ad-inspector">
    <summary>Vérifier la publicité d’un article</summary>
    <form onSubmit={inspect}>
      <label>Lien ou identifiant de l’article<input required maxLength={1000} disabled={loading} value={input}
        onChange={event => {setInput(event.target.value); setResult(null); setError('');}}/></label>
      <button className="outline" disabled={busy || loading || !input.trim()}>{loading ? 'Vérification…' : 'Vérifier'}</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {result && <div role="status">
      <strong>{result.title}</strong><p>{policyCopy[result.state]}</p>
      {result.editable && <button type="button" className="outline" disabled={busy || loading} onClick={() => {
        void openReview(result.slug).catch(() => setError('Impossible d’ouvrir la validation de cet article.'));
      }}>Ouvrir la validation publicitaire</button>}
    </div>}
  </details>;
}
