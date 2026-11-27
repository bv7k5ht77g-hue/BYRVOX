CREATE TABLE `article_guest_ratings` (
	`slug` text NOT NULL,
	`guest_digest` text NOT NULL,
	`score` integer NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`slug`, `guest_digest`)
);
