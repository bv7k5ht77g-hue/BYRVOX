import { and, asc, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "../db";
import { articles, articleTranslations } from "../db/schema";
import { matchingSeedSummaries } from "./public-translations";
import type { PublicLocale } from "./i18n";
import { isoDate } from "./publication-date";
import { resolveCover } from "./cover-photo";
import { getHomepageLeadSlug } from "./homepage-lead";

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
    ...(cover ? { photo: cover } : {}),
    publishedAt: isoDate(article.publishedAt),
    updatedAt: isoDate(article.updatedAt),
  };
}

export async function listHomepageStories() {
  const pinned = await getHomepageLeadSlug();
  return (await publishedQuery(undefined, pinned).limit(9)).map(summary);
}

export async function listPublishedArticles(limit?: number) {
  const query = publishedQuery();
  const rows = await (limit === undefined ? query : query.limit(limit));
  return rows.map(summary);
}

// SQLite's built-in case folding is ASCII-only. Match French letters in either
// case and with common diacritics; keep reader-supplied glob operators literal.
const frenchLetters: Record<string, string> = {
  a: "aàâäáãå", c: "cç", e: "eéèêë", i: "iîïíì", o: "oôöóòõ",
  u: "uûùüú", y: "yÿý", n: "nñ", "œ": "œ", "æ": "æ",
};

function searchPattern(term: string) {
  const plain = term.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const chars = Array.from(plain, (c) => {
    if (c === "[" || c === "?" || c === "*") return "[" + c + "]";
    const letters = frenchLetters[c] ?? c;
    const upper = letters.toUpperCase();
    return upper === letters ? c : "[" + letters + upper + "]";
  });
  return "*" + chars.join("") + "*";
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
      ...words.map(word => sql`${translatedContent} GLOB ${searchPattern(word)}`))) : null;
  const criteria = and(
    category ? eq(articles.category, category) : undefined,
    or(and(...words.map((word) => sql`${content} GLOB ${searchPattern(word)}`)),
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
    categories: categories.map(({ name }) => name),
  };
}

export async function listSavedArticles(slugs: string[]) {
  const unique = Array.from(new Set(slugs));
  const matches = new Map<string, ReturnType<typeof summary>>();
  for (let i = 0; i < unique.length; i += 50) {
    const rows = await publishedQuery(inArray(articles.slug, unique.slice(i, i + 50)));
    for (const row of rows) matches.set(row.slug, summary(row));
  }
  return unique.flatMap((slug) => {
    const match = matches.get(slug);
    return match ? [match] : [];
  });
}

// Include the article's own news cycle on archive visits, alongside current stories.
export async function readerCandidates(publishedAt?: string | null) {
  const recent = await listPublishedArticles(96);
  if (!publishedAt || !recent.length || publishedAt >= (recent[recent.length - 1].publishedAt ?? '')) return recent;
  const past = await publishedQuery(sql`${articles.publishedAt} <= ${publishedAt}`).limit(48);
  return [...recent, ...past.map(summary)];
}
