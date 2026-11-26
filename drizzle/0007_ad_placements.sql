CREATE TABLE `ad_placements` (
	`placement` text PRIMARY KEY NOT NULL,
	`mode` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`image` text NOT NULL,
	`alt` text NOT NULL,
	`version` integer NOT NULL
);
