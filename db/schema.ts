import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const articles = sqliteTable('articles', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  summary: text('summary').notNull(),
  body: text('body').notNull(),
  sources: text('sources').notNull().default('[]'),
  status: text('status').notNull().default('draft'),
  risk: text('risk').notNull().default('standard'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  publishedAt: text('published_at'),
  authorId: text('author_id').notNull(),
  draft: text('draft'),
  version: integer('version').notNull().default(0),
}, (table) => [
  index('articles_publication_idx').on(table.status, table.publishedAt, table.slug),
]);
export const revisions = sqliteTable('revisions',{id:text('id').primaryKey(),articleId:text('article_id').notNull(), snapshot:text('snapshot').notNull(), actor:text('actor').notNull(), action:text('action').notNull(),createdAt:text('created_at').notNull()});
export const runs=sqliteTable('runs',{id:text('id').primaryKey(),kind:text('kind').notNull(),status:text('status').notNull(),detail:text('detail').notNull(),createdAt:text('created_at').notNull()});
export const events=sqliteTable('events',{id:text('id').primaryKey(),source:text('source').notNull(),url:text('url').notNull().unique(),title:text('title').notNull(),publishedAt:text('published_at'),createdAt:text('created_at').notNull()});
export const preferences=sqliteTable('preferences',{userId:text('user_id').primaryKey(),data:text('data').notNull(),updatedAt:text('updated_at').notNull()});
