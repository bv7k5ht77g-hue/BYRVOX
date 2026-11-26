CREATE TABLE `article_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`user_id` text NOT NULL,
	`author_name` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`moderated_by` text,
	`moderated_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `reader_accounts`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `article_comments_public_idx` ON `article_comments` (`slug`,`status`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `article_comments_queue_idx` ON `article_comments` (`status`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `article_comments_user_idx` ON `article_comments` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `article_ratings` (
	`slug` text NOT NULL,
	`user_id` text NOT NULL,
	`score` integer NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`slug`, `user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `reader_accounts`(`user_id`) ON UPDATE no action ON DELETE cascade
);
