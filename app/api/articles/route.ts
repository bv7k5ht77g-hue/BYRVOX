import {getDb} from '../../../db';import {articles} from '../../../db/schema';import {eq,desc} from 'drizzle-orm';
export async function GET(){return Response.json(await getDb().select().from(articles).where(eq(articles.status,'published')).orderBy(desc(articles.publishedAt)).limit(50),{headers:{'Cache-Control':'public, max-age=30'}})}
