import { useState, type FormEvent } from 'react';
import { NEW_SITE_ORIGIN, SITE_ORIGIN } from '../../lib/site-url';

export function articleIdentifier(value: string) {
  const clean = value.trim();
  if (!clean.includes('/')) return clean;
  try {
    const url = new URL(clean, NEW_SITE_ORIGIN);
    const match = /^\/article\/([^/]+)\/?$/.exec(url.pathname);
    if ([NEW_SITE_ORIGIN, SITE_ORIGIN].includes(url.origin) && match) return decodeURIComponent(match[1]);
  } catch { return ''; }
  return '';
}

export function OpenArticle({ open, busy }: { open: (identifier: string) => Promise<void>; busy: boolean }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const identifier = articleIdentifier(value);
    if (!identifier) { setError('Saisis le lien d’un article BYRVOX ou son identifiant.'); return; }
    try { await open(identifier); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Impossible d’ouvrir cet article.'); }
  }
  return <details className="portal-article-lookup">
    <summary>Ouvrir un article par son lien ou son identifiant</summary>
    <form onSubmit={submit}>
      <label>Lien ou identifiant de l’article<input required maxLength={1000} value={value}
        onChange={event => {setValue(event.target.value); setError('');}}/></label>
      <button type="submit" disabled={busy || !value.trim()} className="outline">Ouvrir dans l’éditeur</button>
    </form>
    {error && <p role="alert">{error}</p>}
  </details>;
}
