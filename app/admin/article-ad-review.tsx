import { useId, useState, type FormEvent } from 'react';
import type { ArticleAdDecision, ArticleAdReview } from '../../lib/article-ad-policy';
import { TranslationImport, type TranslationSubmission } from './article-translations';
import { articleUrl, NEW_SITE_ORIGIN } from '../../lib/site-url';

type Props = {
  mode: 'publication' | 'live';
  slug: string;
  current?: ArticleAdReview | null;
  busy: boolean;
  hasEdits: boolean;
  blocked?: boolean;
  onSubmit: (review: ArticleAdDecision) => void;
};

const checks = [
  ['accuracy', 'J’ai vérifié les faits, les sources et l’originalité du texte.'],
  ['rights', 'J’ai vérifié les droits de republication du texte et des visuels.'],
  ['safety', 'J’ai examiné le titre, le texte et les visuels au regard des règles des régies, y compris le contenu choquant, illicite ou réglementé.'],
] as const;

export function PublicationReview({ onPublish, ...props }: Pick<Props, 'slug' | 'busy' | 'hasEdits'> & {
  onPublish: (review: ArticleAdDecision, translations?: TranslationSubmission) => void;
}) {
  const [translations, setTranslations] = useState<TranslationSubmission | null>(null);
  const [invalid, setInvalid] = useState(false);
  return <>
    <TranslationImport onChange={setTranslations} onInvalid={setInvalid}/>
    <ArticleAdReviewForm {...props} mode="publication" blocked={invalid}
      onSubmit={review => onPublish(review, translations ?? undefined)}/>
  </>;
}

export function ArticleAdReviewForm({ mode, slug, current, busy, hasEdits, blocked, onSubmit }: Props) {
  const fieldId = useId();
  const publication = mode === 'publication';
  const [decision, setDecision] = useState<ArticleAdDecision['decision'] | ''>('');
  const [checked, setChecked] = useState({ accuracy: false, rights: false, safety: false });
  const [reason, setReason] = useState('');
  const ready = decision === 'allow' ? checks.every(([key]) => checked[key]) : decision === 'off' && Boolean(reason.trim());

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decision || !ready || blocked || hasEdits || busy) return;
    onSubmit({ decision, checks: checked, reason: decision === 'off' ? reason.trim() : '' });
  }

  const title = publication ? 'Validation publicitaire avant publication' : 'Publicité de la version en ligne';
  return <section className={publication ? 'article-ad-review' : 'panel article-ad-review'} aria-labelledby={fieldId}>
    <h2 id={fieldId}>{title}</h2>
    {!publication && <>
      <p>Évaluation en vigueur · <strong>{current ? current.decision === 'off' ? 'Publicité désactivée' : 'Publicité autorisée' : 'Aucune évaluation consignée'}</strong></p>
      {current?.reason && <p>Motif · {current.reason}</p>}
      <a className="portal-link" href={articleUrl(slug, NEW_SITE_ORIGIN)} target="_blank" rel="noreferrer">Relire la version en ligne (nouvel onglet)</a>
    </>}
    <form onSubmit={submit}>
      <fieldset disabled={busy || hasEdits}>
        <label>Décision de la rédaction
          <select value={decision} required onChange={event => setDecision(event.target.value as typeof decision)}>
            <option value="">Choisir la diffusion</option>
            <option value="allow">Autoriser la publicité sur cet article</option>
            <option value="off">Désactiver la publicité sur cet article</option>
          </select>
        </label>
        {decision === 'allow' && <fieldset className="article-ad-checks">
          <legend>Vérifications avant d’autoriser les annonces</legend>
          {checks.map(([key, label]) => <label key={key}><input type="checkbox" checked={checked[key]} required
            onChange={event => setChecked(previous => ({...previous, [key]: event.target.checked}))}/>{label}</label>)}
        </fieldset>}
        {decision === 'off' && <label>Motif interne
          <textarea required maxLength={500} rows={2} value={reason} placeholder="Ex. Sujet sensible ou restriction d’une régie."
            onChange={event => setReason(event.target.value)} />
        </label>}
        <details className="article-ad-guidance">
          <summary>Consulter les critères de Google AdSense</summary>
          <p>Google interdit la monétisation des pages qui enfreignent son règlement. Certains contenus, comme des images explicites de violence, peuvent recevoir moins d’annonces. BYRVOX peut aussi retirer les annonces par choix éditorial.</p>
          <a href="https://support.google.com/publisherpolicies/answer/10502938?hl=fr" target="_blank" rel="noreferrer">Règlement pour les éditeurs</a>
          <a href="https://support.google.com/adsense/answer/10437795?hl=fr" target="_blank" rel="noreferrer">Restrictions applicables aux éditeurs</a>
        </details>
      </fieldset>
      {hasEdits && <p className="portal-help">Enregistre d’abord les modifications de l’article.</p>}
      <button type="submit" className={publication ? 'red' : 'outline'} disabled={!ready || blocked || busy || hasEdits}>
        {publication ? decision === 'off' ? 'Publier sans publicité' : 'Valider et publier' : 'Appliquer à la version en ligne'}
      </button>
    </form>
  </section>;
}
