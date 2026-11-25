import { SITE_ORIGIN } from '../../lib/site-url';
import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

type Lead = { articleId: string | null; title: string | null };
type Choice = { id: string; title: string; isLive: boolean };

export function LeadSelector({ articles }: { articles: Choice[] }) {
  const [current, setCurrent] = useState<Lead | null>(null);
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/newsroom/lead', { cache: 'no-store', signal: controller.signal }).then(async response => {
      if (!response.ok) throw Error();
      const result = await response.json() as Lead;
      setCurrent(result); setSelected(result.articleId || ''); setLoadFailed(false); setNotice('');
    }).catch(() => {
      if (!controller.signal.aborted) { setNotice('Le choix de la une est temporairement indisponible.'); setLoadFailed(true); }
    });
    return () => controller.abort();
  }, [attempt]);

  async function save() {
    setSaving(true); setNotice('');
    try {
      const response = await fetch('/api/newsroom/lead', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ articleId: selected || null })
      });
      if (!response.ok) throw Error();
      const result = await response.json() as Lead;
      setCurrent(result); setSelected(result.articleId || ''); setNotice('La une a été mise à jour.');
    } catch { setNotice('Impossible de modifier la une. Vérifie que l’article est toujours publié.'); }
    finally { setSaving(false); }
  }

  const options = articles.filter(article => article.isLive);
  return <section className="panel portal-lead" aria-labelledby="lead-title">
    <h2 id="lead-title">Article à la une</h2>
    {current && <p>{current.articleId ? <>Choix actuel · <strong>{current.title || 'Article sélectionné'}</strong></> :
      'La dernière publication apparaît automatiquement à la une.'}</p>}
    <label>Article présenté sur l’accueil<select value={selected} disabled={!current || saving}
      onChange={event => { setSelected(event.target.value); setNotice(''); }}>
      <option value="">Dernière publication (automatique)</option>
      {current?.articleId && !options.some(article => article.id === current.articleId) &&
        <option value={current.articleId}>{current.title || 'Article sélectionné'}</option>}
      {options.map(article => <option key={article.id} value={article.id}>
        {article.id === current?.articleId && current.title ? current.title : article.title}</option>)}
    </select></label>
    <div className="button-row"><button className="outline" disabled={!current || saving || selected === (current.articleId || '')}
      onClick={save}>{saving ? 'Enregistrement…' : 'Enregistrer la une'}</button>
      <a className="portal-link" href={SITE_ORIGIN} target="_blank" rel="noreferrer" aria-label="Voir l’accueil, nouvel onglet">Voir l’accueil <ExternalLink size={15} aria-hidden="true" /></a>
      {loadFailed && <button className="outline" onClick={() => setAttempt(value => value + 1)}>Réessayer</button>}
    </div>
    {notice && <p role="status">{notice}</p>}
  </section>;
}
