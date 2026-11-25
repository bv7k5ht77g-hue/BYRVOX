import { CoverFigure } from '../../components/edition/cover-figure';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { resolveCover } from '../../lib/cover-photo';
import type { ArticlePhoto } from '../../lib/article-photo';

type PreviewArticle = {
  slug: string; photoHidden: boolean; gallery: ArticlePhoto[]; title: string; category: string; summary: string; body: string;
  sources: { name: string; url: string }[]; photo: ArticlePhoto | null;
};

function safeSource(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}

export function ArticlePreview({ article, close }: { article: PreviewArticle; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  const { sources } = article;
  const photo = resolveCover(article.slug, article.photo, article.photoHidden);
  return <dialog ref={ref} className="portal-preview" aria-labelledby="preview-heading"
    onCancel={event => { event.preventDefault(); close(); }}>
    <div className="portal-preview-head"><strong id="preview-heading">Aperçu privé</strong>
      <button className="outline" onClick={close}><X size={16} aria-hidden="true" /> Fermer</button></div>
    <article><p className="eyebrow">{article.category}</p>
      <h2>{article.title || 'Article sans titre'}</h2>
      {article.summary && <p className="portal-preview-summary">{article.summary}</p>}
      {photo && <CoverFigure photo={{ ...photo, sourceUrl: safeSource(photo.sourceUrl) }} />}
      <div className="portal-preview-copy">{article.body.split(/\r?\n/).filter(line => line.trim()).map((line, index) => <p key={index}>{line}</p>)}</div>
      {article.gallery.length > 0 && <section><h3>En images</h3>{article.gallery.map((image, index) =>
        <CoverFigure key={image.url + index} photo={{ ...image, sourceUrl: safeSource(image.sourceUrl) }} />)}</section>}
      {sources.some(source => source.name || source.url) && <section><h3>Sources de l’article</h3><ul>
        {sources.filter(source => source.name || source.url).map((source, index) => <li key={index}>
          {safeSource(source.url) ? <a href={source.url} target="_blank" rel="noreferrer">{source.name || source.url}</a> : <strong>{source.name}</strong>}
          {source.url && <small>{source.url}</small>}</li>)}
      </ul></section>}
    </article>
  </dialog>;
}
