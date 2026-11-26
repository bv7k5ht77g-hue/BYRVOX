'use client';

// The session callback always returns to /admin. Restore only a local article slug.
const returnKey = 'byrvox-editor-return-to-ads';

function adArticleFromUrl() {
  const slug = new URLSearchParams(window.location.search).get('publicite');
  if (slug === null) return null;
  return /^[\p{Letter}\p{Number}_-]{1,220}$/u.test(slug) ? slug : '';
}

export function AdPortalSignIn({portalEntry = false, article}: {portalEntry?:boolean; article?:string}) {
  return <a className={portalEntry ? 'red' : undefined} href="/api/editor-session/start" target="_top" onClick={() => {
    const slug = article || adArticleFromUrl();
    try {
      if (!portalEntry || slug !== null) sessionStorage.setItem(returnKey, slug || '');
      else sessionStorage.removeItem(returnKey);
    } catch { /* Login also works without session storage. */ }
  }}>{portalEntry ? 'Se connecter à la rédaction' : 'Se reconnecter à la rédaction'}</a>;
}

export function consumeAdPortalReturn() {
  const requested = adArticleFromUrl();
  try {
    const stored = sessionStorage.getItem(returnKey);
    sessionStorage.removeItem(returnKey);
    return requested ?? stored;
  } catch { return requested; }
}
