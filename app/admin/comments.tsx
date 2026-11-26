'use client';

import { useEffect, useState } from 'react';
import { articleUrl, NEW_SITE_ORIGIN } from '../../lib/site-url';

const filters = { pending: 'À modérer', approved: 'Publiés', rejected: 'Écartés' } as const;
type Status = keyof typeof filters;
type Comment = { id: string; slug: string; body: string; createdAt: string; status: Status; authorName: string };
type Page = { comments: Comment[]; hasMore: boolean };
const dateFormat = new Intl.DateTimeFormat('fr-CA', {dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Toronto'});
const emptyMessages = {pending:'Aucun commentaire en attente.', approved:'Aucun commentaire publié sur cette page.', rejected:'Aucun commentaire écarté sur cette page.'};

export function CommentsPanel() {
  const [status, setStatus] = useState<Status>('pending');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Page | null>(null);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const response = await fetch('/api/newsroom/comments?' + new URLSearchParams({status, page: String(page)}), {cache: 'no-store', signal: controller.signal});
      if (!response.ok) throw new Error();
      const data: Page = await response.json();
      if (!data.comments.length && page > 1) setPage(page - 1);
      else setResult(data);
    }
    setResult(null);
    setError('');
    load().catch(() => { if (!controller.signal.aborted) setError('Impossible de charger les commentaires.'); });
    return () => controller.abort();
  }, [status, page, revision]);

  async function moderate(comment: Comment, next: Exclude<Status,'pending'>) {
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const response = await fetch('/api/newsroom/comments', {
        method: 'PATCH', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({id: comment.id, expectedStatus: comment.status, status: next}),
      });
      if (response.status === 409) setNotice('La rédaction a déjà modifié ce commentaire. La liste a été actualisée.');
      else if (!response.ok) throw new Error();
      else setNotice(next === 'approved' ? 'Commentaire publié.' : 'Commentaire écarté.');
      setRevision(v => v + 1);
    } catch { setError('Impossible d’enregistrer cette décision.'); }
    finally { setBusy(false); }
  }
  return <section className="panel moderation-panel">
    <label>Afficher les commentaires
      <select value={status} disabled={busy} onChange={event => {
        setStatus(event.target.value as Status); setPage(1); setNotice('');
      }}>
        {Object.entries(filters).map(([value,label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
    {notice && <p role="status">{notice}</p>}
    {error && <p role="alert">{error} <button className="outline" type="button" onClick={() => setRevision(v => v + 1)}>Actualiser</button></p>}
    {!result && !error && <p role="status">Chargement des commentaires…</p>}
    {result && !result.comments.length && <p>{emptyMessages[status]}</p>}
    {result && result.comments.length > 0 && <ul className="portal-members">
      {result.comments.map(comment => <li key={comment.id}>
        <div className="moderation-byline"><strong dir="auto">{comment.authorName || 'Lecteur BYRVOX'}</strong>
          <time dateTime={comment.createdAt}>{dateFormat.format(new Date(comment.createdAt))}</time>
        </div>
        <p className="moderation-body" dir="auto">{comment.body}</p>
        <div className="button-row">
          <a href={articleUrl(comment.slug,NEW_SITE_ORIGIN)} target="_blank" rel="noreferrer">Lire l’article ↗</a>
          {status !== 'approved' && <button type="button" className="red" disabled={busy} onClick={() => moderate(comment,'approved')}>Publier</button>}
          {status !== 'rejected' && <button type="button" className="outline" disabled={busy} onClick={() => moderate(comment,'rejected')}>{status === 'approved' ? 'Retirer' : 'Écarter'}</button>}
        </div>
      </li>)}
    </ul>}
    {result && (page > 1 || result.hasMore) && <nav className="reader-pagination" aria-label="Pagination des commentaires">
      <button type="button" className="outline" disabled={busy || page === 1} onClick={() => setPage(page - 1)}>Précédent</button>
      <span>Page {page}</span>
      <button type="button" className="outline" disabled={busy || !result.hasMore} onClick={() => setPage(page + 1)}>Suivant</button>
    </nav>}
  </section>;
}
