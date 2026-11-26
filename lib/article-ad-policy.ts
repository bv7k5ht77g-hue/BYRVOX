import { z } from 'zod';

const decisionSchema = z.object({
  decision: z.enum(['allow', 'off']),
  checks: z.object({ rights: z.boolean(), safety: z.boolean(), accuracy: z.boolean() }).strict(),
  reason: z.string().trim().max(500),
}).strict();

export type ArticleAdDecision = z.infer<typeof decisionSchema>;
export type ArticleAdReview = ArticleAdDecision & { actor: string; at: string };
const pendingWireReason = 'Édition automatique en attente d’une évaluation publicitaire par la rédaction.';

export function reviewArticleAds(value: unknown, actor: string, at: string): ArticleAdReview | null {
  const parsed = decisionSchema.safeParse(value);
  if (!parsed.success) return null;
  const review = parsed.data;
  if (review.decision === 'allow' ? !Object.values(review.checks).every(Boolean) : !review.reason) return null;
  return { ...review, actor, at };
}

export function unreviewedWireAds(actor: string, at: string): ArticleAdReview {
  return { decision: 'off', checks: { rights: false, safety: false, accuracy: false },
    reason: pendingWireReason, actor, at };
}

export function isPendingWireAdReview(review: ArticleAdReview | null): boolean {
  return review?.decision === 'off' && review.reason === pendingWireReason
    && (review.actor === 'byrvox-agent-horaire' || review.actor === 'byrvox-agent-thematique');
}
