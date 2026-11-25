import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '../../../../db';
import { articles, revisions, runs } from '../../../../db/schema';
import { admin, sameOrigin } from '../../../../lib/access';
import { readReviewEdition, reviewEditionId } from '../../../../lib/review-edition';

const runId = 'review-edition:' + reviewEditionId;

function response(data: object, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

function unchanged() {
  return response({ ok: true, status: 'unchanged', imported: 0 });
}

function unavailable() {
  return response({ ok: false, status: 'unavailable', error: 'L’édition de vérification est indisponible.' }, 503);
}

async function hasImported() {
  return getDb().select({ id: runs.id }).from(runs).where(eq(runs.id, runId)).get();
}

async function articleId(slug: string) {
  const key = new TextEncoder().encode(JSON.stringify([reviewEditionId, slug]));
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', key));
  return 'edition-' + Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: Request) {
  const user = await admin();
  if (!user || !sameOrigin(request)) return response({ ok: false, error: 'Accès interdit.' }, 403);

  try {
    if (await hasImported()) return unchanged();
    const edition = await readReviewEdition();
    if (!edition) return unavailable();
    const now = new Date().toISOString();
    const db = getDb();
    const statements = await Promise.all(edition.articles.map(async item => {
      const id = await articleId(item.slug);
      const row: typeof articles.$inferSelect = {
        ...item, id, sources: JSON.stringify(item.sources), status: 'review', publishedAt: null,
        createdAt: edition.createdAt, updatedAt: now, authorId: 'byrvox-redaction-assistee', draft: null, version: 0,
      };
      // SQLite changes() reflects the immediately preceding insert on this batch's connection.
      // A conflicting ID or slug therefore keeps both the existing article and its audit trail intact.
      const audit = db.insert(revisions).select(db.select({
        id: sql<string>`${'review-' + id}`.as('id'),
        articleId: articles.id,
        snapshot: sql<string>`${JSON.stringify({ ...row, isLive: false })}`.as('snapshot'),
        actor: sql<string>`${user.userId}`.as('actor'),
        action: sql<string>`'import-review'`.as('action'),
        createdAt: sql<string>`${now}`.as('created_at'),
      }).from(articles).where(and(eq(articles.id, id), sql`changes() = 1`)));
      return [db.insert(articles).values(row).onConflictDoNothing(), audit] as const;
    }));
    // The unique marker and the article/revision pairs commit together. A concurrent
    // importer loses on the marker and its entire batch rolls back.
    const result = await db.batch([
      db.insert(runs).values({ id: runId, kind: 'review-edition', status: 'ok',
        detail: 'Édition de vérification ' + edition.id, createdAt: now }),
      ...statements.flat(),
    ]);
    let imported = 0;
    for (let index = 1; index < result.length; index += 2) imported += result[index].meta.changes;
    return response({ ok: true, status: 'imported', imported });
  } catch {
    try { if (await hasImported()) return unchanged(); } catch { /* Storage is unavailable. */ }
    return unavailable();
  }
}
