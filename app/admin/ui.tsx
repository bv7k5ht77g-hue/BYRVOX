'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { articles, events, revisions, runs } from '../../db/schema';

type Source = { name: string; url: string };
type Article = Omit<typeof articles.$inferSelect, 'draft'> & { isLive: boolean };
type Editor = Pick<Article, 'id' | 'title' | 'category' | 'summary' | 'body' | 'risk' | 'status' | 'isLive'>
  & { version?: number; sources: Source[] };
type Newsroom = {
  articles: Article[];
  events: (typeof events.$inferSelect)[];
  revisions: (typeof revisions.$inferSelect)[];
  runs: (typeof runs.$inferSelect)[];
  generationConfigured: boolean;
};
const empty: Editor = {
  id: '', title: '', category: 'International', summary: '', body: '', risk: 'standard',
  sources: [], status: 'draft', isLive: false,
};
const tabs = ['Dashboard', 'Articles', 'Éditeur', 'PULSE AI', 'Studio AI', 'Historique', 'Intégrations'];
const categories = ['International', 'Politique', 'Économie', 'Société', 'Technologie', 'Environnement', 'Sports', 'Culture'];

function statusLabel(article: Pick<Article, 'status' | 'isLive'>) {
  if (article.status === 'published') return 'Publié';
  const state = article.status === 'review' ? 'En vérification' : 'Brouillon';
  return article.isLive ? state + ' · version précédente en ligne' : state;
}

async function loadNewsroom(): Promise<Newsroom> {
  const response = await fetch('/api/newsroom', { cache: 'no-store' });
  if (!response.ok) throw Error('Rédaction indisponible.');
  return await response.json() as Newsroom;
}

function editArticle(row: Article): Editor {
  return { ...row, sources: JSON.parse(row.sources) };
}

function ServiceList({ entries }: { entries: string[][] }) {
  return <>{entries.map(([name, value]) => <div className="status-line" key={name}><span>{name}</span><small>{value}</small></div>)}</>;
}

export default function Admin() {
  const [tab, setTab] = useState('Dashboard');
  const [data, setData] = useState<Newsroom>({ articles: [], events: [], revisions: [], runs: [], generationConfigured: false });
  const [loaded, setLoaded] = useState(false);
  const [edit, setEdit] = useState<Editor>(empty);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let active = true;
    loadNewsroom().then(result => {
      if (active) { setData(result); setLoaded(true); }
    }).catch(() => { if (active) setMessage('Impossible de charger la rédaction.'); });
    return () => { active = false; };
  }, []);

  function open(article?: Article) {
    setEdit(article ? editArticle(article) : empty);
    setDirty(false);
    setNotes('');
    setMessage('');
    setTab('Éditeur');
  }

  function change(patch: Partial<Editor>) {
    setEdit(previous => ({ ...previous, ...patch }));
    setDirty(true);
  }

  function updateSource(index: number, patch: Partial<Source>) {
    change({ sources: edit.sources.map((source, i) => i === index ? { ...source, ...patch } : source) });
  }

  async function action(url: string, input: object) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        if (response.status === 409) setData(await loadNewsroom());
        throw Error(result.error || 'Échec de l’opération.');
      }
      if (url === '/api/newsroom') {
        const row = await response.json() as Article;
        setEdit(editArticle(row));
        setDirty(false);
        setTab('Éditeur');
        setMessage(row.status === 'published' ? 'Article publié.' : 'Version enregistrée.');
      } else if (url === '/api/generate') {
        const result = await response.json() as Pick<Editor, 'title' | 'summary' | 'body'> & { message: string };
        change({ title: result.title, summary: result.summary, body: result.body });
        setMessage(result.message);
      } else {
        const result = await response.json() as { message: string };
        setMessage(result.message);
      }
      setData(await loadNewsroom());
      setLoaded(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Échec de l’opération.');
    } finally {
      setBusy(false);
    }
  }

  const aiStatus = loaded ? (data.generationConfigured ? 'Clé serveur configurée' : 'Clé serveur à configurer') : 'Chargement…';
  const canSubmit = !busy && edit.title.trim() && (dirty || edit.status !== 'published');

  return <div className="admin-shell">
    <aside className="sidebar">
      <Link href="/" className="brand"><Image unoptimized width={600} height={112} src="/brand/logo-dark.png" alt="BYRVOX"/></Link>
      {tabs.map(item => <button key={item} className={tab === item ? 'selected' : ''} aria-current={tab === item ? 'page' : undefined}
        disabled={busy} onClick={() => setTab(item)}>{item}</button>)}
      <Link href="/">↗ Voir le site</Link>
      <small>COMMAND CENTER<br/>BYRVOX<br/>Validation humaine avant publication.</small>
    </aside>
    <main className="admin-main">
      <div className="admin-top"><div><p className="eyebrow">BYRVOX COMMAND CENTER</p><h1>{tab}</h1></div>
        <button className="red" disabled={busy} onClick={() => open()}>+ Nouvel article</button>
      </div>
      {message && <div role="status" className="admin-note">{message}</div>}

      {tab === 'Dashboard' && <>
        <div className="stats">{[
          ['Articles récents', data.articles.length],
          ['À vérifier', data.articles.filter(article => article.status === 'review').length],
          ['En ligne', data.articles.filter(article => article.isLive).length],
          ['Pistes récentes', data.events.length],
        ].map(([title, value]) => <div className="stat" key={title}><small>{title}</small><b>{loaded ? value : '—'}</b></div>)}</div>
        <div className="admin-two"><section className="panel"><h2>La rédaction</h2>
          {data.articles.slice(0, 8).map(article => <button className="article-row" style={{ width: '100%', textAlign: 'left' }}
            key={article.id} onClick={() => open(article)}>
            <div><h3>{article.title}</h3><small>{article.category} · {new Date(article.updatedAt).toLocaleString('fr-CA')}</small></div>
            <span className="badge">{statusLabel(article)}</span>
          </button>)}
          {loaded && !data.articles.length && <p>Aucun article créé. Commence par un brouillon sourcé.</p>}
          <small>Statistiques des 100 derniers articles modifiés et des 50 dernières pistes collectées.</small>
        </section><section className="panel"><h2>État des services</h2><ServiceList entries={[
          ['CMS et historique', loaded ? 'Disponible' : 'Chargement…'], ['Collecte NASA', 'À la demande'],
          ['Publication automatique', 'Désactivée'], ['Rédaction IA', aiStatus],
          ['Radio et TV', 'Flux à connecter'], ['Audience et coûts', 'Non mesurés'],
        ]}/></section></div>
      </>}

      {tab === 'Articles' && <section className="panel"><h2>Articles récemment modifiés</h2>
        {data.articles.map(article => <div className="article-row" key={article.id}><div><h3>{article.title}</h3>
          <small>{article.category} · {statusLabel(article)}</small></div>
          <button className="outline" onClick={() => open(article)}>Ouvrir →</button>
        </div>)}
        {loaded && !data.articles.length && <p>Aucun article.</p>}
      </section>}

      {tab === 'Éditeur' && <div className="admin-two">
        <section className="panel"><h2>{edit.id ? 'Modifier l’article' : 'Nouveau brouillon'}</h2>
          <p>{statusLabel(edit)}{dirty && ' · modifications à enregistrer'}</p>
          {edit.isLive && <p>La version publiée reste accessible aux lecteurs jusqu’à la prochaine publication.</p>}
          <label>Titre<input disabled={busy} value={edit.title} maxLength={250} onChange={e => change({ title: e.target.value })}/></label>
          <label>Catégorie<select disabled={busy} value={edit.category} onChange={e => change({ category: e.target.value })}>
            {Array.from(new Set([...categories, edit.category])).map(category => <option key={category}>{category}</option>)}
          </select></label>
          <label>Résumé<textarea disabled={busy} value={edit.summary} maxLength={3000} onChange={e => change({ summary: e.target.value })}/></label>
          <label>Article<textarea disabled={busy} className="body-edit" value={edit.body} maxLength={60000} onChange={e => change({ body: e.target.value })}/></label>
          <div className="button-row">
            <button disabled={!canSubmit} className="outline" onClick={() => action('/api/newsroom', { ...edit, action: 'save' })}>Enregistrer le brouillon</button>
            <button disabled={!canSubmit} className="outline" onClick={() => action('/api/newsroom', { ...edit, action: 'review' })}>Soumettre à vérification</button>
            {edit.status === 'review' && !dirty && <button disabled={busy} className="red"
              onClick={() => action('/api/newsroom', { id: edit.id, version: edit.version, action: 'publish' })}>Valider et publier</button>}
          </div>
        </section>
        <div><section className="panel"><h2>Preuves et sources</h2>
          <label>Niveau éditorial<select disabled={busy} value={edit.risk} onChange={e => change({ risk: e.target.value })}>
            <option value="standard">Standard — validation humaine</option><option value="sensitive">Sensible — vérification renforcée</option>
          </select></label>
          {edit.sources.map((source, i) => <div key={i}>
            <label>Nom<input disabled={busy} value={source.name} maxLength={200} onChange={e => updateSource(i, { name: e.target.value })}/></label>
            <label>URL HTTPS<input disabled={busy} type="url" value={source.url} maxLength={2000} onChange={e => updateSource(i, { url: e.target.value })}/></label>
            <button className="text-button" disabled={busy} onClick={() => change({ sources: edit.sources.filter((_, j) => j !== i) })}>Retirer cette source</button><hr/>
          </div>)}
          <button className="outline" disabled={busy || edit.sources.length >= 20} onClick={() => change({ sources: [...edit.sources, { name: '', url: '' }] })}>+ Ajouter une source</button>
          <p className="admin-note">Contrôle les faits, les dates, les citations et l’indépendance des sources avant de publier.</p>
        </section><section className="panel" style={{ marginTop: 20 }}><h2>Assistant de rédaction</h2>
          <label>Faits vérifiés et extraits autorisés<textarea disabled={busy} value={notes} maxLength={12000} onChange={e => setNotes(e.target.value)}/></label>
          <button disabled={busy || !data.generationConfigured || notes.trim().length < 30 || !edit.sources.length} className="outline"
            onClick={() => action('/api/generate', { notes, sources: edit.sources, title: edit.title })}>{busy ? 'Traitement…' : 'Préparer un brouillon IA'}</button>
          <small style={{ display: 'block', marginTop: 12 }}>{data.generationConfigured
            ? 'Ajoute au moins 30 caractères et une source pour préparer un brouillon à vérifier.' : aiStatus}</small>
        </section></div>
      </div>}

      {tab === 'PULSE AI' && <><section className="panel"><h2>Collecte de sources officielles</h2>
        <p>Importe les titres et les liens du flux NASA pour les vérifier en rédaction.</p>
        <button disabled={busy} className="red" onClick={() => action('/api/pulse', {})}>{busy ? 'Collecte en cours…' : 'Collecter les pistes NASA'}</button>
      </section><section className="panel" style={{ marginTop: 20 }}><h2>Pistes à vérifier</h2>
        {data.events.map(event => <div className="article-row" key={event.id}><div><h3>{event.title}</h3><small>{event.source}</small></div>
          <a className="outline" href={event.url} target="_blank" rel="noreferrer">Source ↗</a></div>)}
        {loaded && !data.events.length && <p>Aucune piste collectée.</p>}
      </section></>}

      {tab === 'Historique' && <section className="panel"><h2>Journal des versions</h2>
        {data.revisions.map(revision => <div className="log" key={revision.id}><b>{revision.action}</b> · {new Date(revision.createdAt).toLocaleString('fr-CA')}
          <p>{JSON.parse(revision.snapshot).title}</p>
          <button className="outline" disabled={busy} onClick={() => action('/api/newsroom', {
            id: revision.articleId, version: data.articles.find(article => article.id === revision.articleId)?.version,
            revisionId: revision.id, action: 'restore',
          })}>Restaurer en brouillon</button></div>)}
        {loaded && !data.revisions.length && <p>Aucune révision enregistrée.</p>}
        <h2 style={{ marginTop: 30 }}>Exécutions</h2>
        {data.runs.map(run => <div className="log" key={run.id}>{new Date(run.createdAt).toLocaleString('fr-CA')} · {run.kind} · {run.status}<p>{run.detail}</p></div>)}
        {loaded && !data.runs.length && <p>Aucune exécution enregistrée.</p>}
      </section>}

      {tab === 'Studio AI' && <section className="panel"><h2>BYRVOX Studio AI</h2>
        <p>Le Studio prépare des bulletins de 30, 60 et 90 secondes, avec voix, avatars autorisés et sous-titres.</p>
        <p className="admin-note">La production audiovisuelle et la diffusion sociale attendent la configuration des fournisseurs et des comptes de distribution.</p>
      </section>}

      {tab === 'Intégrations' && <section className="panel"><h2>Connexions et activation</h2><ServiceList entries={[
        ['GitHub', 'bv7k5ht77g-hue/BYRVOX'], ['OpenAI', aiStatus], ['NASA RSS', 'Collecte à la demande'],
        ['Radio et TV', 'Flux à connecter'], ['YouTube et réseaux sociaux', 'Comptes et autorisations requis'],
        ['Newsletters', 'Fournisseur et expéditeur vérifié requis'], ['Paiements', 'Désactivés'],
        ['RadioYO et TVYO', 'Sites distincts à développer'],
      ]}/></section>}
    </main>
  </div>;
}
