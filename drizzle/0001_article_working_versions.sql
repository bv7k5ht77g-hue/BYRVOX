ALTER TABLE `articles` ADD `draft` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `version` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `articles_publication_idx` ON `articles` (`status`,`published_at`,`slug`);