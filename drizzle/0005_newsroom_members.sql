CREATE TABLE `newsroom_members` (
	`email` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`user_id` text,
	`invited_by` text NOT NULL,
	`created_at` text NOT NULL,
	`accepted_at` text
);
