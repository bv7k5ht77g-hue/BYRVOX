import { and, asc, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { getDb } from "../db";
import { articles } from "../db/schema";
import { isoDate } from "./publication-date";

const summaryFields = {
  slug: articles.slug,
  title: articles.title,
  category: articles.category,
  summary: articles.summary,
  publishedAt: articles.publishedAt,
  updatedAt: articles.updatedAt,
};
const isPublished = eq(articles.status, "published");
const editionPageSize = 12;

function publishedQuery(criteria?: SQL) {
  return getDb().select(summaryFields).from(articles)
    .where(and(isPublished, criteria))
    .orderBy(desc(articles.publishedAt), desc(articles.slug));
}

type Row = Awaited<ReturnType<typeof publishedQuery>>[number];

function summary(article: Row) {
  return {
    ...article,
    publishedAt: isoDate(article.publishedAt),
    updatedAt: isoDate(article.updatedAt),
  };
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

export async function readEditionArticles({ page = 1, query = "", category = "" }: {
  page?: number; query?: string; category?: string;
} = {}) {
  const content = sql`(${articles.title} || ' ' || ${articles.summary} || ' ' || ${articles.category})`;
  const words = query.trim().slice(0, 160).split(/\s+/u).filter(Boolean);
  const criteria = and(
    category ? eq(articles.category, category) : undefined,
    ...words.map((word) => sql`${content} GLOB ${searchPattern(word)}`),
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
