import { and, eq } from 'drizzle-orm';
import { getDb } from '../db';
import { articles, homepageLead } from '../db/schema';

const slot = 1;

export function getHomepageLead() {
  return getDb().select({ articleId: articles.id, title: articles.title, slug: articles.slug })
    .from(homepageLead).innerJoin(articles, eq(homepageLead.articleId, articles.id))
    .where(and(eq(homepageLead.slot, slot), eq(articles.status, 'published'))).get();
}

export async function getHomepageLeadSlug() {
  return (await getHomepageLead())?.slug ?? null;
}

export async function setHomepageLead(articleId: string | null) {
  const db = getDb();
  if (articleId === null) {
    await db.delete(homepageLead).where(eq(homepageLead.slot, slot));
    return { articleId: null, title: null };
  }
  const story = await db.select({ articleId: articles.id, title: articles.title }).from(articles)
    .where(and(eq(articles.id, articleId), eq(articles.status, 'published'))).get();
  if (!story) return null;
  await db.insert(homepageLead).values({ slot, articleId })
    .onConflictDoUpdate({ target: homepageLead.slot, set: { articleId } });
  return story;
}
