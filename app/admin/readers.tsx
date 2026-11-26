'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Search, ShieldBan, ShieldCheck, UserRound, UserRoundX } from 'lucide-react';
import type { readerAccounts, readerActivity } from '../../db/schema';

type Account = typeof readerAccounts.$inferSelect;
type Status = Account['status'];
type Summary = Pick<Account,'userId'|'email'|'firstName'|'lastName'|'status'|'lastSeenAt'>;
type Detail = {reader:Account;activity:Pick<typeof readerActivity.$inferSelect,'id'|'action'|'path'|'occurredAt'>[]};
type Directory = {readers:Summary[];page:number;hasMore:boolean};
const dateFormat = new Intl.DateTimeFormat('fr-CA',{dateStyle:'medium',timeStyle:'short'});
const states = {active:'Actif',suspended:'Suspendu',banned:'Banni'};
const events = {signin:'Connexion',signout:'Déconnexion',page:'Lecture',active:'Accès rétabli',suspended:'Accès suspendu',banned:'Compte banni'};

async function load<T>(query: URLSearchParams, signal: AbortSignal): Promise<T> {
  const response = await fetch('/api/newsroom/readers?' + query,{cache:'no-store',signal});
  if (!response.ok) throw Error('Impossible de charger les lecteurs.');
  return response.json();
}

function ReaderDetails({id,back}: {id:string;back:()=>void}) {
  const [detail,setDetail] = useState<Detail|null>(null);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const [revision,setRevision] = useState(0);
  const [choice,setChoice] = useState<Status|null>(null);
  useEffect(() => {
    const controller = new AbortController();
    load<Detail>(new URLSearchParams({id}),controller.signal).then(setDetail).catch(() => {
      if (!controller.signal.aborted) setError('Impossible de charger cette fiche.');
    });
    return () => controller.abort();
  },[id,revision]);

  async function moderate() {
    if (!detail || !choice || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/newsroom/readers',{
        method:'PATCH',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({userId:id,status:choice,expectedStatus:detail.reader.status}),
      });
      if (!response.ok) {
        const body = await response.json().catch(()=>null);
        throw Error(body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : 'La mise à jour a échoué.');
      }
      setDetail(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La mise à jour a échoué.');
    } finally {
      setRevision(v=>v+1); setChoice(null); setBusy(false);
    }
  }

  const reader = detail?.reader;
  return <div className="portal-team">
    <div><button type="button" className="outline" onClick={back} disabled={busy}><ArrowLeft size={16}/> Tous les lecteurs</button></div>
    {error && <p className="admin-note" role="alert">{error} <button className="text-button" onClick={()=>{setError('');setRevision(v=>v+1);}}>Actualiser</button></p>}
    {reader && detail ? <>
      <section className="panel">
        <header className="reader-detail-head"><h2>{[reader.firstName,reader.lastName].filter(Boolean).join(' ') || reader.email}</h2>
          <span className={'reader-status reader-status-'+reader.status}>{states[reader.status]}</span></header>
        <dl className="reader-identity">
          <div><dt>Prénom</dt><dd>{reader.firstName || 'Non renseigné'}</dd></div>
          <div><dt>Nom</dt><dd>{reader.lastName || 'Non renseigné'}</dd></div>
          <div><dt>Adresse courriel</dt><dd>{reader.email}</dd></div>
          <div><dt>Première connexion</dt><dd>{dateFormat.format(new Date(reader.createdAt))}</dd></div>
          <div><dt>Dernière activité</dt><dd>{dateFormat.format(new Date(reader.lastSeenAt))}</dd></div>
          <div><dt>Dernière adresse IP</dt><dd>{reader.lastIp || 'Indisponible'}</dd></div>
          <div><dt>Emplacement approximatif</dt><dd>{reader.lastLocation || 'Indisponible'}</dd></div>
        </dl>
        {reader.moderatedAt && <p className="reader-moderated">Dernière décision le {dateFormat.format(new Date(reader.moderatedAt))} · {reader.moderatedBy}</p>}
        {choice ? <div className="reader-confirm">
          <p>{choice === 'active' ? 'Rétablir l’accès de ce compte à BYRVOX ?'
            : choice === 'banned' ? 'Bannir ce compte de BYRVOX ? Ses sessions seront bloquées.'
            : 'Suspendre ce compte ? Son accès sera bloqué jusqu’à sa réactivation.'}</p>
          <div className="button-row"><button className="outline" disabled={busy} onClick={()=>setChoice(null)}>Annuler</button>
            <button className="red" disabled={busy} onClick={()=>void moderate()}>{busy?'Enregistrement…':'Confirmer'}</button></div>
        </div> : <div className="button-row">
          {reader.status==='active' && <button className="outline" onClick={()=>setChoice('suspended')}><UserRoundX size={16}/> Suspendre</button>}
          {reader.status!=='banned' && <button className="outline" onClick={()=>setChoice('banned')}><ShieldBan size={16}/> Bannir</button>}
          {reader.status!=='active' && <button className="red" onClick={()=>setChoice('active')}><ShieldCheck size={16}/> Rétablir l’accès</button>}
        </div>}
      </section>
      <section className="panel"><h2>Activité récente</h2>
        {detail.activity.length ? <ol className="reader-timeline">{detail.activity.map(item=><li key={item.id}>
          <div><strong>{events[item.action]}</strong>
            {item.path && <small>{item.path === '/' ? 'Accueil et rubriques' : item.path.replace(/^\/article\//,'')}</small>}</div>
          <time dateTime={item.occurredAt}>{dateFormat.format(new Date(item.occurredAt))}</time>
        </li>)}</ol> : <p>Aucune activité enregistrée.</p>}
      </section>
    </> : !error && <p role="status">Chargement de la fiche…</p>}
  </div>;
}

export function ReadersPanel() {
  const [selected,setSelected] = useState('');
  const [query,setQuery] = useState('');
  const [search,setSearch] = useState('');
  const [page,setPage] = useState(1);
  const [revision,setRevision] = useState(0);
  const [directory,setDirectory] = useState<Directory|null>(null);
  const [error,setError] = useState('');
  useEffect(()=>{
    if (selected) return;
    const controller = new AbortController();
    load<Directory>(new URLSearchParams({search,page:String(page)}),controller.signal).then(setDirectory).catch(()=>{
      if (!controller.signal.aborted) setError('Impossible de charger la liste des lecteurs.');
    });
    return ()=>controller.abort();
  },[selected,search,page,revision]);
  function refresh() {
    setError('');
    setDirectory(null);
    setRevision(v=>v+1);
  }
  function submit(event:FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(query.trim());
    refresh();
  }
  function changePage(next:number) {
    setPage(next);
    refresh();
  }
  if (selected) return <ReaderDetails key={selected} id={selected} back={()=>{setSelected('');refresh();}}/>;
  return <section className="panel"><h2>Comptes lecteurs</h2>
    <form className="portal-invite" role="search" onSubmit={submit}>
      <label>Rechercher un lecteur<input type="search" value={query} maxLength={160} placeholder="Nom ou adresse courriel" onChange={event=>setQuery(event.target.value)}/></label>
      <button className="outline" type="submit"><Search size={16}/> Rechercher</button>
    </form>
    {error ? <p role="alert">{error} <button className="outline" onClick={refresh}>Réessayer</button></p>
      : !directory ? <p role="status">Chargement des lecteurs…</p>
      : directory.readers.length===0 ? <p>{search?'Aucun compte ne correspond à cette recherche.':'Aucun lecteur sur cette page.'}</p>
      : <ul className="portal-members">{directory.readers.map(reader=><li key={reader.userId} className="portal-member reader-directory-row">
          <div><strong>{[reader.firstName,reader.lastName].filter(Boolean).join(' ') || reader.email}</strong>
            {(reader.firstName||reader.lastName) && <small>{reader.email}</small>}</div>
          <span className={'reader-status reader-status-'+reader.status}>{states[reader.status]}</span>
          <button className="outline" aria-label={'Ouvrir la fiche de '+reader.email} onClick={()=>setSelected(reader.userId)}><UserRound size={16}/> Fiche</button>
        </li>)}</ul>}
    {directory && (page>1 || directory.hasMore) && <nav className="reader-pagination" aria-label="Pages du répertoire des lecteurs">
      <button className="outline" disabled={page===1} onClick={()=>changePage(page-1)}>Précédent</button><span>Page {page}</span>
      <button className="outline" disabled={!directory.hasMore} onClick={()=>changePage(page+1)}>Suivant</button>
    </nav>}
  </section>;
}
