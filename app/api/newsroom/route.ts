import { env } from 'cloudflare:workers';
import { and, asc, desc, eq, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../../../db';
import { articles, events, revisions, runs } from '../../../db/schema';
import { belongsToContributorArticle } from '../../../lib/private-photo';
import { newsroomUser, runtime, sameOrigin } from '../../../lib/access';
import { photoPublicationError, uploadedPhotoName } from '../../../lib/article-photo';
import { publicationError, slugify, validSourceUrl } from '../../../lib/editorial.mjs';
import { blueskyPhotoFields, captionsHavePost } from '../../../lib/bluesky-photo.mjs';
import { reviewArticleAds, type ArticleAdReview } from '../../../lib/article-ad-policy';
import { boundedJson } from '../../../lib/input';
import { manualTranslationWrites } from '../../../lib/public-translations';
import { translationSubmission, translationsMatch, translationImportLimit } from '../../../lib/translation-import';

type Article = typeof articles.$inferSelect;
type Content = Pick<Article, 'title' | 'category' | 'summary' | 'body' | 'sources' | 'risk' | 'status' | 'authorId' | 'updatedAt' | 'photo' | 'photoHidden' | 'gallery'>;

const photoSchema = z.object({
  url: z.string().max(100).refine(value => uploadedPhotoName(value) !== null),
  alt: z.string().trim().max(300).default(''),
  credit: z.string().trim().max(300).default(''),
  license: z.string().trim().max(100).optional(),
  licenseUrl: z.string().trim().max(1800).refine(validSourceUrl).optional(),
  ...blueskyPhotoFields,
  caption: z.string().trim().max(1000).default(''),
  sourceUrl: z.string().trim().max(2000).refine(value => !value || validSourceUrl(value)).optional(),
}).refine(captionsHavePost);

const requestSchema = z.object({
  id: z.string().max(100).optional(),
  version: z.number().int().nonnegative().optional(),
  revisionId: z.string().max(100).optional(),
  action: z.enum(['save', 'review', 'publish', 'restore', 'return', 'ad-policy']).default('save'),
  adReview: z.unknown().optional(),
  translations: translationSubmission.optional(),
  title: z.string().max(250).optional(),
  category: z.string().max(100).optional(),
  summary: z.string().max(3000).optional(),
  body: z.string().max(60000).optional(),
  photo: photoSchema.nullable().optional(),
  gallery: z.array(photoSchema).max(4).optional(),
  photoHidden: z.boolean().optional(),
  risk: z.enum(['standard', 'sensitive']).optional(),
  sources: z.array(z.object({ name: z.string().max(200), url: z.string().max(2000) })).max(20).optional(),
});

function editorArticle({ draft, ...row }: Article) {
  const workingCopy: Partial<Content> = draft ? JSON.parse(draft) : {};
  return { ...row, ...workingCopy, authorId:row.authorId, adReview:row.adReview, isLive: row.status === 'published' };
}

function contentOf(source: Content): Content {
  const { title, category, summary, body, sources, risk, status, authorId, updatedAt } = source;
  // Snapshots created before photos were introduced have neither field.
  return { title, category, summary, body, sources, risk, status, authorId, updatedAt,
    photo: source.photo ?? null, gallery: source.gallery ?? [], photoHidden: source.photoHidden ?? false };
}

function problem(error: string, status: number) {
  return Response.json({ error }, { status });
}

function conflict() {
  return problem('Une autre version a été enregistrée. Rouvre l’article pour consulter les changements.', 409);
}

async function persistRevision(stored: Article, changes: Partial<Article>,
  revision: {id:string; actor:string; action:string; createdAt:string}, snapshot: unknown,
  translations: Awaited<ReturnType<typeof manualTranslationWrites>> = []) {
  const db = getDb();
  const version = stored.version + 1;
  const sameVersion = and(eq(articles.id, stored.id), eq(articles.version, stored.version));
  // D1 executes the batch atomically. Both writes use the same version predicate so a lost race leaves no audit entry.
  const results = await db.batch([
    db.insert(revisions).select(db.select({
      id: sql<string>`${revision.id}`.as('id'),
      articleId: articles.id,
      snapshot: sql<string>`${JSON.stringify(snapshot)}`.as('snapshot'),
      actor: sql<string>`${revision.actor}`.as('actor'),
      action: sql<string>`${revision.action}`.as('action'),
      createdAt: sql<string>`${revision.createdAt}`.as('created_at'),
    }).from(articles).where(sameVersion)),
    ...translations,
    db.update(articles).set({ ...changes, version }).where(sameVersion).returning({ id: articles.id }),
  ]);
  if (!(results.at(-1) as {id:string}[]).length) return conflict();
  return Response.json(editorArticle({ ...stored, ...changes, version }));
}

export async function GET(request: Request) {
  const user = await newsroomUser();
  if (!user) return problem('Accès réservé à la rédaction.', 403);
  const db = getDb();
  const lastEdit = sql`coalesce(json_extract(${articles.draft}, '$.updatedAt'), ${articles.updatedAt})`;
  const access = {role:user.role,email:user.email,userId:user.userId};
  const headers = {'Cache-Control':'private, no-store'};
  const identifier = new URL(request.url).searchParams.get('article');
  if (identifier !== null) {
    if (!/^[a-z0-9-]{1,130}$/.test(identifier)) return problem('Identifiant d’article invalide.', 422);
    const row = await db.select().from(articles).where(and(
      or(eq(articles.slug, identifier), eq(articles.id, identifier)),
      user.role === 'contributor' ? eq(articles.authorId, user.userId) : undefined,
    )).limit(1).get();
    return row ? Response.json({article:editorArticle(row)}, {headers}) : problem('Article introuvable.', 404);
  }
  if (user.role === 'contributor') {
    const rows = await db.select().from(articles).where(eq(articles.authorId,user.userId)).orderBy(desc(lastEdit)).limit(100);
    return Response.json({...access,articles:rows.map(editorArticle),runs:[],events:[],revisions:[],generationConfigured:false},{headers});
  }
  const [rows, recentRuns, recentEvents, history, queue] = await db.batch([
    db.select().from(articles).orderBy(desc(lastEdit)).limit(100),
    db.select().from(runs).orderBy(desc(runs.createdAt)).limit(30),
    db.select().from(events).orderBy(desc(events.createdAt)).limit(50),
    db.select().from(revisions).orderBy(desc(revisions.createdAt)).limit(50),
    db.select().from(articles).where(sql`coalesce(json_extract(${articles.draft}, '$.status'), ${articles.status}) = 'review'`)
      .orderBy(asc(lastEdit),asc(articles.id)).limit(50),
  ]);
  return Response.json({ ...access, articles: rows.map(editorArticle), reviewQueue:queue.map(editorArticle), runs: recentRuns, events: recentEvents, revisions: history,
    generationConfigured: user.role === 'owner' && Boolean(runtime('OPENAI_API_KEY')) },{headers});
}

export async function POST(req: Request) {
  const user = await newsroomUser();
  if (!user) return problem('Accès interdit.', 403);
  if (!sameOrigin(req)) return problem('Origine refusée.', 403);
  if (Number(req.headers.get('content-length')) > translationImportLimit) return problem('Document trop volumineux.', 413);
  let input: z.infer<typeof requestSchema>;
  try {
    input = requestSchema.parse(await boundedJson(req,translationImportLimit));
  } catch {
    return problem('Document JSON invalide.', 400);
  }

  if (input.translations && input.action !== 'publish') return problem('Joins les traductions au moment de publier.', 422);
  if (user.role === 'contributor' && input.action !== 'save' && input.action !== 'review') {
    return problem('Cette action nécessite un approbateur.',403);
  }
  const db = getDb();
  const stored = input.id ? await db.select().from(articles).where(eq(articles.id, input.id)).get() : undefined;
  if ((input.id || ['publish','restore','return','ad-policy'].includes(input.action)) && !stored) {
    return problem('Article introuvable.', 404);
  }
  const previous = stored && editorArticle(stored);
  if (user.role === 'contributor' && stored) {
    if (stored.authorId !== user.userId) return problem('Article inaccessible.',403);
    if (previous?.status !== 'draft') return problem('Ce texte est verrouillé pendant la vérification ou après publication.',403);
  }
  if (stored && input.version !== undefined && input.version !== stored.version) return conflict();
  const now = new Date().toISOString();
  const id = stored?.id || crypto.randomUUID();
  const revision = { id: crypto.randomUUID(), articleId: id, actor: user.userId, action: input.action, createdAt: now };
  let adReview: ArticleAdReview | null = null;
  if (input.action === 'ad-policy' || input.action === 'publish') {
    if (input.version === undefined) return problem('Rouvre la version de l’article à vérifier.', 422);
    adReview = reviewArticleAds(input.adReview, user.userId, now);
    if (!adReview) return problem('Complète la vérification publicitaire ou choisis de publier sans annonces en précisant le motif.', 422);
    if (stored && input.action === 'ad-policy') {
      if (stored.status !== 'published') return problem('Ce réglage concerne uniquement les articles en ligne.', 422);
      // Keep every pending editorial change separate from the policy applied to the live page.
      return persistRevision(stored, {adReview}, revision, { ...contentOf(stored), adReview:stored.adReview, appliedAdReview:adReview });
    }
  }
  let next: Content;
  if (input.action === 'return' && previous) {
    if (previous.status !== 'review') return problem('Seule une soumission en vérification peut être retournée.',422);
    next = {...contentOf(previous),status:'draft',updatedAt:now};
  } else if (input.action === 'publish' && previous) {
    const liveEdition = stored?.status === 'published' ? stored : undefined;
    const error = publicationError(previous) || photoPublicationError(previous, liveEdition);
    if (error) return problem(error, 422);
    next = { ...contentOf(previous), status: 'published', updatedAt: now };
  } else if (input.action === 'restore' && stored) {
    const revision = input.revisionId && await db.select().from(revisions)
      .where(and(eq(revisions.id, input.revisionId), eq(revisions.articleId, stored.id))).get();
    if (!revision) return problem('Révision introuvable.', 404);
    next = { ...contentOf(JSON.parse(revision.snapshot)), status: 'draft', updatedAt: now, authorId: stored.authorId };
  } else {
    if (!input.title?.trim()) return problem('Un titre est requis.', 422);
    const photo = input.photo !== undefined ? input.photo : previous?.photo ?? null;
    const photoHidden = input.photoHidden ?? (input.photo === undefined ? previous?.photoHidden ?? false : input.photo === null);
    next = {
      photo: photoHidden ? null : photo, photoHidden, gallery: input.gallery ?? previous?.gallery ?? [],
      title: input.title.trim(), category: input.category || 'International', summary: input.summary || '',
      body: input.body || '', sources: JSON.stringify(input.sources || []), risk: input.risk || 'standard',
      status: input.action === 'review' ? 'review' : 'draft', authorId: stored?.authorId ?? user.userId, updatedAt: now,
    };
  }

  const images = next.photo ? [next.photo, ...next.gallery] : next.gallery;
  const previousUrls = new Set([previous?.photo?.url, ...previous?.gallery.map(photo => photo.url) ?? []]);
  const checkUrls = [...new Set(images.map(photo => photo.url))].filter(url => input.action === 'publish' || !previousUrls.has(url));
  if (checkUrls.length) {
    const bucket = env.BUCKET;
    if (!bucket) return problem('Le stockage des photos est indisponible.', 503);
    const objects = await Promise.all(checkUrls.map(url => {
      const name = uploadedPhotoName(url);
      return name ? bucket.head('photos/' + name) : null;
    }));
    if (objects.some(object => !object)) return problem('Photo téléversée introuvable.', 422);
    if (user.role === 'contributor') {
      for (const [index,object] of objects.entries()) {
        if (object?.customMetadata?.userId !== user.userId && !await belongsToContributorArticle(user.userId,checkUrls[index])) {
          return problem('Cette photographie ne fait pas partie de tes téléversements ou de tes articles.',403);
        }
      }
    }
  }

  if (!stored) {
    const row = { ...next, id, slug: (slugify(next.title) || 'article') + '-' + id.slice(0, 8),
      publishedAt: null, createdAt: now, draft: null, version: 0, adReview:null };
    await db.batch([
      db.insert(articles).values(row),
      db.insert(revisions).values({ ...revision, snapshot: JSON.stringify(editorArticle(row)) }),
    ]);
    return Response.json(editorArticle(row));
  }

  const changes = stored.status === 'published' && next.status !== 'published'
    ? { draft: JSON.stringify(next) }
    : { ...next, ...(adReview ? {adReview} : {}), draft: null, publishedAt: next.status === 'published' ? stored.publishedAt || now : null };
  if (input.translations && !translationsMatch(input.translations, next)) {
    return problem('Les traductions ne correspondent plus au texte ou à la photo de cette version.',422);
  }
  const translations = input.translations
    ? await manualTranslationWrites({...next,slug:stored.slug},input.translations.translations,stored.id,stored.version)
    : [];
  return persistRevision(stored, changes, revision, adReview ? {...previous, appliedAdReview:adReview} : previous, translations);
}
