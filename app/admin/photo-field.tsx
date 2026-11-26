import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, ImagePlus, Replace, Trash2 } from 'lucide-react';
import { catalogCover, resolveCover } from '../../lib/cover-photo';
import { photoByteLimit, photoTypes, type ArticlePhoto } from '../../lib/article-photo';

const formats: string[] = Object.values(photoTypes);
type UploadState = { busy: boolean; setUploading: (uploading: boolean) => void };

function UploadButton({ replace, busy, setUploading, change, notify, label }: UploadState & {
  replace?: boolean; label: string; change: (photo: ArticlePhoto) => void; notify: (message: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  async function upload(file?: File) {
    if (!file || request.current) return;
    if (!formats.includes(file.type)) { notify('Choisis une image JPEG, PNG ou WebP.'); return; }
    if (!file.size || file.size > photoByteLimit) { notify('Choisis un fichier non vide de 8 Mio maximum.'); return; }
    const controller = new AbortController();
    request.current = controller;
    setUploading(true);
    notify('Envoi de la photo en cours…');
    try {
      const response = await fetch('/api/newsroom/photos', {
        method: 'POST', headers: { 'Content-Type': file.type }, body: file, signal: controller.signal
      });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw Error(result.error || 'L’envoi de la photo a échoué.');
      change({ url: result.url, alt: '', caption: '', credit: '' });
      notify('Photo chargée. Ajoute son texte alternatif, son crédit et sa légende avant de publier.');
    } catch (error) {
      if (!controller.signal.aborted) notify(error instanceof Error && !(error instanceof TypeError || error instanceof SyntaxError)
        ? error.message : 'La photo n’a pas pu être envoyée. Réessaie dans un instant.');
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setUploading(false);
    }
  }
  return <>
    <input type="file" ref={input} hidden aria-label={label} accept={formats.join(',')} disabled={busy}
      onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void upload(file); }} />
    <button className="outline" disabled={busy} onClick={() => input.current?.click()}>
      {replace ? <Replace size={16} aria-hidden="true" /> : <ImagePlus size={16} aria-hidden="true" />} {label}
    </button>
  </>;
}

function PhotoMetadata({ photo, busy, change }: {
  photo: ArticlePhoto; busy: boolean; change: (photo: ArticlePhoto) => void;
}) {
  const captionHelpId = useId();
  return <div className="portal-photo-fields">
    <label>Texte alternatif<input disabled={busy} value={photo.alt} maxLength={300}
      onChange={event => change({ ...photo, alt: event.target.value })} /></label>
    <label>Crédit photo<input disabled={busy} value={photo.credit} maxLength={300}
      onChange={event => change({ ...photo, credit: event.target.value })} /></label>
    <p className="portal-help">Le texte alternatif décrit l’image pour les lecteurs d’écran. Le crédit identifie le photographe ou l’agence. Tous deux sont requis pour publier.</p>
    <label>Licence ou statut des droits<input disabled={busy} value={photo.license || ''} maxLength={100}
      placeholder="Ex. CC BY 4.0" onChange={event => change({ ...photo, license: event.target.value || undefined })} /></label>
    <label>Lien vers la licence<input type="url" disabled={busy} value={photo.licenseUrl || ''} maxLength={1800}
      placeholder="https://" onChange={event => change({ ...photo, licenseUrl: event.target.value || undefined })} /></label>
    <label>Légende<textarea disabled={busy} value={photo.caption} aria-describedby={captionHelpId} maxLength={1000} rows={2}
      onChange={event => change({ ...photo, caption: event.target.value })} /></label>
    <p id={captionHelpId} className="portal-help">Pour publier une nouvelle photo, indique qui ou quoi elle montre. Précise le lieu et la date si tu les connais. S’il s’agit d’une archive ou d’une illustration, signale-le dans la légende.</p>
    <label>Lien vers la source de la photo <span>(facultatif)</span><input type="url" disabled={busy}
      placeholder="https://" value={photo.sourceUrl || ''} maxLength={2000}
      onChange={event => change({ ...photo, sourceUrl: event.target.value || undefined })} /></label>
  </div>;
}

export function PhotoField({ value, slug, hidden, change, busy, setUploading }: UploadState & {
  value: ArticlePhoto | null; slug: string; hidden: boolean; change: (photo: ArticlePhoto | null, hidden: boolean) => void;
}) {
  const [notice, setNotice] = useState('');
  const catalog = catalogCover(slug);
  const cover = resolveCover(slug, value, hidden);
  return <section className="panel portal-photo" aria-labelledby="photo-title">
    <h2 id="photo-title">Photo de couverture</h2>
    {cover && <Image className="portal-photo-image" unoptimized width={960} height={540}
      src={cover.url} alt={cover.alt || 'Photo de couverture en cours de rédaction'} />}
    {cover && !value && <p className="portal-help">Photo du catalogue · {cover.credit}</p>}
    <div className="button-row portal-photo-actions">
      <UploadButton replace={Boolean(cover)} label={cover ? 'Remplacer la photo' : 'Choisir une photo'} busy={busy}
        setUploading={setUploading} change={photo => change(photo, false)} notify={setNotice} />
      {cover && <button className="outline" disabled={busy} onClick={() => {
        change(null, true); setNotice('Photo retirée de cette version. Enregistre l’article pour conserver le changement.');
      }}><Trash2 size={16} aria-hidden="true" /> Retirer</button>}
      {catalog && (value || hidden) && <button className="outline" disabled={busy} onClick={() => {
        change(null, false); setNotice('Photo du catalogue sélectionnée. Enregistre cet article pour conserver le changement.');
      }}>Utiliser la photo du catalogue</button>}
    </div>
    <p className="portal-help">JPEG, PNG ou WebP · 8 Mio maximum</p>
    {notice && <p role="status" className="portal-photo-status">{notice}</p>}
    {value && <PhotoMetadata photo={value} busy={busy} change={next => change(next, false)} />}
  </section>;
}

export function GalleryField({ photos, change, busy, setUploading }: UploadState & { photos: ArticlePhoto[]; change: (photos: ArticlePhoto[]) => void }) {
  const [notice, setNotice] = useState('');
  function replace(index: number, photo: ArticlePhoto) {
    change(photos.map((entry, i) => index === i ? photo : entry));
  }
  function move(index: number, offset: number) {
    const reordered = [...photos];
    const target = index + offset;
    [reordered[target], reordered[index]] = [reordered[index], reordered[target]];
    change(reordered);
    setNotice('Photo déplacée en position ' + (target + 1) + '.');
  }
  return <details className="panel portal-gallery">
    <summary>Galerie de l’article <span>{photos.length} / 4</span></summary>
    <p>Ajoute jusqu’à quatre photos dans l’ordre de lecture. JPEG, PNG ou WebP · 8 Mio par image.</p>
    {photos.map((photo, index) => <fieldset key={photo.url}>
      <legend>Photo {index + 1}</legend>
      <Image className="portal-photo-image" unoptimized width={960} height={540} src={photo.url} alt={photo.alt || 'Photo de la galerie en cours de rédaction'} />
      <div className="button-row"><button className="outline" disabled={busy || !index} aria-label={'Monter la photo ' + (index + 1)} onClick={() => move(index, -1)}><ChevronUp size={15} aria-hidden="true" /> Monter</button>
        <button className="outline" disabled={busy || index === photos.length - 1} aria-label={'Descendre la photo ' + (index + 1)} onClick={() => move(index, 1)}><ChevronDown size={15} aria-hidden="true" /> Descendre</button>
        <UploadButton replace label={'Remplacer la photo ' + (index + 1)} busy={busy} setUploading={setUploading} notify={setNotice} change={next => replace(index, next)} />
        <button className="outline" disabled={busy} aria-label={'Retirer la photo ' + (index + 1)} onClick={() => {
          change(photos.filter((_, i) => i !== index)); setNotice('Photo retirée de la galerie.');
        }}><Trash2 size={15} aria-hidden="true" /> Retirer</button></div>
      <PhotoMetadata photo={photo} busy={busy} change={next => replace(index, next)} />
    </fieldset>)}
    {photos.length < 4 && <UploadButton label="Ajouter une photo à la galerie" busy={busy} setUploading={setUploading}
      notify={setNotice} change={photo => change([...photos, photo])} />}
    {notice && <p role="status" className="portal-photo-status">{notice}</p>}
  </details>;
}
