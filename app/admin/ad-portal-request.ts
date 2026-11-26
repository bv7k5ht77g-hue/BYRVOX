export class AdPortalError extends Error {
  constructor(message: string, readonly status = 0) {
    super(message);
  }
}

export async function adPortalRequest<T>(url: string, options: RequestInit): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  let response: Response;
  try {
    response = await fetch(url, {...options, headers});
  } catch (cause) {
    if (options.signal?.aborted) throw cause;
    throw new AdPortalError('Aucune réponse du portail. Vérifie ta connexion, puis réessaie.');
  }
  const json = response.headers.get('content-type')?.includes('application/json');
  const data = json ? await response.json().catch(() => null) : null;
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' ? data.error : '';
    if (response.status === 401) throw new AdPortalError(message || 'Ta session éditeur a expiré.', 401);
    if (response.status === 403) throw new AdPortalError(message || 'Accès réservé aux responsables de la rédaction.', 403);
    throw new AdPortalError(message || `Le portail a renvoyé une erreur (HTTP ${response.status}). Réessaie.`, response.status);
  }
  if (!data) throw new AdPortalError('Le portail a renvoyé une réponse inattendue. Recharge la page, puis réessaie.');
  return data as T;
}

export function adPortalError(cause: unknown, fallback: string) {
  return cause instanceof AdPortalError ? cause : new AdPortalError(fallback);
}
