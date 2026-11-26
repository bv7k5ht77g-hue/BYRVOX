import type { ArticlePhoto } from '../lib/article-photo';
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
  photo: text('photo', { mode: 'json' }).$type<ArticlePhoto>(),
  gallery: text('gallery', { mode: 'json' }).$type<ArticlePhoto[]>().notNull().default([]),
  photoHidden: integer('photo_hidden', { mode: 'boolean' }).notNull().default(false),
  draft: text('draft'),
  version: integer('version').notNull().default(0),
}, (table) => [
  index('articles_publication_idx').on(table.status, table.publishedAt, table.slug),
]);
// Maintained by the publication triggers in migration 0002.
export const publishedPhotos = sqliteTable('published_photos', {
  url: text('url').notNull(),
  articleId: text('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.url, table.articleId] }),
  index('published_photos_article_idx').on(table.articleId),
]);

export const homepageLead = sqliteTable('homepage_lead', {
  slot: integer('slot').primaryKey(),
  articleId: text('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
});

export const revisions = sqliteTable('revisions',{id:text('id').primaryKey(),articleId:text('article_id').notNull(), snapshot:text('snapshot').notNull(), actor:text('actor').notNull(), action:text('action').notNull(),createdAt:text('created_at').notNull()});
export const runs=sqliteTable('runs',{id:text('id').primaryKey(),kind:text('kind').notNull(),status:text('status').notNull(),detail:text('detail').notNull(),createdAt:text('created_at').notNull()});
export const events=sqliteTable('events',{id:text('id').primaryKey(),source:text('source').notNull(),url:text('url').notNull().unique(),title:text('title').notNull(),publishedAt:text('published_at'),createdAt:text('created_at').notNull()});
export const preferences=sqliteTable('preferences',{userId:text('user_id').primaryKey(),data:text('data').notNull(),updatedAt:text('updated_at').notNull()});

export const editorSessions = sqliteTable('editor_sessions', {
  digest: text('digest').primaryKey(),
  proofHash: text('proof_hash').notNull(),
  userId: text('user_id').notNull(),
  email: text('email').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, table => [index('editor_sessions_expiry_idx').on(table.expiresAt)]);

export const articleTranslations = sqliteTable('article_translations', {
  slug: text('slug').notNull(), locale: text('locale').notNull(),
  sourceTitle: text('source_title').notNull(), sourceSummary: text('source_summary').notNull(),
  sourceHash: text('source_hash').notNull(), title: text('title').notNull(),
  photo: text('photo', {mode:'json'}).$type<{sourceUrl:string;sourceAlt:string;sourceCaption:string;alt:string;caption:string}>(),
  summary: text('summary').notNull(), body: text('body').notNull(),
}, table => [primaryKey({columns:[table.slug,table.locale]})]);

export const newsroomMembers = sqliteTable('newsroom_members', {
  email: text('email').primaryKey(),
  role: text('role', {enum:['contributor','approver']}).notNull(),
  userId: text('user_id'),
  invitedBy: text('invited_by').notNull(),
  createdAt: text('created_at').notNull(),
  acceptedAt: text('accepted_at'),
});
