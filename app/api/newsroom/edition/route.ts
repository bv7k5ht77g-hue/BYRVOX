import { and, eq, inArray, sql } from 'drizzle-orm';
import { getDb } from '../../../../db';
import { articles, revisions, runs } from '../../../../db/schema';
import { newsroomOwner, sameOrigin } from '../../../../lib/access';
import { readReviewEdition, reviewEditions, type ReviewEditionSource } from '../../../../lib/review-edition';

function runId(editionId: string) {
  return 'review-edition:' + editionId;
}

function response(data: object, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

function unavailable() {
  return response({ ok: false, status: 'unavailable', error: 'L’édition de vérification est indisponible.' }, 503);
}

async function articleId(editionId: string, slug: string) {
  const key = new TextEncoder().encode(JSON.stringify([editionId, slug]));
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', key));
  return 'edition-' + Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('');
}

type Outcome = { status: 'imported' | 'unchanged' | 'unavailable'; imported: number };

async function importEdition(source: ReviewEditionSource, actor: string): Promise<Outcome> {
  const marker = runId(source.id);
  const db = getDb();
  try {
    const edition = await readReviewEdition(source);
    if (!edition) return { status: 'unavailable', imported: 0 };
    const now = new Date().toISOString();
    const statements = await Promise.all(edition.articles.map(async item => {
      const id = await articleId(edition.id, item.slug);
      const row: typeof articles.$inferSelect = {
        ...item, id, sources: JSON.stringify(item.sources), status: 'review', publishedAt: null,
        createdAt: edition.createdAt, updatedAt: now, authorId: 'byrvox-redaction-assistee', photo: null, photoHidden: false, gallery: [], draft: null, version: 0,
      };
      // SQLite changes() reflects the immediately preceding insert on this batch's connection.
      // A conflicting ID or slug therefore keeps both the existing article and its audit trail intact.
      const audit = db.insert(revisions).select(db.select({
        id: sql<string>`${'review-' + id}`.as('id'),
        articleId: articles.id,
        snapshot: sql<string>`${JSON.stringify({ ...row, isLive: false })}`.as('snapshot'),
        actor: sql<string>`${actor}`.as('actor'),
        action: sql<string>`'import-review'`.as('action'),
        createdAt: sql<string>`${now}`.as('created_at'),
      }).from(articles).where(and(eq(articles.id, id), sql`changes() = 1`)));
      return [db.insert(articles).values(row).onConflictDoNothing(), audit] as const;
    }));
    // The unique marker and the article/revision pairs commit together. A concurrent
    // importer loses on the marker and its entire batch rolls back.
    const result = await db.batch([
      db.insert(runs).values({ id: marker, kind: 'review-edition', status: 'ok',
        detail: 'Édition de vérification ' + edition.id, createdAt: now }),
      ...statements.flat(),
    ]);
    let imported = 0;
    for (let index = 1; index < result.length; index += 2) imported += result[index].meta.changes;
    return { status: 'imported', imported };
  } catch {
    const completed = await db.select({ id: runs.id }).from(runs).where(eq(runs.id, marker)).get();
    return { status: completed ? 'unchanged' : 'unavailable', imported: 0 };
  }
}

export async function POST(request: Request) {
  const user = await newsroomOwner();
  if (!user || !sameOrigin(request)) return response({ ok: false, error: 'Accès interdit.' }, 403);
  try {
    const markers = await getDb().select({ id: runs.id }).from(runs)
      .where(inArray(runs.id, reviewEditions.map(source => runId(source.id))));
    const completed = new Set(markers.map(marker => marker.id));
    const pending = reviewEditions.filter(source => !completed.has(runId(source.id)));
    let imported = 0;
    let unavailableCount = 0;
    let didImport = false;
    for (const source of pending) {
      const outcome = await importEdition(source, user.userId);
      imported += outcome.imported;
      if (outcome.status === 'imported') didImport = true;
      if (outcome.status === 'unavailable') unavailableCount++;
    }
    if (unavailableCount === reviewEditions.length) return unavailable();
    if (unavailableCount) return response({ ok: true, status: 'partial', imported, unavailable: unavailableCount });
    return response({ ok: true, status: didImport ? 'imported' : 'unchanged', imported });
  } catch {
    return unavailable();
  }
}
