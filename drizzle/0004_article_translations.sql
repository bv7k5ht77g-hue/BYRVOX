CREATE TABLE IF NOT EXISTS article_translations (
 slug TEXT NOT NULL,
 locale TEXT NOT NULL,
 source_title TEXT NOT NULL,
 source_summary TEXT NOT NULL,
 source_hash TEXT NOT NULL,
 title TEXT NOT NULL,
 summary TEXT NOT NULL,
 body TEXT NOT NULL,
 photo TEXT,
 PRIMARY KEY (slug, locale)
);
