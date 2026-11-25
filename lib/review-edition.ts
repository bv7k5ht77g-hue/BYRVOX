import { env } from 'cloudflare:workers';
import initialEnvelope from './review/2026-11-25.json';
import iowaEnvelope from './review/2026-11-25-iowa.json';

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

export const reviewEditions = [
  { id: 'byrvox-2026-11-25', secret: 'BYRVOX_REVIEW_KEY_20261125', envelope: initialEnvelope },
  { id: 'byrvox-2026-11-25-iowa', secret: 'BYRVOX_REVIEW_KEY_20261125_IOWA', envelope: iowaEnvelope },
] as const;
export type ReviewEditionSource = typeof reviewEditions[number];

export async function readReviewEdition(source: ReviewEditionSource): Promise<ReviewEdition | null> {
  const secret = (env as unknown as Partial<Record<ReviewEditionSource['secret'], string>>)[source.secret];
  if (!secret) return null;
  const key = await crypto.subtle.importKey('raw', bytes(secret), 'AES-GCM', false, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes(source.envelope.iv), additionalData: new TextEncoder().encode(source.id) },
    key, bytes(source.envelope.ciphertext),
  );
  const edition: ReviewEdition = JSON.parse(new TextDecoder().decode(decrypted));
  if (edition.id !== source.id) throw Error('Édition de rédaction invalide.');
  return edition;
}
