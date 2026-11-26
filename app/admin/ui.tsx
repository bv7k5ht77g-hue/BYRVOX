'use client';

import { useEffect, useState } from 'react';
import { AdsPanel } from './ads';
import { StudioPanel } from './studio';
import { AdminNavigation } from './navigation';
import { OpenArticle } from './open-article';
import { ArticlePreview } from './article-preview';
import { ArticleAdReviewForm, PublicationReview } from './article-ad-review';
import type { ArticleAdReview } from '../../lib/article-ad-policy';
import { GalleryField, PhotoField } from './photo-field';
import { LeadSelector } from './lead-selector';
import { CommentsPanel } from './comments';
import { ReadersPanel } from './readers';
import { roleNames, TeamPanel } from './team';
import type { NewsroomRole } from '../../lib/access';
import type { ArticlePhoto } from '../../lib/article-photo';
import { fold } from '../../lib/edition';
import './portal.css';
import { ExternalLink, Eye, Plus, SquarePen } from 'lucide-react';
import type { articles, events, revisions, runs } from '../../db/schema';

type Source = { name: string; url: string };
type Article = Omit<typeof articles.$inferSelect, 'draft' | 'photo' | 'photoHidden' | 'gallery'> & { isLive: boolean; photo: ArticlePhoto | null; photoHidden: boolean; gallery: ArticlePhoto[] };
type Editor = Pick<Article, 'id' | 'slug' | 'title' | 'photo' | 'photoHidden' | 'gallery' | 'category' | 'summary' | 'body' | 'risk' | 'status' | 'isLive'>
  & { authorId?: string; version?: number; sources: Source[]; adReview?: ArticleAdReview | null };
type Newsroom = {
  role: NewsroomRole; email: string; userId: string;
  articles: Article[]; reviewQueue?: Article[];
  events: (typeof events.$inferSelect)[];
  revisions: (typeof revisions.$inferSelect)[];
  runs: (typeof runs.$inferSelect)[];
  generationConfigured: boolean;
};
const empty: Editor = {
  id: '', slug: '', title: '', photo: null, photoHidden: false, gallery: [], category: 'International', summary: '', body: '', risk: 'standard',
  sources: [], status: 'draft', isLive: false,
};
const categories = ['International', 'Politique', 'Économie', 'Société', 'Technologie', 'Environnement', 'Sports', 'Culture','Éditorial','Article sponsorisé'];

function statusLabel(article: Pick<Article, 'status' | 'isLive'>) {
  if (article.status === 'published') return 'Publié';
  const state = article.status === 'review' ? 'En vérification' : 'Brouillon';
  return article.isLive ? state + ' · version précédente en ligne' : state;
}

async function loadNewsroom(signal?: AbortSignal): Promise<Newsroom> {
  const response = await fetch('/api/newsroom', { cache: 'no-store', signal });
  if (!response.ok) throw Error('Rédaction indisponible.');
  return await response.json() as Newsroom;
}

function editArticle(row: Article): Editor {
  return { ...row, photo: row.photo ?? null, photoHidden: Boolean(row.photoHidden), gallery: row.gallery || [], sources: JSON.parse(row.sources) };
}

function ServiceList({ entries }: { entries: string[][] }) {
  return <>{entries.map(([name, value]) => <div className="status-line" key={name}><span>{name}</span><small>{value}</small></div>)}</>;
}

export default function Admin({ initialRole }: { initialRole: NewsroomRole }) {
  const [tab, setTab] = useState('Tableau de bord');
  const [data, setData] = useState<Newsroom>({ role:initialRole, email:'', userId:'', articles: [], events: [], revisions: [], runs: [], generationConfigured: false });
  const [loaded, setLoaded] = useState(false);
  const [edit, setEdit] = useState<Editor>(empty);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState('');
  const [acting, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState('all');
  const [adDirty, setAdDirty] = useState(false);
  const [adSaving, setAdSaving] = useState(false);
  const busy = acting || uploading || adSaving;
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    async function initialize() {
      if (initialRole !== 'owner') {
        try {
          const result = await loadNewsroom(signal);
          if (!signal.aborted) { setData(result); setLoaded(true); }
        } catch { if (!signal.aborted) setMessage('Impossible de charger la rédaction.'); }
        return;
      }
      let importNotice = '';
      try {
        const response = await fetch('/api/newsroom/edition', { method: 'POST', signal });
        if (!response.ok) throw Error();
        const result = await response.json() as { ok?: boolean; status?: string };
        if (result.ok !== true || !['imported', 'unchanged', 'partial', 'unavailable'].includes(result.status ?? '')) throw Error();
        if (result.status === 'partial') importNotice = 'Une partie des sujets de vérification reste à importer.';
        if (result.status === 'unavailable') importNotice = 'Aucune édition disponible à importer.';
      } catch {
        importNotice = 'Impossible d’importer l’édition.';
      }
      if (signal.aborted) return;
      if (importNotice) setMessage(importNotice);
      try {
        const result = await loadNewsroom(signal);
        if (!signal.aborted) { setData(result); setLoaded(true); }
      } catch {
        if (!signal.aborted) setMessage([importNotice, 'Impossible de charger la rédaction.'].filter(Boolean).join(' '));
      }
    }
    void initialize();
    return () => controller.abort();
  }, [initialRole]);

  useEffect(() => {
    if (!dirty && !adDirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, adDirty]);

  function open(article?: Article) {
    if (dirty && edit.id && article?.id === edit.id) { setTab('Éditeur'); return; }
    if (dirty && !window.confirm('Abandonner les modifications non enregistrées ?')) return;
    setPreview(false);
    setEdit(article ? editArticle(article) : empty);
    setDirty(false);
    setNotes('');
    setMessage('');
    setTab('Éditeur');
  }

  async function openByIdentifier(identifier: string) {
    setBusy(true);
    try {
      const response = await fetch('/api/newsroom?article=' + encodeURIComponent(identifier), {cache:'no-store'});
      if (!response.ok) throw Error(response.status === 404 ? 'Aucun article accessible ne correspond à cet identifiant.' : 'Impossible de charger cet article.');
      const { article } = await response.json() as {article: Article};
      open(article);
    } finally { setBusy(false); }
  }

  function change(patch: Partial<Editor>) {
    setEdit(previous => ({ ...previous, ...patch }));
    setDirty(true);
  }

  function updateSource(index: number, patch: Partial<Source>) {
    change({ sources: edit.sources.map((source, i) => i === index ? { ...source, ...patch } : source) });
  }

  async function action(url: string, input: {action?: string; [key:string]: unknown}) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        if (response.status === 409) {
          const refreshed = await loadNewsroom();
          setData(refreshed);
          if (input.action === 'publish' || input.action === 'ad-policy') {
            const current = [...(refreshed.reviewQueue || []), ...refreshed.articles].find(article => article.id === input.id);
            if (current) setEdit(editArticle(current));
            else if (typeof input.id === 'string') await openByIdentifier(input.id);
          }
        }
        throw Error(result.error || 'Échec de l’opération.');
      }
      if (url === '/api/newsroom') {
        const row = await response.json() as Article;
        setEdit(editArticle(row));
        setDirty(false);
        setTab('Éditeur');
        setMessage(input.action === 'ad-policy' ? 'La diffusion publicitaire a été mise à jour pour cet article.' :
          row.status === 'published' ? 'Article publié.' : input.action === 'return'
          ? 'Article renvoyé en brouillon. Son auteur peut le corriger et le soumettre à nouveau.' : row.status === 'review'
          ? 'Article en attente d’approbation.' : 'Brouillon enregistré.');
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
  const lastWire = data.runs.find(run => run.kind === 'hourly-publication' && run.status === 'published');
  const wireStatus = !loaded ? 'Chargement…' : lastWire
    ? 'Dernière publication · ' + new Date(lastWire.createdAt).toLocaleString('fr-CA') : 'Aucune livraison dans l’historique récent';
  const assistedEdition = edit.authorId === 'byrvox-redaction-assistee' || /^edition-[a-f0-9]{64}$/.test(edit.id);
  const terms = fold(keyword).split(/\s+/).filter(Boolean);
  const filtered = data.articles.filter(article => {
    const statusMatches = filter === 'all' || (filter === 'live' ? article.isLive : article.status === filter);
    return statusMatches && terms.every(term => fold(article.title + ' ' + article.category + ' ' + article.summary).includes(term));
  });
  const words = edit.body.trim() ? edit.body.trim().split(/\s+/).length : 0;
  const owner = data.role === 'owner';
  const canApprove = owner || data.role === 'approver';
  const reviewQueue = data.reviewQueue ?? data.articles.filter(article => article.status === 'review');
  const locked = !canApprove && Boolean(edit.id) && (edit.status !== 'draft' || edit.authorId !== data.userId);
  const fieldsDisabled = busy || locked;
  const draftFields = {...edit, adReview: undefined};
  const canSubmit = loaded && !fieldsDisabled && edit.title.trim() && (dirty || edit.status !== 'published');

  return <div className="admin-shell">
    <a className="skip" href="#portal-main">Aller au contenu de la rédaction</a>
    <AdminNavigation tab={tab} busy={busy} role={data.role} onNavigate={name => {
      if (tab === 'Espaces publicitaires' && name !== tab && adDirty && !window.confirm('Abandonner les modifications de cet emplacement ?')) return;
      setTab(name); setPreview(false);
    }} />
    <main className="admin-main" id="portal-main" tabIndex={-1}>
      <div className="admin-top"><div><p className="eyebrow">BYRVOX · {roleNames[data.role]}</p><h1>{tab}</h1></div>
        {tab !== 'Espaces publicitaires' && tab !== 'Commentaires' && <button className="red" disabled={busy || !loaded} onClick={() => open()}><Plus size={16} aria-hidden="true" /> Nouvel article</button>}
      </div>
      {message && <div role="status" className="admin-note">{message}</div>}

      {tab === 'Tableau de bord' && <>
        <section className="panel portal-workflow"><h2>{canApprove ? 'Vérification éditoriale' : 'Mes contributions'}</h2>
          <p>{canApprove
            ? 'Ouvre les articles soumis pour vérifier les sources, corriger le texte ou demander des modifications avant publication.'
            : 'Rédige ton article, ajoute ses photos et ses sources, puis sélectionne « Soumettre pour approbation ». Tu pourras reprendre un article renvoyé en brouillon.'}</p>
          {canApprove && <button className="outline" onClick={() => setTab('À approuver')}>Voir les articles à approuver{loaded ? ' (' + reviewQueue.length + (reviewQueue.length === 50 ? '+' : '') + ')' : ''}</button>}
        </section>
        <div className="stats">{[
          [canApprove ? 'Articles récents' : 'Mes articles', data.articles.length],
          ['À approuver', reviewQueue.length === 50 && canApprove ? '50+' : reviewQueue.length],
          ['En ligne', data.articles.filter(article => article.isLive).length],
          ...(owner ? [['Pistes récentes', data.events.length]] : []),
        ].map(([title, value]) => <div className="stat" key={title}><small>{title}</small><b>{loaded ? value : '—'}</b></div>)}</div>
        {canApprove && <LeadSelector articles={data.articles} />}
        <div className={owner ? 'admin-two' : ''}><section className="panel"><h2>{canApprove ? 'Articles récents' : 'Mes derniers articles'}</h2>
          {data.articles.slice(0, 8).map(article => <button className="article-row" style={{ width: '100%', textAlign: 'left' }}
            key={article.id} onClick={() => open(article)}>
            <div><h3>{article.title}</h3><small>{article.category} · {new Date(article.updatedAt).toLocaleString('fr-CA')}</small></div>
            <span className="badge">{statusLabel(article)}</span>
          </button>)}
          {loaded && !data.articles.length && <p>Aucun article créé. Commence par un brouillon sourcé.</p>}
          <small>Jusqu’à 100 articles, classés par dernière modification.</small>
        </section>{owner && <section className="panel"><h2>État des services</h2><ServiceList entries={[
          ['CMS et historique', loaded ? 'Disponible' : 'Chargement…'], ['Collecte NASA', 'À la demande'],
          ['Agent horaire', wireStatus], ['Rédaction IA', aiStatus],
          ['Radio et TV', 'Flux à connecter'], ['Audience et coûts', 'Non mesurés'],
        ]}/></section>}</div>
      </>}

      {tab === 'Espaces publicitaires' && canApprove && <AdsPanel onDirty={setAdDirty} onSaving={setAdSaving} openArticle={openByIdentifier}/>}
      {tab === 'Commentaires' && canApprove && <CommentsPanel/>}
      {tab === 'Lecteurs' && canApprove && <ReadersPanel/>}
      {tab === 'Équipe' && owner && <TeamPanel/>}
      {tab === 'À approuver' && canApprove && <section className="panel"><h2>Articles en attente d’approbation</h2>
        {reviewQueue.length === 50 && <p>Les 50 soumissions les plus anciennes s’affichent en premier.</p>}
        {!loaded && <p>Chargement des soumissions…</p>}
        {loaded && !reviewQueue.length && <p>Aucun article en attente d’approbation.</p>}
        {reviewQueue.map(article => <div className="article-row" key={article.id}><div><h3>{article.title}</h3>
          <small>{article.category} · {new Date(article.updatedAt).toLocaleString('fr-CA')}</small></div>
          <button className="outline" onClick={() => open(article)} aria-label={'Examiner ' + article.title}>Examiner</button></div>)}
      </section>}
      {tab === 'Articles' && <section className="panel"><h2>{canApprove ? 'Articles récemment modifiés' : 'Mes articles'}</h2>
        <div className="portal-filters"><label>Rechercher un article<input type="search" placeholder="Titre, résumé ou rubrique"
          value={keyword} onChange={event => setKeyword(event.target.value)} /></label>
          <label>Statut<select value={filter} onChange={event => setFilter(event.target.value)}>
            <option value="all">Tous les statuts</option><option value="draft">Brouillons</option>
            <option value="review">En vérification</option><option value="live">En ligne</option>
          </select></label></div>
        <OpenArticle open={openByIdentifier} busy={busy || !loaded}/>
        {loaded && <p role="status" className="portal-help">{filtered.length} article{filtered.length > 1 ? 's' : ''} sur {data.articles.length}</p>}
        {filtered.map(article => <div className="article-row" key={article.id}><div><h3>{article.title}</h3>
          <small>{article.category} · {statusLabel(article)}</small></div>
          <button className="outline" onClick={() => open(article)} aria-label={'Ouvrir dans l’éditeur : ' + article.title}><SquarePen size={16} aria-hidden="true" /> Ouvrir</button>
        </div>)}
        {loaded && !filtered.length && (data.articles.length ? <div className="portal-empty"><p>Aucun article ne correspond à ces critères.</p>
          <button className="outline" onClick={() => { setKeyword(''); setFilter('all'); }}>Effacer les filtres</button></div> : <p>Aucun article.</p>)}
      </section>}

      {tab === 'Éditeur' && <div className="admin-two">
        <section className="panel"><h2>{locked ? 'Consulter l’article' : edit.status === 'review' ? 'Examiner l’article' : edit.id ? 'Modifier l’article' : 'Nouveau brouillon'}</h2>
          <button className="outline portal-preview-trigger" disabled={busy} onClick={() => setPreview(true)}><Eye size={16} aria-hidden="true" /> Aperçu privé</button>
          <p>{statusLabel(edit)}{dirty && ' · modifications à enregistrer'}</p>
          {locked && edit.status === 'review' && <p className="admin-note">Ton article a été soumis. La rédaction peut le publier ou te le renvoyer en brouillon pour correction.</p>}
          {assistedEdition && <p className="admin-note">Texte préparé avec assistance IA. Vérifie les sources avant publication.</p>}
          {edit.isLive && <p>La version publiée reste accessible aux lecteurs jusqu’à la prochaine publication.</p>}
          <label>Titre<input disabled={fieldsDisabled} value={edit.title} maxLength={250} onChange={e => change({ title: e.target.value })}/></label>
          <label>Catégorie<select disabled={fieldsDisabled} value={edit.category} onChange={e => change({ category: e.target.value })}>
            {Array.from(new Set([...categories, edit.category])).map(category => <option key={category}>{category}</option>)}
          </select></label>
          <label>Résumé<textarea disabled={fieldsDisabled} value={edit.summary} maxLength={3000} onChange={e => change({ summary: e.target.value })}/></label>
          <label>Article<textarea disabled={fieldsDisabled} className="body-edit" value={edit.body} maxLength={60000} onChange={e => change({ body: e.target.value })}/></label>
          <p className="portal-help">{words} mot{words > 1 ? 's' : ''}{words > 0 && ' · ' + Math.ceil(words / 220) + ' min de lecture'}</p>
          {!locked && <div className="button-row">
            {edit.status !== 'review' && <button disabled={!canSubmit} className="outline" onClick={() => action('/api/newsroom', { ...draftFields, action: 'save' })}>Enregistrer le brouillon</button>}
            {edit.status !== 'review' && <button disabled={!canSubmit} className="red" onClick={() => action('/api/newsroom', { ...draftFields, action: 'review' })}>Soumettre pour approbation</button>}
            {canApprove && edit.status === 'review' && <>
              {dirty && <button disabled={!canSubmit} className="outline" onClick={() => action('/api/newsroom', {...draftFields, action:'review'})}>Enregistrer les corrections</button>}
              <button disabled={busy || dirty} className="outline" onClick={() => action('/api/newsroom', {id:edit.id, version:edit.version, action:'return'})}>Renvoyer en brouillon</button>
            </>}
          </div>}
          {canApprove && edit.status === 'review' && <PublicationReview key={'publish-' + edit.id + '-' + edit.version}
            slug={edit.slug} busy={busy} hasEdits={dirty}
            onPublish={(adReview, translations) => action('/api/newsroom', {id:edit.id, version:edit.version, action:'publish', adReview, translations})}/>}
        </section>
        <div className="portal-editor-tools">
          {canApprove && edit.isLive && <ArticleAdReviewForm key={'live-' + edit.id + '-' + edit.version}
            mode="live" slug={edit.slug} current={edit.adReview} busy={busy} hasEdits={dirty}
            onSubmit={adReview => action('/api/newsroom', {id:edit.id, version:edit.version, action:'ad-policy', adReview})}/>}
          <PhotoField key={edit.id} slug={edit.slug} value={edit.photo} hidden={edit.photoHidden}
            change={(photo, photoHidden) => change({ photo, photoHidden })} busy={fieldsDisabled} setUploading={setUploading} />
          <GalleryField key={'gallery-' + edit.id} photos={edit.gallery} change={gallery => change({ gallery })} busy={fieldsDisabled} setUploading={setUploading} />
          <section className="panel"><h2>Preuves et sources</h2>
          <label>Niveau éditorial<select disabled={fieldsDisabled} value={edit.risk} onChange={e => change({ risk: e.target.value })}>
            <option value="standard">Standard — validation humaine</option><option value="sensitive">Sensible — vérification renforcée</option>
          </select></label>
          {edit.sources.map((source, i) => <div key={i}>
            <label>Nom<input disabled={fieldsDisabled} value={source.name} maxLength={200} onChange={e => updateSource(i, { name: e.target.value })}/></label>
            <label>URL HTTPS<input disabled={fieldsDisabled} type="url" value={source.url} maxLength={2000} onChange={e => updateSource(i, { url: e.target.value })}/></label>
            <button className="text-button" disabled={fieldsDisabled} onClick={() => change({ sources: edit.sources.filter((_, j) => j !== i) })}>Retirer cette source</button><hr/>
          </div>)}
          <button className="outline" disabled={fieldsDisabled || edit.sources.length >= 20} onClick={() => change({ sources: [...edit.sources, { name: '', url: '' }] })}><Plus size={16} aria-hidden="true" /> Ajouter une source</button>
          <p className="admin-note">Contrôle les faits, les dates, les citations et l’indépendance des sources avant de publier.</p>
        </section>{owner && <section className="panel"><h2>Assistant de rédaction</h2>
          <label>Faits vérifiés et extraits autorisés<textarea disabled={fieldsDisabled} value={notes} maxLength={12000} onChange={e => setNotes(e.target.value)}/></label>
          <button disabled={busy || !data.generationConfigured || notes.trim().length < 30 || !edit.sources.length} className="outline"
            onClick={() => action('/api/generate', { notes, sources: edit.sources, title: edit.title })}>{busy ? 'Traitement…' : 'Préparer un brouillon IA'}</button>
          <small style={{ display: 'block', marginTop: 12 }}>{data.generationConfigured
            ? 'Ajoute au moins 30 caractères et une source pour préparer un brouillon à vérifier.' : aiStatus}</small>
        </section>}</div>
      </div>}

      {tab === 'PULSE AI' && owner && <><section className="panel"><h2>Collecte de sources officielles</h2>
        <p>Importe les titres et les liens du flux NASA pour les vérifier en rédaction.</p>
        <button disabled={busy} className="red" onClick={() => action('/api/pulse', {})}>{busy ? 'Collecte en cours…' : 'Collecter les pistes NASA'}</button>
      </section><section className="panel" style={{ marginTop: 20 }}><h2>Pistes à vérifier</h2>
        {data.events.map(event => <div className="article-row" key={event.id}><div><h3>{event.title}</h3><small>{event.source}</small></div>
          <a className="outline" href={event.url} target="_blank" rel="noreferrer" aria-label={'Source de « ' + event.title + ' » (nouvel onglet)'}>Source <ExternalLink size={16} aria-hidden="true" /></a></div>)}
        {loaded && !data.events.length && <p>Aucune piste collectée.</p>}
      </section></>}

      {tab === 'Historique' && canApprove && <section className="panel"><h2>Journal des versions</h2>
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

      {tab === 'Studio AI' && owner && <StudioPanel onOpenArticles={() => {
        setKeyword(''); setFilter('live'); setTab('Articles');
      }}/>}

      {tab === 'Intégrations' && owner && <section className="panel"><h2>Connexions et activation</h2><ServiceList entries={[
        ['GitHub', 'bv7k5ht77g-hue/BYRVOX'], ['OpenAI', aiStatus], ['NASA RSS', 'Collecte à la demande'],
        ['Radio et TV', 'Flux à connecter'], ['YouTube et réseaux sociaux', 'Comptes et autorisations requis'],
        ['Newsletters', 'Fournisseur et expéditeur vérifié requis'], ['Paiements', 'Désactivés'],
        ['RadioYO et TVYO', 'Sites distincts à développer'],
      ]}/></section>}
    </main>
    {preview && <ArticlePreview article={edit} close={() => setPreview(false)} />}
  </div>;
}
