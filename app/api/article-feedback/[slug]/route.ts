import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../../../../db';
import { articleComments, articleRatings, articles } from '../../../../db/schema';
import { features } from '../../../../lib/content';
import { getActiveReader } from '../../../../lib/reader-auth';
import { sameOrigin } from '../../../../lib/access';
import { boundedJson } from '../../../../lib/input';

type Params = {params: Promise<{slug:string}>};
const payload = z.discriminatedUnion('kind', [
  z.object({kind:z.literal('rating'),score:z.number().int().min(1).max(5)}).strict(),
  z.object({kind:z.literal('comment'),body:z.string().trim().min(1).max(1500),requestId:z.string().uuid().optional()}).strict(),
]);
const reply = (body:unknown,status=200) => Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
const perPage = 15;

async function isPublished(slug:string) {
  if (!slug || slug.length > 240) return false;
  if (features.some(item=>item.slug===slug)) return true;
  return Boolean(await getDb().select({slug:articles.slug}).from(articles)
    .where(and(eq(articles.slug,slug),eq(articles.status,'published'))).get());
}

async function ratingsFor(slug:string,userId?:string) {
  const row = await getDb().select({
    average:sql<number|null>`avg(${articleRatings.score})`,
    count:sql<number>`count(*)`,
    mine:sql<number|null>`max(case when ${articleRatings.userId} = ${userId ?? null} then ${articleRatings.score} end)`,
  }).from(articleRatings).where(eq(articleRatings.slug,slug)).get();
  return row ?? {average:null,count:0,mine:null};
}

export async function GET(request:Request,{params}:Params) {
  const {slug}=await params;
  if (!await isPublished(slug)) return reply({error:'not_found'},404);
  const page=Number(new URL(request.url).searchParams.get('page') ?? 1);
  if (!Number.isSafeInteger(page)||page<1||page>100000) return reply({error:'page'},422);
  const reader=await getActiveReader(request);
  const [ratings,rows]=await Promise.all([
    ratingsFor(slug,reader?.userId),
    getDb().select({id:articleComments.id,body:articleComments.body,createdAt:articleComments.createdAt,authorName:articleComments.authorName})
      .from(articleComments).where(and(eq(articleComments.slug,slug),eq(articleComments.status,'approved')))
      .orderBy(desc(articleComments.createdAt),desc(articleComments.id)).limit(perPage+1).offset((page-1)*perPage),
  ]);
  return reply({ratings,comments:rows.slice(0,perPage),hasMore:rows.length>perPage,canParticipate:Boolean(reader)});
}

export async function POST(request:Request,{params}:Params) {
  if (!sameOrigin(request)) return reply({error:'origin'},403);
  const reader=await getActiveReader(request);
  if (!reader) return reply({error:'sign_in'},401);
  const {slug}=await params;
  if (!await isPublished(slug)) return reply({error:'not_found'},404);
  const input=payload.safeParse(await boundedJson(request,12000).catch(()=>null));
  if (!input.success) return reply({error:'invalid'},422);
  const db=getDb(), now=new Date().toISOString();
  if (input.data.kind==='rating') {
    const {score}=input.data;
    await db.insert(articleRatings).values({slug,userId:reader.userId,score,updatedAt:now})
      .onConflictDoUpdate({target:[articleRatings.slug,articleRatings.userId],set:{score,updatedAt:now}});
    return reply({ratings:await ratingsFor(slug,reader.userId)});
  }
  const {body,requestId}=input.data;
  const id=requestId ?? crypto.randomUUID();
  const author=reader.firstName?.trim() || '';
  const threshold=new Date(Date.now()-30000).toISOString();
  const saved=await db.run(sql`INSERT INTO article_comments (id,slug,user_id,author_name,body,status,created_at)
    SELECT ${id},${slug},${reader.userId},${author},${body},'pending',${now}
    WHERE NOT EXISTS (SELECT 1 FROM article_comments WHERE user_id=${reader.userId} AND created_at >= ${threshold})
    ON CONFLICT(id) DO NOTHING`);
  if (saved.meta.changes) return reply({status:'pending'},201);
  if (requestId) {
    const previous = await db.select({body:articleComments.body,status:articleComments.status}).from(articleComments)
      .where(and(eq(articleComments.id,id),eq(articleComments.slug,slug),eq(articleComments.userId,reader.userId))).get();
    if (previous?.body === body) return reply({status:previous.status});
  }
  return reply({error:'rate_limit'},429);
}
