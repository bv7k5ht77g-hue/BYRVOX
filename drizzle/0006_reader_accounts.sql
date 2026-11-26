CREATE TABLE `reader_accounts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`last_seen_at` text NOT NULL,
	`last_ip` text,
	`last_location` text,
	`moderated_by` text,
	`moderated_at` text
);
--> statement-breakpoint
CREATE INDEX `reader_accounts_seen_idx` ON `reader_accounts` (`last_seen_at`,`user_id`);--> statement-breakpoint
CREATE TABLE `reader_activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`path` text,
	`occurred_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `reader_accounts`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reader_activity_user_idx` ON `reader_activity` (`user_id`,`id`);--> statement-breakpoint
CREATE INDEX `reader_activity_time_idx` ON `reader_activity` (`occurred_at`);--> statement-breakpoint
CREATE TABLE `reader_sessions` (
	`digest` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `reader_accounts`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reader_sessions_expiry_idx` ON `reader_sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `reader_sessions_user_idx` ON `reader_sessions` (`user_id`);
--> statement-breakpoint
CREATE TRIGGER reader_activity_limit AFTER INSERT ON reader_activity BEGIN
  DELETE FROM reader_activity WHERE user_id = NEW.user_id
    AND id <= (SELECT id FROM reader_activity WHERE user_id = NEW.user_id ORDER BY id DESC LIMIT 1 OFFSET 100);
END;
--> statement-breakpoint
CREATE TRIGGER reader_status_event AFTER UPDATE OF status ON reader_accounts
WHEN NEW.status <> OLD.status BEGIN
  INSERT INTO reader_activity(user_id, action, occurred_at)
  VALUES(NEW.user_id, NEW.status, NEW.moderated_at);
END;
