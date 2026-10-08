CREATE TABLE `import_mappings` (
	`id` text PRIMARY KEY NOT NULL,
	`salon_id` text NOT NULL,
	`format` text NOT NULL,
	`staff_map` text DEFAULT '{}' NOT NULL,
	`column_map` text,
	`tips_are` text DEFAULT 'by_method' NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`salon_id`) REFERENCES `salons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `import_mappings_salon_format_idx` ON `import_mappings` (`salon_id`,`format`);--> statement-breakpoint
ALTER TABLE `pay_lines` ADD `statement_sent_at` text;--> statement-breakpoint
ALTER TABLE `pay_lines` ADD `statement_sent_via` text;--> statement-breakpoint
ALTER TABLE `salons` ADD `kiosk_sounds` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `salons` ADD `kiosk_dim_after_close` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `salons` ADD `closing_time` text DEFAULT '19:30' NOT NULL;--> statement-breakpoint
ALTER TABLE `salons` ADD `setup_dismissed_at` text;