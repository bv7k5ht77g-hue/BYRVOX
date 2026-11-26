CREATE TABLE `editor_sessions` (
  `digest` text PRIMARY KEY NOT NULL,
  `proof_hash` text NOT NULL,
  `user_id` text NOT NULL,
  `email` text NOT NULL,
  `expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `editor_sessions_expiry_idx` ON `editor_sessions` (`expires_at`);
