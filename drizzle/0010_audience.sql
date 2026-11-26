CREATE TABLE `audience_daily` (
	`day` text NOT NULL,
	`slug` text NOT NULL,
	`kind` text NOT NULL,
	`total` integer NOT NULL,
	PRIMARY KEY(`day`, `slug`, `kind`)
);
