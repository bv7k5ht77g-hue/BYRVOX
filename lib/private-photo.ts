import {and,eq,sql} from 'drizzle-orm';
import {getDb} from '../db';
import {articles} from '../db/schema';

// A reviewer can add an image while returning a submission for corrections.
export async function belongsToContributorArticle(userId:string, url:string) {
  const row = await getDb().select({id:articles.id}).from(articles).where(and(eq(articles.authorId,userId),sql`(
    json_extract(${articles.photo}, '$.url') = ${url} OR
    json_extract(${articles.draft}, '$.photo.url') = ${url} OR
    exists (select 1 from json_each(${articles.gallery}) where json_extract(value, '$.url') = ${url}) OR
    exists (select 1 from json_each(${articles.draft}, '$.gallery') where json_extract(value, '$.url') = ${url})
  )`)).limit(1).get();
  return Boolean(row);
}
