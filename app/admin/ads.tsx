'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { photoByteLimit, photoTypes } from '../../lib/article-photo';
import { validAdImageUrl, type AdPlacement, type Placement } from '../../lib/ad-placements';

const slotNames: Record<Placement,string> = {
  home: 'Accueil · sous la navigation',
  'home-lower': 'Accueil · sous la manchette',
  masthead: 'Pages intérieures · sous la navigation',
  news: 'Actualités · fil de nouvelles',
  'news-lower': 'Actualités · rubriques et archives',
  radio: 'Radio · sous le lecteur',
  'article-photo': 'Articles · sous la photo de couverture',
  article: 'Articles · avant les sources',
};
const modes = {available:'Disponible', hidden:'Masqué', campaign:'Campagne active'};

export function AdsPanel({onDirty, onSaving}: {onDirty:(dirty:boolean)=>void; onSaving:(saving:boolean)=>void}) {
  const [slots, setSlots] = useState<AdPlacement[]>([]);
  const [edit, setEdit] = useState<AdPlacement|null>(null);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [conflict, setConflict] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const busy = saving || uploading;
  const current = slots.find(slot => slot.placement === edit?.placement);
  const changed = Boolean(edit && current && (edit.mode !== current.mode || edit.name !== current.name ||
    edit.url !== current.url || edit.image !== current.image || edit.alt !== current.alt));

  useEffect(() => {
    onDirty(changed);
    return () => onDirty(false);
  }, [changed, onDirty]);

  useEffect(() => {
    const abort = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/newsroom/ads', {cache:'no-store',signal:abort.signal});
        if (!response.ok) throw Error();
        const result = await response.json() as {placements:AdPlacement[]};
        if (!result.placements.length) throw Error();
        if (!abort.signal.aborted) {
          setSlots(result.placements);
          setEdit(previous => result.placements.find(slot => slot.placement === previous?.placement) ?? result.placements[0]);
          setConflict(false);
          setError('');
        }
      } catch {
        if (!abort.signal.aborted) setError('Impossible de charger les emplacements publicitaires.');
      }
    }
    void load();
    return () => abort.abort();
  }, [attempt]);

  function update(patch: Partial<AdPlacement>) {
    if (patch.image !== undefined) setPreview('');
    setEdit(previous => previous && {...previous, ...patch});
    setNotice('');
    if (!conflict) setError('');
  }

  async function upload(file?: File) {
    if (!file || busy) return;
    if (!file.size || file.size > photoByteLimit || !Object.values<string>(photoTypes).includes(file.type)) {
      setError('Choisis une image JPEG, PNG ou WebP non vide de 8 Mio maximum.');
      return;
    }
    setUploading(true); onSaving(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/newsroom/ad-images', {method:'POST', headers:{'Content-Type':file.type}, body:file});
      const result = await response.json() as {url?:string;error?:string};
      if (!response.ok || !result.url) {
        setError(result.error || 'L’envoi de la bannière a échoué.');
        return;
      }
      update({image:result.url});
      setPreview(result.url);
      setNotice('Bannière chargée. Enregistre l’emplacement pour appliquer le changement.');
    } catch { setError('L’image n’a pas pu être envoyée. Vérifie ta connexion et réessaie.'); }
    finally { setUploading(false); onSaving(false); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!edit || !changed || conflict || busy) return;
    setSaving(true); onSaving(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/newsroom/ads', {
        method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(edit),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as {error?:string}|null;
        setConflict(response.status === 409);
        setError(result?.error || 'Impossible d’enregistrer cet emplacement.');
        return;
      }
      const {placement} = await response.json() as {placement:AdPlacement};
      setSlots(previous => previous.map(slot => slot.placement === placement.placement ? placement : slot));
      setEdit(placement);
      setNotice('Emplacement enregistré.');
    } catch { setError('L’enregistrement a échoué. Vérifie ta connexion et réessaie.'); }
    finally { setSaving(false); onSaving(false); }
  }

  function select(slot:AdPlacement) {
    if (busy || (changed && !window.confirm('Abandonner les modifications de cet emplacement ?'))) return;
    setEdit(slot); setPreview(''); setNotice(''); setError(''); setConflict(false);
  }

  return <div className="portal-ads">
    <section className="panel ad-directory" aria-labelledby="ads-list-title">
      <h2 id="ads-list-title">Emplacements</h2>
      {slots.length === 0 && !error && <p role="status">Chargement des emplacements…</p>}
      <ul>{slots.map(slot => <li key={slot.placement}>
        <button type="button" disabled={busy} aria-pressed={slot.placement === edit?.placement} onClick={() => {
          if (edit?.placement !== slot.placement) select(slot);
        }}>
          <span>{slotNames[slot.placement]}</span><small>{modes[slot.mode]}</small>
        </button>
      </li>)}</ul>
    </section>
    {edit && current && <form className="panel ad-editor" onSubmit={save} aria-labelledby="ad-editor-title">
      <h2 id="ad-editor-title">{slotNames[edit.placement]}</h2>
      <p>Affichage enregistré · <strong>{modes[current.mode]}</strong></p>
      <fieldset disabled={busy}>
        <label>Afficher sur le site<select value={edit.mode} onChange={event => update({mode:event.target.value as AdPlacement['mode']})}>
          <option value="available">Emplacement disponible</option>
          <option value="campaign">Campagne publicitaire</option>
          <option value="hidden">Masquer l’emplacement</option>
        </select></label>
        {edit.mode === 'campaign' && <>
          <label>Nom de l’annonceur<input value={edit.name} required maxLength={160} onChange={event => update({name:event.target.value})}/></label>
          <label>Lien de destination<input type="url" value={edit.url} required maxLength={2000} placeholder="https://" onChange={event => update({url:event.target.value})}/></label>
          <label>Importer une bannière<input type="file" accept={Object.values(photoTypes).join(',')}
            onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void upload(file); }}/></label>
          <p className="portal-help" role="status">{uploading ? 'Envoi de la bannière…' : 'JPEG, PNG ou WebP · 8 Mio maximum'}</p>
          <label>Adresse de l’image (facultatif)<input value={edit.image} maxLength={2000} aria-describedby="ads-image-help"
            onChange={event => update({image:event.target.value})}/></label>
          <p id="ads-image-help" className="portal-help">Utilise une adresse HTTPS ou le chemin d’une image publique sur BYRVOX. Sans image, l’annonce affiche le nom de l’annonceur et son lien.</p>
          {edit.image.trim() && <button type="button" className="outline" disabled={!validAdImageUrl(edit.image.trim())}
            onClick={() => {setPreview(edit.image.trim());setError('');}}>Aperçu de la bannière</button>}
          {preview && preview === edit.image.trim() && validAdImageUrl(preview) && <img className="ad-preview" src={preview}
            referrerPolicy="no-referrer" alt={edit.alt || 'Aperçu de la bannière'} onError={() => {
              setPreview(''); setError('Aperçu indisponible. Vérifie l’adresse de l’image.');
            }}/>}
          {edit.image.trim() && <label>Texte alternatif de l’image<input value={edit.alt} required maxLength={300} onChange={event => update({alt:event.target.value})}/></label>}
        </>}
      </fieldset>
      <div className="button-row"><button className="red" type="submit" disabled={busy || conflict || !changed}>{saving ? 'Enregistrement…' : 'Enregistrer l’emplacement'}</button>
        {changed && !conflict && <button className="outline" type="button" disabled={busy} onClick={() => {setEdit(current);setPreview('');setError('');setNotice('');}}>Annuler les modifications</button>}
      </div>
      {notice && <p role="status" className="admin-note">{notice}</p>}
    </form>}
    {error && <div className="admin-note" role="alert">{error} {(!slots.length || conflict) &&
      <button className="outline" type="button" onClick={() => {
        if (changed && !window.confirm('Recharger la version enregistrée et abandonner les modifications locales ?')) return;
        setAttempt(value => value+1);
      }}>Recharger les emplacements</button>}</div>}
  </div>;
}
