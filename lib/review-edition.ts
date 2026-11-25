import { env } from 'cloudflare:workers';
import envelope from './review/2026-11-25.json';

export type ReviewArticle = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  body: string;
  risk: 'standard' | 'sensitive';
  sources: { name: string; url: string }[];
};

type ReviewEdition = { id: string; createdAt: string; articles: ReviewArticle[] };

function bytes(base64: string) {
  return Uint8Array.from(atob(base64), char => char.charCodeAt(0));
}

export const reviewEditionId = 'byrvox-2026-11-25';

export async function readReviewEdition(): Promise<ReviewEdition | null> {
  const secret = (env as unknown as { BYRVOX_REVIEW_KEY_20261125?: string }).BYRVOX_REVIEW_KEY_20261125;
  if (!secret) return null;
  const key = await crypto.subtle.importKey('raw', bytes(secret), 'AES-GCM', false, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes(envelope.iv), additionalData: new TextEncoder().encode(reviewEditionId) },
    key, bytes(envelope.ciphertext),
  );
  const edition: ReviewEdition = JSON.parse(new TextDecoder().decode(decrypted));
  if (edition.id !== reviewEditionId) throw Error('Édition de rédaction invalide.');
  return edition;
}
