import { useEffect, useState, type FormEvent } from 'react';
import type { ArticleAdState } from '../../lib/article-ad-policy';
import { AdPortalSignIn } from './ad-portal-sign-in';
import { AdPortalError, adPortalError, adPortalRequest } from './ad-portal-request';
import { articleIdentifier } from './open-article';

type Inspection = {slug:string; title:string; state:ArticleAdState; editable:boolean};

const policyCopy: Record<ArticleAdState,string> = {
  allowed:'Diffusion autorisée. Les emplacements configurés peuvent demander une annonce à la régie.',
  pending:'Validation éditoriale en attente. Les emplacements visibles sont réservés et aucune annonce n’est demandée pour cet article.',
  off:'Publicité désactivée par la rédaction. Tous les emplacements de cet article sont masqués, y compris son pied de page.',
};

async function inspectArticle(identifier: string, signal?:AbortSignal) {
  const data = await adPortalRequest<{article:Inspection}>(
    '/api/newsroom/ads?' + new URLSearchParams({article:identifier}), {cache:'no-store', signal});
  if (!data.article || !Object.hasOwn(policyCopy, data.article.state)) throw new AdPortalError('Le portail n’a renvoyé aucun statut publicitaire pour cet article.');
  return data.article;
}

export function ArticleAdInspector({busy, openReview, initialArticle = ''}: {busy:boolean; openReview:(slug:string)=>Promise<void>; initialArticle?:string}) {
  const [input, setInput] = useState(initialArticle);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Inspection|null>(null);
  const [error, setError] = useState<AdPortalError|null>(null);
  const [inspection, setInspection] = useState({identifier:initialArticle});

  useEffect(() => {
    if (!inspection.identifier) return;
    const controller = new AbortController();
    setLoading(true);
    void inspectArticle(inspection.identifier, controller.signal)
      .then(article => { if (!controller.signal.aborted) setResult(article); })
      .catch(cause => { if (!controller.signal.aborted) setError(adPortalError(cause, 'Impossible de vérifier cet article.')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [inspection]);

  function inspect(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const identifier = articleIdentifier(input);
    setError(null); setResult(null);
    if (!identifier) { setError(new AdPortalError('Saisis le lien d’un article BYRVOX ou son identifiant.')); return; }
    setInspection({identifier});
  }
  return <details className="panel ad-inspector" open={initialArticle ? true : undefined}>
    <summary>Vérifier la publicité d’un article</summary>
    <form onSubmit={inspect}>
      <label>Lien ou identifiant de l’article<input required maxLength={1000} disabled={loading} value={input}
        onChange={event => {setInput(event.target.value); setResult(null); setError(null);}}/></label>
      <button className="outline" disabled={busy || loading || !input.trim()}>{loading ? 'Vérification…' : 'Vérifier'}</button>
    </form>
    {error && <p role="alert">{error.message} {error.status === 401 &&
      <AdPortalSignIn article={articleIdentifier(input)}/>}</p>}
    {result && <div role="status">
      <strong>{result.title}</strong><p>{policyCopy[result.state]}</p>
      {result.editable && <button type="button" className="outline" disabled={busy || loading} onClick={() => {
        void openReview(result.slug).catch(() => setError(new AdPortalError('Impossible d’ouvrir la validation de cet article.')));
      }}>Ouvrir la validation publicitaire</button>}
    </div>}
  </details>;
}
