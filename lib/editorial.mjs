export const sensitive = /accusation|crime|conflit|santé|élection|finance|décès|catastrophe/i;
function validSource(source) {
  if (typeof source?.name !== 'string' || !source.name.trim() || typeof source.url !== 'string') return false;
  const address = source.url.trim();
  // Require an authority, since URL also normalizes abbreviated inputs such as https:/path.
  if (!/^https:\/\/[^/\\?#\s]/i.test(address)) return false;
  try {
    const url = new URL(address);
    return Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function publicationError(article) {
  if (!article.title?.trim() || !article.body?.trim() || !article.summary?.trim()) {
    return 'Titre, résumé et article requis.';
  }
  let sources;
  try {
    sources = typeof article.sources === 'string' ? JSON.parse(article.sources) : article.sources;
  } catch {
    return 'Sources invalides.';
  }
  if (!Array.isArray(sources) || !sources.length) return 'Au moins une source vérifiable est requise.';
  if (!sources.every(validSource)) return 'Chaque source doit avoir un nom et une URL HTTPS absolue sans identifiants.';
  if (article.status !== 'review') return 'Soumets cet article à la vérification avant publication.';
  return null;
}
export function canAutoPublish(){return false;} // Automatic publishing remains disabled until source policy is explicitly approved.
export function slugify(t){return t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100)}
