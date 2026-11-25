import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../../../db';
import { articles, events, revisions, runs } from '../../../db/schema';
import { admin, runtime, sameOrigin } from '../../../lib/access';
import { publicationError, slugify } from '../../../lib/editorial.mjs';
import { boundedJson } from '../../../lib/input';

type Article = typeof articles.$inferSelect;
type Content = Pick<Article, 'title' | 'category' | 'summary' | 'body' | 'sources' | 'risk' | 'status' | 'authorId' | 'updatedAt'>;

const requestSchema = z.object({
  id: z.string().max(100).optional(),
  version: z.number().int().nonnegative().optional(),
  revisionId: z.string().max(100).optional(),
  action: z.enum(['save', 'review', 'publish', 'restore']).default('save'),
  title: z.string().max(250).optional(),
  category: z.string().max(100).optional(),
  summary: z.string().max(3000).optional(),
  body: z.string().max(60000).optional(),
  risk: z.enum(['standard', 'sensitive']).optional(),
  sources: z.array(z.object({ name: z.string().max(200), url: z.string().max(2000) })).max(20).optional(),
});

function editorArticle({ draft, ...row }: Article) {
  const workingCopy: Partial<Content> = draft ? JSON.parse(draft) : {};
  return { ...row, ...workingCopy, isLive: row.status === 'published' };
}

function contentOf(source: Content): Content {
  const { title, category, summary, body, sources, risk, status, authorId, updatedAt } = source;
  return { title, category, summary, body, sources, risk, status, authorId, updatedAt };
}

function problem(error: string, status: number) {
  return Response.json({ error }, { status });
}

function conflict() {
  return problem('Une autre version a été enregistrée. Rouvre l’article pour consulter les changements.', 409);
}

export async function GET() {
  if (!await admin()) return problem('Accès réservé à la rédaction.', 403);
  const db = getDb();
  const lastEdit = sql`coalesce(json_extract(${articles.draft}, '$.updatedAt'), ${articles.updatedAt})`;
  const [rows, recentRuns, recentEvents, history] = await db.batch([
    db.select().from(articles).orderBy(desc(lastEdit)).limit(100),
    db.select().from(runs).orderBy(desc(runs.createdAt)).limit(30),
    db.select().from(events).orderBy(desc(events.createdAt)).limit(50),
    db.select().from(revisions).orderBy(desc(revisions.createdAt)).limit(50),
  ]);
  return Response.json({ articles: rows.map(editorArticle), runs: recentRuns, events: recentEvents, revisions: history,
    generationConfigured: Boolean(runtime('OPENAI_API_KEY')) },
    { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const user = await admin();
  if (!user) return problem('Accès interdit.', 403);
  if (!sameOrigin(req)) return problem('Origine refusée.', 403);
  if (Number(req.headers.get('content-length')) > 100000) return problem('Document trop volumineux.', 413);
  let input: z.infer<typeof requestSchema>;
  try {
    input = requestSchema.parse(await boundedJson(req));
  } catch {
    return problem('Document JSON invalide.', 400);
  }

  const db = getDb();
  const stored = input.id ? await db.select().from(articles).where(eq(articles.id, input.id)).get() : undefined;
  if ((input.id || input.action === 'publish' || input.action === 'restore') && !stored) {
    return problem('Article introuvable.', 404);
  }
  if (stored && input.version !== undefined && input.version !== stored.version) return conflict();

  const previous = stored && editorArticle(stored);
  const now = new Date().toISOString();
  let next: Content;
  if (input.action === 'publish' && previous) {
    const error = publicationError(previous);
    if (error) return problem(error, 422);
    next = { ...contentOf(previous), status: 'published', updatedAt: now };
  } else if (input.action === 'restore' && stored) {
    const revision = input.revisionId && await db.select().from(revisions)
      .where(and(eq(revisions.id, input.revisionId), eq(revisions.articleId, stored.id))).get();
    if (!revision) return problem('Révision introuvable.', 404);
    next = { ...contentOf(JSON.parse(revision.snapshot)), status: 'draft', updatedAt: now, authorId: user.userId };
  } else {
    if (!input.title?.trim()) return problem('Un titre est requis.', 422);
    next = {
      title: input.title.trim(), category: input.category || 'International', summary: input.summary || '',
      body: input.body || '', sources: JSON.stringify(input.sources || []), risk: input.risk || 'standard',
      status: input.action === 'review' ? 'review' : 'draft', authorId: user.userId, updatedAt: now,
    };
  }

  const id = stored?.id || crypto.randomUUID();
  const revision = { id: crypto.randomUUID(), articleId: id, actor: user.userId, action: input.action, createdAt: now };
  if (!stored) {
    const row = { ...next, id, slug: (slugify(next.title) || 'article') + '-' + id.slice(0, 8),
      publishedAt: null, createdAt: now, draft: null, version: 0 };
    await db.batch([
      db.insert(articles).values(row),
      db.insert(revisions).values({ ...revision, snapshot: JSON.stringify(editorArticle(row)) }),
    ]);
    return Response.json(editorArticle(row));
  }

  const changes = stored.status === 'published' && next.status !== 'published'
    ? { draft: JSON.stringify(next) }
    : { ...next, draft: null, publishedAt: next.status === 'published' ? stored.publishedAt || now : null };
  const version = stored.version + 1;
  const sameVersion = and(eq(articles.id, id), eq(articles.version, stored.version));
  // D1 executes the batch atomically. Both writes use the same version predicate so a lost race leaves no audit entry.
  const [, updated] = await db.batch([
    db.insert(revisions).select(db.select({
      id: sql<string>`${revision.id}`.as('id'),
      articleId: articles.id,
      snapshot: sql<string>`${JSON.stringify(previous)}`.as('snapshot'),
      actor: sql<string>`${revision.actor}`.as('actor'),
      action: sql<string>`${revision.action}`.as('action'),
      createdAt: sql<string>`${now}`.as('created_at'),
    }).from(articles).where(sameVersion)),
    db.update(articles).set({ ...changes, version }).where(sameVersion).returning({ id: articles.id }),
  ]);
  if (!updated.length) return conflict();
  return Response.json(editorArticle({ ...stored, ...changes, version }));
}
