CREATE TABLE `adsense_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`enabled` integer NOT NULL,
	`client` text NOT NULL,
	`version` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `ad_placements` ADD `ad_client` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `ad_placements` ADD `ad_slot` text DEFAULT '' NOT NULL;