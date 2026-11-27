import { and, asc, desc, eq, inArray, not, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "../db";
import { articles, articleTranslations } from "../db/schema";
import { matchingSeedSummaries } from "./public-translations";
import type { PublicLocale } from "./i18n";
import { isoDate } from "./publication-date";
import { archiveSearchTerms } from "./reader-recommendations";
import type { Summary } from "./edition";
import { features } from "./content";
import { resolveCover } from "./cover-photo";
import { getHomepageLeadSlug } from "./homepage-lead";
import { canonicalCategory, categoryAliases, deskFamilies, mostRatedLimit, orderedCategories, type CategoryHeadlines } from "./editorial-sections";
import { albertaNationalTerms, albertaRegionalTerms, publicStoryCategory, sportKeywords } from "./story-topics";
import { containsSearchTerms, hasSearchPhrase } from "./search-text";
import { countryKeywords, regionalCountries, regionKeywords } from "./regional-coverage";

const summaryFields = {
  slug: articles.slug,
  title: articles.title,
  category: articles.category,
  summary: articles.summary,
  publishedAt: articles.publishedAt,
  updatedAt: articles.updatedAt,
  photo: articles.photo,
  photoHidden: articles.photoHidden,
};
const isPublished = eq(articles.status, "published");
const editionPageSize = 12;

function publishedQuery(criteria?: SQL, leadSlug?: string | null) {
  return getDb().select(summaryFields).from(articles)
    .where(and(isPublished, criteria))
    .orderBy(...(leadSlug ? [desc(eq(articles.slug, leadSlug))] : []), desc(articles.publishedAt), desc(articles.slug));
}

type Row = Awaited<ReturnType<typeof publishedQuery>>[number];

function summary({ photo, photoHidden, ...article }: Row) {
  const cover = resolveCover(article.slug, photo, photoHidden);
  return {
    ...article,
    category: publicStoryCategory(article),
    ...(cover ? { photo: cover } : {}),
    publishedAt: isoDate(article.publishedAt),
    updatedAt: isoDate(article.updatedAt),
  };
}

export async function listHomepageStories() {
  const pinned = await getHomepageLeadSlug();
  return (await publishedQuery(undefined, pinned).limit(9)).map(summary);
}

// These two reported features predate a dedicated dossier category.
const dossierFeatures = [
  'starshield-la-face-cachee-de-starlink-65da7a18',
  'musk-deux-actions-spacex-enfants-comptes-actifs',
];

export async function listMostRatedArticles() {
  const count = sql<number>`count(*)`;
  const average = sql<number>`avg(votes.score)`;
  const votes = sql`(SELECT slug, score FROM article_ratings UNION ALL SELECT slug, score FROM article_guest_ratings) AS votes`;
  const rows = await getDb().select({...summaryFields, count, average}).from(votes)
    .innerJoin(articles, sql`${articles.slug} = votes.slug`).where(isPublished)
    .groupBy(articles.slug)
    .orderBy(desc(count), desc(average), desc(articles.publishedAt), asc(articles.slug)).limit(mostRatedLimit);
  return rows.map(({count,average,...fields}) => ({story:summary(fields),count,average}));
}

export async function listDossierArticles() {
  const categories = ['Dossier', 'Dossiers', 'Analyse', 'Analyses', 'Enquête', 'Enquêtes'];
  const inDossier = or(inArray(articles.slug, dossierFeatures),
    ...categories.map(category => sql`${articles.category} = ${category} COLLATE NOCASE`));
  return (await publishedQuery(inDossier).limit(24)).map(summary);
}

export async function listPublishedArticles(limit?: number) {
  const query = publishedQuery();
  const rows = await (limit === undefined ? query : query.limit(limit));
  return rows.map(summary);
}

const electionTerms = ['élection', 'élections', 'électoral', 'électorale', 'électoraux', 'électorales',
  'présidentielle', 'législatives', 'scrutin', 'scrutins', 'référendum'];

function categoryPredicate(name: string) {
  const category = canonicalCategory(name);
  const exact = (names: string[]) => or(...names.map(n => sql`${articles.category} = ${n} COLLATE NOCASE`));
  const names = Object.hasOwn(categoryAliases,category) ? categoryAliases[category] : [category];
  const children = Object.hasOwn(deskFamilies,category) ? deskFamilies[category] : [];
  const headline = sql`(' ' || ${articles.title} || ' ')`;
  if (Object.hasOwn(countryKeywords,category)) {
    return or(exact(names),hasSearchPhrase(headline,countryKeywords[category]));
  }
  if (Object.hasOwn(regionalCountries,category)) {
    const countries = regionalCountries[category];
    const terms = [category, ...(category === 'Caraïbes' ? ['Antilles'] : []), ...regionKeywords(category)];
    return or(exact([...names,...countries.flatMap(country=>categoryAliases[country] || [country])]),hasSearchPhrase(headline,terms));
  }
  if (category === 'Canada' || category === 'Alberta') {
    const copy = sql`(${articles.title} || ' ' || ${articles.summary})`;
    const dateline = sql`lower(trim(substr(${articles.title}, 1, instr(${articles.title}, ':') - 1), ' ' || char(160) || char(8239)))`;
    const regional = or(sql`${dateline} = 'alberta'`,
      and(sql`instr(lower(${copy}), 'alberta') > 0`,hasSearchPhrase(copy,albertaRegionalTerms)));
    if (category === 'Alberta') return or(exact(names), regional,
      and(exact(['Canada']),hasSearchPhrase(copy,albertaNationalTerms)));
    return or(exact([...names,...children]),regional);
  }
  if (children.length) {
    const categorized = exact([...names, ...children.flatMap(child => categoryAliases[child] || [child])]);
    return category === 'International' ? or(categorized,hasSearchPhrase(headline,Object.values(countryKeywords).flat())) : categorized;
  }
  if (category === 'Soccer' || category === 'LNH') {
    const sports = exact(['Sport','Sports','Hockey','Hockey sur glace']);
    const copy = sql`(' ' || ${articles.title} || ' ' || ${articles.summary} || ' ')`;
    const otherFootball = category === 'Soccer' ? hasSearchPhrase(copy,['football américain','football canadien','NFL','LCF']) : undefined;
    return or(exact(names), and(sports, hasSearchPhrase(copy,sportKeywords[category]), otherFootball ? not(otherFootball) : undefined));
  }
  if (category === 'Élections') return or(exact(names),hasSearchPhrase(headline,electionTerms));
  return exact(names);
}

export async function listCategoryHeadlines(selected?: string): Promise<CategoryHeadlines[]> {
  const db = getDb();
  const categories = selected ? [canonicalCategory(selected)] : orderedCategories(
    (await db.selectDistinct({name:articles.category}).from(articles).where(isPublished).orderBy(asc(articles.category))).map(row=>row.name));
  const groups: CategoryHeadlines[] = [];
  // Batch the per-section limits so a prolific desk cannot crowd out quieter sections.
  for (let i=0; i<categories.length; i+=20) {
    const batch = categories.slice(i,i+20);
    const [first,...rest] = batch.map(category=>publishedQuery(categoryPredicate(category)).limit(6));
    const rows = await db.batch([first,...rest]);
    batch.forEach((category,index) => groups.push({category,stories:rows[index].map(summary)}));
  }
  return groups;
}

export async function readEditionArticles({ page = 1, query = "", category = "", locale = "fr" }: {
  page?: number; query?: string; category?: string; locale?: PublicLocale;
} = {}) {
  const content = sql`(${articles.title} || ' ' || ${articles.summary} || ' ' || ${articles.category})`;
  const words = query.trim().slice(0, 160).split(/\s+/u).filter(Boolean).slice(0,16);
  const seedMatches = locale !== "fr" && words.length ? await matchingSeedSummaries(words, locale) : [];
  const translatedContent = sql`(${articleTranslations.title} || ' ' || ${articleTranslations.summary})`;
  const cachedMatches = locale !== "fr" && words.length ? getDb().select({ slug:articleTranslations.slug })
    .from(articleTranslations).where(and(eq(articleTranslations.locale, locale),
      eq(articleTranslations.sourceTitle, articles.title), eq(articleTranslations.sourceSummary, articles.summary),
      containsSearchTerms(translatedContent,words))) : null;
  const criteria = and(
    category ? categoryPredicate(category) : undefined,
    or(containsSearchTerms(content,words),
      cachedMatches ? inArray(articles.slug, cachedMatches) : undefined,
      ...seedMatches.map(match => and(eq(articles.slug,match.slug),eq(articles.title,match.sourceTitle),eq(articles.summary,match.sourceSummary)))),
  );
  const currentPage = Number.isSafeInteger(page) && page > 0 ? Math.min(page, 1_000_000) : 1;
  const [rows, categories] = await Promise.all([
    publishedQuery(criteria).limit(editionPageSize + 1).offset((currentPage - 1) * editionPageSize),
    getDb().selectDistinct({ name: articles.category }).from(articles)
      .where(isPublished).orderBy(asc(articles.category)),
  ]);
  return {
    stories: rows.slice(0, editionPageSize).map(summary),
    hasNext: rows.length > editionPageSize,
    categories: orderedCategories(categories.map(({ name }) => name)),
  };
}

export async function listSavedArticles(slugs: string[]) {
  const unique = Array.from(new Set(slugs));
  const matches = new Map<string, Summary>();
  for (let i = 0; i < unique.length; i += 50) {
    const rows = await publishedQuery(inArray(articles.slug, unique.slice(i, i + 50)));
    for (const row of rows) matches.set(row.slug, summary(row));
  }
  for (const { slug, title, category, summary, image } of features) {
    if (unique.includes(slug)) matches.set(slug, { slug, title, category, summary, image, presentation: true });
  }
  return unique.flatMap((slug) => {
    const match = matches.get(slug);
    return match ? [match] : [];
  });
}

// Recent discoveries and matching archive stories are ranked together by the reader.
export async function readerCandidates(story:Summary) {
  const text=sql`(${articles.title} || ' ' || ${articles.summary})`;
  const keywords=archiveSearchTerms(story);
  const [recent, sameCategory, archive] = await Promise.all([
    listPublishedArticles(72),
    publishedQuery(eq(articles.category,story.category)).limit(40),
    keywords.length ? publishedQuery(hasSearchPhrase(text,keywords)).limit(64) : Promise.resolve([]),
  ]);
  return [...recent,...sameCategory.map(summary),...archive.map(summary)];
}
