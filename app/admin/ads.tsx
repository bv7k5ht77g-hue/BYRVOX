'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { photoByteLimit, photoTypes } from '../../lib/article-photo';
import { AdFrame } from '../../components/edition/ad-frame';
import { parseAdFrame, parseAdScript } from '../../lib/ad-frame.mjs';
import { adSlotPattern, parseAdSenseSnippet, recognizeAdSenseVerification } from '../../lib/adsense.mjs';
import { validAdImageUrl, type AdPlacement, type AdSenseSettings, type Placement } from '../../lib/ad-placements';
import { articleUrl, NEW_SITE_ORIGIN } from '../../lib/site-url';

const positions: Record<Placement, {section: string; name: string}> = {
  home: {section:'Accueil', name:'Sous la navigation'},
  'home-lower': {section:'Accueil', name:'Sous la manchette'},
  masthead: {section:'Articles', name:'Sous la navigation'},
  'article-photo': {section:'Articles', name:'Après la photo de couverture'},
  'article-mid': {section:'Articles', name:'Au milieu du texte'},
  article: {section:'Articles', name:'Avant les sources'},
  news: {section:'Actualités', name:'Fil de nouvelles'},
  'news-lower': {section:'Actualités', name:'Rubriques et archives'},
  radio: {section:'Radio', name:'Sous le lecteur'},
  footer: {section:'Toutes les pages', name:'Pied de page'},
};
const kyotoArticle = articleUrl('asean-plus-trois-kyoto-paiements-numeriques', NEW_SITE_ORIGIN);
const methodArticle = articleUrl('notre-methode', NEW_SITE_ORIGIN);
function slotTitle(placement: Placement) {
  const {section, name} = positions[placement];
  return section + ' · ' + name.toLocaleLowerCase('fr');
}
const modes = {available:'Disponible', hidden:'Masqué', campaign:'Campagne active', adsense:'Bloc AdSense', embed:'Code iframe', script:'Script externe'};

function PlacementStatus({slot, settings}: {slot:AdPlacement; settings:AdSenseSettings|null}) {
  let label=modes[slot.mode], detail='';
  if (slot.mode === 'adsense') {
    label='AdSense';
    detail=!settings?.enabled ? 'Bloc attribué · diffusion globale désactivée' :
      settings.client !== slot.adClient ? 'Bloc attribué · compte éditeur différent' : 'Bloc attribué · diffusion autorisée';
  } else if (slot.mode === 'campaign') {
    label='Campagne directe';
    detail=slot.name;
  } else if (slot.mode === 'embed' || slot.mode === 'script') {
    label=slot.mode === 'embed' ? 'Partenaire · iframe' : 'Partenaire · script';
    try { detail=[slot.name,new URL(slot.url).hostname].filter(Boolean).join(' · '); }
    catch { detail=slot.name; }
  } else if (slot.mode === 'available') label='Non attribué';
  return <span className="placement-state"><span className={'placement-badge mode-'+slot.mode}>{label}</span>
    {detail && <small>{detail}</small>}</span>;
}

export function AdsPanel({onDirty, onSaving}: {onDirty:(dirty:boolean)=>void; onSaving:(saving:boolean)=>void}) {
  const [slots, setSlots] = useState<AdPlacement[]>([]);
  const [edit, setEdit] = useState<AdPlacement|null>(null);
  const [settings, setSettings] = useState<AdSenseSettings|null>(null);
  const [siteSetup, setSiteSetup] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [snippet, setSnippet] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [conflict, setConflict] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const busy = saving || uploading;
  const current = slots.find(slot => slot.placement === edit?.placement);
  const exampleArticle = edit?.placement === 'article' ? methodArticle : kyotoArticle;
  const sections = [...new Set(slots.map(slot => positions[slot.placement].section))];
  const editingScript = !siteSetup && edit?.mode === 'script';
  const editingFrame = !siteSetup && (edit?.mode === 'embed' || editingScript);
  const parseExternal = editingScript ? parseAdScript : parseAdFrame;
  const parsed = snippet.trim() ? parseAdSenseSnippet(snippet.trim()) : null;
  const client = parsed?.client || (!siteSetup && edit?.adClient) || settings?.client || '';
  const unit = parsed?.slot || edit?.adSlot || '';
  const verification = recognizeAdSenseVerification(snippet);
  const editingUnit = !siteSetup && edit?.mode === 'adsense';
  const validUnit = adSlotPattern.test(unit);
  const unitHint = unit && !validUnit ? 'Recopie les 10 chiffres de data-ad-slot fournis par Google pour ce bloc.' : '';
  function validateSnippet() {
    if (!snippet.trim()) return '';
    if (verification) {
      const reason = verification.kind === 'meta' ? 'Cette balise Meta vérifie la propriété du site.' : 'Cette ligne ads.txt identifie le vendeur publicitaire autorisé.';
      if (editingUnit && validUnit && verification.client === client) return '';
      return reason + (siteSetup ? ' Pour activer le chargement des annonces, colle le script du site.' : ' Pour la bannière, ouvre Annonces → Par bloc d’annonces et copie le code du bloc display.');
    }
    if (editingFrame) {
      if (parsed) return parsed.slot ? 'Ce code correspond à un bloc Google AdSense.' : 'Ce code configure Google AdSense pour le site.';
      if (parseExternal(snippet)) return '';
      return editingScript ? 'Colle une balise script avec une adresse HTTPS externe dans son attribut src et un corps vide.'
        : 'Colle une balise iframe avec une adresse HTTPS externe dans son attribut src.';
    }
    if (!parsed) return 'Code non reconnu. Copie le code Google AdSense complet depuis ton compte.';
    if (siteSetup && parsed.slot) return 'Ce code correspond à un bloc display. Choisis son emplacement ou colle le code du site fourni par Google.';
    if (!siteSetup && !parsed.slot && !adSlotPattern.test(edit?.adSlot || '')) return 'Code du site reconnu. Renseigne le numéro du bloc display à diffuser ici.';
    return '';
  }
  const snippetError = validateSnippet();
  const siteChanged = Boolean(settings && (enabled !== settings.enabled || client !== settings.client));
  const slotChanged = Boolean(edit && current && (edit.mode !== current.mode || edit.name !== current.name ||
    edit.url !== current.url || edit.image !== current.image || edit.alt !== current.alt ||
    (edit.mode === 'adsense' && (client !== current.adClient || unit !== current.adSlot))));
  const changed = (siteSetup ? siteChanged : slotChanged) || Boolean(snippet.trim());

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
        const result = await response.json() as {placements:AdPlacement[]; adsense:AdSenseSettings};
        if (!result.placements.length) throw Error();
        if (!abort.signal.aborted) {
          setSlots(result.placements);
          setSettings(result.adsense);
          setEnabled(result.adsense.enabled);
          setSnippet('');
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

  function clearFeedback() {
    setNotice('');
    if (!conflict) setError('');
  }

  function update(patch: Partial<AdPlacement>) {
    if (patch.image !== undefined) setPreview('');
    setEdit(previous => previous && {...previous, ...patch});
    clearFeedback();
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
    if (!edit || !settings || !changed || snippetError || conflict || busy) return;
    const placingUnit = !siteSetup && edit.mode === 'adsense';
    if ((siteSetup && enabled && !client) || (placingUnit && (!client || !adSlotPattern.test(unit)))) {
      setError(siteSetup ? 'Colle le code de ton compte AdSense pour activer la diffusion.' : 'Colle le code du bloc display à diffuser.');
      return;
    }
    if (editingFrame && (!edit.url || !edit.name.trim())) {
      setError('Colle le code de la régie puis donne un titre à l’annonce.');
      return;
    }
    setSaving(true); onSaving(true); setError(''); setNotice('');
    try {
      const data = siteSetup ? {enabled,client,version:settings.version} : placingUnit ? {...edit,adClient:client,adSlot:unit} : edit;
      const response = await fetch(siteSetup ? '/api/newsroom/ads/adsense' : '/api/newsroom/ads', {
        method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as {error?:string}|null;
        setConflict(response.status === 409);
        setError(result?.error || 'Impossible d’enregistrer cet emplacement.');
        return;
      }
      if (siteSetup) {
        const {adsense} = await response.json() as {adsense:AdSenseSettings};
        setSettings(adsense); setEnabled(adsense.enabled);
        setNotice(adsense.enabled ? 'Code du site enregistré et activé dans l’en-tête HTML des pages autorisées.' : 'Configuration enregistrée. Le chargement du script sur le site est désactivé.');
      } else {
        const {placement} = await response.json() as {placement:AdPlacement};
        setSlots(previous => previous.map(slot => slot.placement === placement.placement ? placement : slot));
        setEdit(placement);
        setNotice(placement.mode === 'adsense' ? 'Bloc AdSense '+placement.adSlot+' attribué à « '+slotTitle(placement.placement)+' ».' : 'Emplacement enregistré.');
      }
      setSnippet('');
    } catch { setError('L’enregistrement a échoué. Vérifie ta connexion et réessaie.'); }
    finally { setSaving(false); onSaving(false); }
  }

  function select(slot:AdPlacement|null) {
    if (busy || (changed && !window.confirm('Abandonner les modifications en cours ?'))) return;
    if (slot) setEdit(slot);
    else if (current) setEdit(current);
    setSiteSetup(slot === null);
    setEnabled(Boolean(settings?.enabled));
    setSnippet(''); setPreview(''); setNotice(''); setError(''); setConflict(false);
  }

  function transferSiteCode() {
    if (busy) return;
    if (!editingFrame && edit && current && (edit.name !== current.name || edit.url !== current.url || edit.image !== current.image || edit.alt !== current.alt)
      && !window.confirm('Abandonner les autres modifications de cet emplacement ?')) return;
    if (current) setEdit(current);
    setSiteSetup(true);
    setEnabled(Boolean(settings?.enabled));
    setPreview(''); setNotice(''); setError(''); setConflict(false);
  }

  function changeMode(mode:AdPlacement['mode']) {
    setSnippet('');
    setPreview('');
    if (mode === 'embed' || mode === 'script' || (mode === 'campaign' && editingFrame)) {
      const source = current?.mode === mode ? current : null;
      update({mode, name:source?.name || '', url:source?.url || '', image:source?.image || '', alt:source?.alt || ''});
    } else update({mode});
  }

  function codeField(label:string) {
    return <label>{label}<textarea rows={5} dir="ltr" spellCheck={false} autoCapitalize="off" autoCorrect="off"
      maxLength={12000} value={snippet} onChange={event => {
        const value = event.target.value;
        setSnippet(value);
        if (editingFrame) {
          setPreview('');
          const nextFrame = parseExternal(value);
          if (nextFrame) update({url:nextFrame.url, name:nextFrame.name});
          else if (!current || current.mode !== edit?.mode || value.trim()) update({url:'', name:''});
          else update({url:current.url, name:current.name});
        }
        clearFeedback();
      }}
      aria-invalid={Boolean(snippetError)} aria-describedby={snippetError ? 'adsense-code-error' : undefined}/>
      {snippetError && <span id="adsense-code-error" role="alert">{snippetError}</span>}
    </label>;
  }

  return <div className="portal-ads">
    <section className="panel ad-directory" aria-labelledby="ads-list-title">
      {settings && <><h2>Site public</h2><button type="button" disabled={busy} aria-pressed={siteSetup} onClick={() => {if (!siteSetup) select(null);}}>
        <span>Code du site Google AdSense</span><small>{settings.enabled ? 'Activé · en-tête HTML' : 'Désactivé'}</small>
      </button></>}
      <h2 id="ads-list-title">Emplacements</h2>
      {slots.length === 0 && !error && <p role="status">Chargement des emplacements…</p>}
      {sections.map(section => <section key={section} className="ad-position-group" aria-label={section}>
        <h3>{section}</h3>
        <ul>{slots.filter(slot => positions[slot.placement].section === section).map(slot => <li key={slot.placement}>
          <button type="button" disabled={busy} aria-pressed={!siteSetup && slot.placement === edit?.placement} onClick={() => {
            if (siteSetup || edit?.placement !== slot.placement) select(slot);
          }}>
            <span>{positions[slot.placement].name}</span><PlacementStatus slot={slot} settings={settings}/>
          </button>
        </li>)}</ul>
      </section>)}
    </section>
    {settings && siteSetup && <form className="panel ad-editor" onSubmit={save} aria-labelledby="ad-google-title">
      <h2 id="ad-google-title">Google AdSense sur le site public</h2>
      <p>Ce script relie BYRVOX à ton compte Google. Pour placer une bannière précise, attribue son numéro de bloc à l’emplacement voulu.</p>
      {settings.client && <details className="ad-saved-script"><summary>Voir le code du site enregistré</summary>
        <p>{settings.enabled ? 'Le site ajoute cette balise dans l’en-tête HTML des pages autorisées.' : 'Le script enregistré est désactivé.'}</p>
        <code>{`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.client}" crossorigin="anonymous"></script>`}</code>
      </details>}
      <fieldset disabled={busy}>
        {codeField(settings.client ? 'Remplacer le code du site' : 'Code du site Google AdSense')}
        {client && <p>Identifiant éditeur · <bdi>{client}</bdi></p>}
        <label>Diffusion du code Google sur BYRVOX<select value={enabled ? 'on' : 'off'} onChange={event => {setEnabled(event.target.value === 'on');clearFeedback();}}>
          <option value="off">Désactivée</option><option value="on">Activée</option>
        </select></label>
        <p className="portal-help">Pour que Google choisisse où placer les annonces, active également les annonces automatiques dans ton compte AdSense.</p>
      </fieldset>
      <button className="red" type="submit" disabled={busy || !changed || conflict || Boolean(snippetError)}>{saving ? 'Enregistrement…' : 'Enregistrer la configuration'}</button>
      {notice && <p role="status" className="admin-note">{notice}</p>}
      {current && <button type="button" className="outline" disabled={busy} onClick={() => select(current)}>Configurer l’emplacement « {slotTitle(current.placement)} »</button>}
    </form>}
    {!siteSetup && edit && current && <form className="panel ad-editor" onSubmit={save} aria-labelledby="ad-editor-title">
      <h2 id="ad-editor-title">{slotTitle(edit.placement)}</h2>
      {edit.placement === 'masthead' && <p className="portal-help">Ce réglage s’applique aussi aux autres pages intérieures sous la navigation.</p>}
      {edit.placement === 'article-photo' && <p className="portal-help">Cet emplacement suit la photo de couverture ou l’illustration des articles qui en ont une.</p>}
      {edit.placement === 'article-mid' && <p className="portal-help">Cet emplacement apparaît entre deux paragraphes, à mi-lecture des articles qui en comptent au moins deux.</p>}
      {positions[edit.placement].section === 'Articles' && <>
        <p className="portal-help">Les articles des éditions automatiques affichent des cadres réservés en attendant la validation publicitaire. Si la rédaction désactive la publicité sur un article, tous ses emplacements sont masqués.</p>
        <a href={current.mode === 'hidden' ? exampleArticle : exampleArticle + '#publicite-' + edit.placement} target="_blank" rel="noreferrer">
          {current.mode === 'hidden' ? 'Ouvrir l’article de référence' : 'Voir cet emplacement dans un article'} ↗</a>
      </>}
      {current.mode==='available' && settings?.enabled && <p className="portal-help">AdSense est activé pour le site. Cet emplacement attend l’attribution d’un bloc ou d’une campagne.</p>}
      {edit.placement==='home' && <a href="https://byrvox.today/#publicite-sous-navigation" target="_blank" rel="noreferrer">Voir la position sur l’accueil ↗</a>}
      <div>Attribution actuellement enregistrée <PlacementStatus slot={current} settings={settings}/></div>
      {editingUnit && changed && <p role="status" className="portal-help">{validUnit && !snippetError && client
        ? 'Bloc prêt à enregistrer pour cet emplacement.' : 'Attribution en cours · numéro ou code de bloc à compléter.'}</p>}
      <fieldset disabled={busy}>
        <label>Afficher sur le site<select value={edit.mode} onChange={event => changeMode(event.target.value as AdPlacement['mode'])}>
          <option value="available">Emplacement disponible</option>
          <option value="campaign">Campagne publicitaire</option>
          <option value="adsense">Bloc Google AdSense</option>
          <option value="embed">Code intégré (iframe)</option>
          <option value="script">Code script externe</option>
          <option value="hidden">Masquer l’emplacement</option>
        </select></label>
        {edit.mode === 'adsense' && <>
          {settings?.client && <label>Numéro du bloc Google (data-ad-slot)<input type="text" dir="ltr" inputMode="numeric" maxLength={10}
            aria-invalid={Boolean(unitHint)} aria-describedby={unitHint ? 'ad-unit-hint' : undefined} pattern="[0-9]{10}" value={parsed?.slot || edit.adSlot} readOnly={Boolean(parsed?.slot)} onChange={event=>update({adSlot:event.target.value.trim()})}/></label>}
          {unitHint && <span id="ad-unit-hint" className="portal-help">{unitHint}</span>}
          {codeField(current.mode === 'adsense' ? 'Remplacer le code du bloc display' : 'Code du bloc display AdSense')}
          {parsed && !parsed.slot && parsed.client !== settings?.client && <button className="outline" type="button" onClick={transferSiteCode}>Utiliser ce code pour le site</button>}
          <p className="portal-help">Dans AdSense, ouvre Annonces → Par bloc d’annonces et copie le code du bloc display. Si le compte éditeur est déjà enregistré ici, son numéro de bloc à 10 chiffres suffit.</p>
          {client && <p>Identifiant éditeur · <bdi>{client}</bdi></p>}
          {validUnit && <p>Numéro de bloc saisi · <bdi>{unit}</bdi></p>}
          <a href="https://support.google.com/adsense/answer/9274025?hl=fr" target="_blank" rel="noreferrer">Créer un bloc display dans Google AdSense ↗</a>
          {(!settings?.enabled || (client && settings.client !== client)) && <p className="portal-help">La diffusion de ce bloc nécessite un code de site activé pour le même identifiant dans « Google AdSense ».</p>}
        </>}
        {editingFrame && <>
          {codeField(editingScript ? 'Code script externe' : current.mode === 'embed' ? 'Remplacer le code iframe' : 'Code iframe de l’annonce')}
          <p className="portal-help">{editingScript ? 'Colle la balise script fournie par la régie. Elle se charge dans un cadre isolé.' : 'Colle la balise iframe fournie par la régie publicitaire.'}</p>
          {parsed && (parsed.slot
            ? <button className="outline" type="button" onClick={() => {setEdit({...current,mode:'adsense'});setPreview('');clearFeedback();}}>Utiliser comme bloc Google AdSense</button>
            : <button className="outline" type="button" onClick={transferSiteCode}>Utiliser ce code pour le site</button>)}
          {edit.url && <>
            <p className="portal-help ad-source">Source · <bdi>{edit.url}</bdi></p>
            <label>Titre de l’annonce<input required maxLength={160} value={edit.name} onChange={event => update({name:event.target.value})}/></label>
            <button className="outline" type="button" onClick={() => setPreview(preview ? '' : edit.url)}>{preview ? 'Fermer l’aperçu' : 'Afficher un aperçu'}</button>
            {preview === edit.url && <AdFrame url={edit.url} name={edit.name} script={editingScript}/>}
          </>}
        </>}
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
      <div className="button-row"><button className="red" type="submit" disabled={busy || conflict || !changed || Boolean(snippetError) || (editingUnit && (!validUnit || !client))}>{saving ? 'Enregistrement…' : 'Enregistrer l’emplacement'}</button>
        {changed && !conflict && <button className="outline" type="button" disabled={busy} onClick={() => {setEdit(current);setSnippet('');setPreview('');setError('');setNotice('');}}>Annuler les modifications</button>}
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
