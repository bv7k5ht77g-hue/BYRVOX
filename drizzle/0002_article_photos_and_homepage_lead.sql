CREATE TABLE `homepage_lead` (
	`slot` integer PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `published_photos` (
	`url` text NOT NULL,
	`article_id` text NOT NULL,
	PRIMARY KEY(`url`, `article_id`),
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `published_photos_article_idx` ON `published_photos` (`article_id`);--> statement-breakpoint
ALTER TABLE `articles` ADD `photo` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `gallery` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `photo_hidden` integer DEFAULT false NOT NULL;
--> statement-breakpoint
-- Only the live columns determine public access. Editing a draft never updates these links.
CREATE TRIGGER published_photos_on_insert AFTER INSERT ON articles
WHEN NEW.status = 'published'
BEGIN
  INSERT OR IGNORE INTO published_photos (url, article_id)
  SELECT json_extract(NEW.photo, '$.url'), NEW.id
  WHERE NEW.status = 'published' AND NEW.photo_hidden = 0 AND NEW.photo IS NOT NULL
  UNION ALL
  SELECT json_extract(value, '$.url'), NEW.id FROM json_each(NEW.gallery)
  WHERE NEW.status = 'published';
END;
--> statement-breakpoint
CREATE TRIGGER published_photos_on_update AFTER UPDATE OF status, photo, photo_hidden, gallery ON articles
WHEN OLD.status = 'published' OR NEW.status = 'published'
BEGIN
  DELETE FROM published_photos WHERE article_id = OLD.id;
  INSERT OR IGNORE INTO published_photos (url, article_id)
  SELECT json_extract(NEW.photo, '$.url'), NEW.id
  WHERE NEW.status = 'published' AND NEW.photo_hidden = 0 AND NEW.photo IS NOT NULL
  UNION ALL
  SELECT json_extract(value, '$.url'), NEW.id FROM json_each(NEW.gallery)
  WHERE NEW.status = 'published';
END;
