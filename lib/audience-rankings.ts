export type AudiencePeriod = 'week' | 'month' | 'year';
export type AudienceScore = { slug: string; kind: string } & Record<AudiencePeriod, number>;
export type AudienceAward = 'view' | 'engage' | AudiencePeriod;

export function rankedArticles<T extends AudienceScore>(rows: T[], kind: string, period: AudiencePeriod) {
  return rows.filter(row => row.kind === kind && row[period] > 0)
    .sort((a, b) => b[period] - a[period] || a.slug.localeCompare(b.slug));
}

export function articleAwards(rows: AudienceScore[], slug: string): AudienceAward[] {
  function leads(kind: string, period: AudiencePeriod) {
    const [first, second] = rankedArticles(rows, kind, period);
    return first?.slug === slug && (!second || first[period] > second[period]);
  }

  const awards: AudienceAward[] = [];
  if (leads('view', 'week')) awards.push('view');
  const periods = ['week', 'month', 'year'] as const;
  const readingPeriod = periods.find(period => leads('read', period));
  if (readingPeriod) awards.push(readingPeriod);
  if (leads('engage', 'week')) awards.push('engage');
  return awards;
}
