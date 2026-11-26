import { env } from 'cloudflare:workers';
import { rankedArticles, type AudienceScore } from './audience-rankings';
import type { PublicLocale } from './i18n';
import { translateSummaries } from './public-translations';
import type { Summary } from './edition';
import { listSavedArticles } from './public-articles';

export type LeaderLabel = 'read' | 'view' | 'week' | 'month' | 'year';
export type NewsSlide = { story: Summary; labels: LeaderLabel[] };
type AudienceRow = AudienceScore & { title: string; category: string; localized: string | null };

export async function audienceRows() {
  if (!env.DB) return [];
  const { results } = await env.DB.prepare(`SELECT a.slug,a.title,a.category,d.kind,
    (SELECT json_group_object(t.locale,t.title) FROM article_translations t WHERE t.slug=a.slug AND t.source_title=a.title) localized,
    sum(case when day>=date('now','-6 days') then total else 0 end) week,
    sum(case when day>=date('now','-29 days') then total else 0 end) month,sum(total) year
    FROM audience_daily d JOIN articles a ON a.slug=d.slug AND a.status='published'
    WHERE day>=date('now','-364 days') GROUP BY a.slug,d.kind`).all<AudienceRow>();
  return results.map(({ localized, ...row }) => ({ ...row, titles: JSON.parse(localized || '{}') }));
}

function shuffle<T>(values: T[]) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const next = Math.floor(Math.random() * (i + 1));
    [result[i], result[next]] = [result[next], result[i]];
  }
  return result;
}

export async function loadNewsLeaders(locale: PublicLocale): Promise<NewsSlide[]> {
  const rows = await audienceRows();
  const reading = rankedArticles(rows, 'read', 'week');
  const viewing = rankedArticles(rows, 'view', 'week');
  const labels = new Map<string, LeaderLabel[]>();
  function mark(slug: string, label: LeaderLabel) {
    labels.set(slug, [...(labels.get(slug) || []), label]);
  }
  for (const period of ['week', 'month', 'year'] as const) {
    const [leader, runnerUp] = period === 'week' ? reading : rankedArticles(rows, 'read', period);
    if (leader && (!runnerUp || leader[period] > runnerUp[period])) mark(leader.slug, period);
  }
  for (const row of reading.slice(0, 5)) mark(row.slug, 'read');
  for (const row of viewing.slice(0, 5)) mark(row.slug, 'view');
  const candidates = await listSavedArticles([...labels.keys()]);
  const illustrated = candidates.filter(story => !story.presentation && story.photo?.url && story.photo.credit);
  const localized = await translateSummaries(illustrated, locale);
  const eligible = shuffle(localized.filter(story => locale === 'fr' || story.contentLocale === locale));
  const selected = new Set<string>();
  for (const story of eligible) {
    if (labels.get(story.slug)?.some(label => label === 'week' || label === 'month' || label === 'year')) selected.add(story.slug);
  }
  const eligibleSlugs = new Set(eligible.map(story => story.slug));
  for (const [label, ranking] of [['view', viewing], ['read', reading]] as const) {
    const first = ranking.slice(0, 5).find(row => eligibleSlugs.has(row.slug));
    if (first) selected.add(first.slug);
    const others = eligible.filter(row => row.slug !== first?.slug && labels.get(row.slug)?.includes(label));
    for (const story of others.slice(0, 2)) selected.add(story.slug);
  }
  return eligible.filter(story => selected.has(story.slug)).map(story => ({story, labels: labels.get(story.slug)!}));
}
