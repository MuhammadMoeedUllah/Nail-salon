CREATE TABLE `breaks` (
	`id` text PRIMARY KEY NOT NULL,
	`punch_id` text NOT NULL,
	`ts_start` text NOT NULL,
	`ts_end` text,
	`paid` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`punch_id`) REFERENCES `punches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `breaks_punch_idx` ON `breaks` (`punch_id`);--> statement-breakpoint
CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`salon_id` text NOT NULL,
	`name` text NOT NULL,
	`token_hash` text NOT NULL,
	`paired_by_user_id` text,
	`last_seen_at` text,
	`revoked_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`salon_id`) REFERENCES `salons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`paired_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `edits` (
	`id` text PRIMARY KEY NOT NULL,
	`salon_id` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`field` text,
	`old_value` text,
	`new_value` text,
	`reason` text,
	`actor_type` text NOT NULL,
	`actor_id` text,
	`actor_name` text,
	`ts` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `edits_salon_ts_idx` ON `edits` (`salon_id`,`ts`);--> statement-breakpoint
CREATE INDEX `edits_entity_idx` ON `edits` (`entity`,`entity_id`);--> statement-breakpoint
CREATE TABLE `import_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`salon_id` text NOT NULL,
	`format` text NOT NULL,
	`file_name` text,
	`row_count` integer DEFAULT 0 NOT NULL,
	`imported_count` integer DEFAULT 0 NOT NULL,
	`skipped_count` integer DEFAULT 0 NOT NULL,
	`unmatched` text,
	`created_by_user_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`salon_id`) REFERENCES `salons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pay_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`pay_run_id` text NOT NULL,
	`worker_id` text NOT NULL,
	`pay_basis` text NOT NULL,
	`hours_minutes` integer NOT NULL,
	`days_worked` integer DEFAULT 0 NOT NULL,
	`sales_cents` integer DEFAULT 0 NOT NULL,
	`base_cents` integer DEFAULT 0 NOT NULL,
	`commission_cents` integer DEFAULT 0 NOT NULL,
	`regular_rate_cents` integer DEFAULT 0 NOT NULL,
	`overtime_minutes` integer DEFAULT 0 NOT NULL,
	`overtime_premium_cents` integer DEFAULT 0 NOT NULL,
	`min_wage_topup_cents` integer DEFAULT 0 NOT NULL,
	`tips_card_cents` integer DEFAULT 0 NOT NULL,
	`tips_cash_cents` integer DEFAULT 0 NOT NULL,
	`deductions_cents` integer DEFAULT 0 NOT NULL,
	`gross_wages_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`paid_cash_cents` integer DEFAULT 0 NOT NULL,
	`paid_check_cents` integer DEFAULT 0 NOT NULL,
	`paid_payroll_cents` integer DEFAULT 0 NOT NULL,
	`paid_on` text,
	`version` integer DEFAULT 1 NOT NULL,
	`share_token` text,
	`flags` text,
	`breakdown` text,
	FOREIGN KEY (`pay_run_id`) REFERENCES `pay_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`worker_id`) REFERENCES `workers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pay_lines_run_worker_idx` ON `pay_lines` (`pay_run_id`,`worker_id`);--> statement-breakpoint
CREATE TABLE `pay_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`salon_id` text NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`approved_at` text,
	`approved_by_user_id` text,
	`paid_on` text,
	`rules_snapshot` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`salon_id`) REFERENCES `salons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pay_runs_period_idx` ON `pay_runs` (`salon_id`,`period_start`);--> statement-breakpoint
CREATE TABLE `punches` (
	`id` text PRIMARY KEY NOT NULL,
	`salon_id` text NOT NULL,
	`worker_id` text NOT NULL,
	`work_date` text NOT NULL,
	`ts_in` text NOT NULL,
	`ts_out` text,
	`photo_in_ref` text,
	`photo_out_ref` text,
	`manual_break_minutes` integer DEFAULT 0 NOT NULL,
	`source` text DEFAULT 'tablet' NOT NULL,
	`device_id` text,
	`note` text,
	`voided_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`salon_id`) REFERENCES `salons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`worker_id`) REFERENCES `workers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `punches_salon_date_idx` ON `punches` (`salon_id`,`work_date`);--> statement-breakpoint
CREATE INDEX `punches_worker_idx` ON `punches` (`worker_id`);--> statement-breakpoint
CREATE TABLE `salons` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`state` text DEFAULT 'NY' NOT NULL,
	`region` text,
	`license_no` text,
	`address` text,
	`timezone` text DEFAULT 'America/New_York' NOT NULL,
	`workweek_start` integer DEFAULT 1 NOT NULL,
	`pay_frequency` text DEFAULT 'weekly' NOT NULL,
	`default_locale` text DEFAULT 'en' NOT NULL,
	`tip_credit_enabled` integer DEFAULT false NOT NULL,
	`photo_on_punch` integer DEFAULT true NOT NULL,
	`kiosk_auto_clock_in` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`salon_id` text NOT NULL,
	`name_en` text NOT NULL,
	`name_vi` text,
	`default_price_cents` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`salon_id`) REFERENCES `salons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `services_salon_idx` ON `services` (`salon_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`salon_id` text NOT NULL,
	`worker_id` text NOT NULL,
	`work_date` text NOT NULL,
	`ts` text NOT NULL,
	`ticket_no` text,
	`service_name` text NOT NULL,
	`price_cents` integer NOT NULL,
	`tip_card_cents` integer DEFAULT 0 NOT NULL,
	`tip_cash_cents` integer DEFAULT 0 NOT NULL,
	`payment_method` text,
	`source` text DEFAULT 'manual' NOT NULL,
	`import_batch_id` text,
	`external_id` text,
	`voided_at` text,
	`void_reason` text,
	`created_by_user_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`salon_id`) REFERENCES `salons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`worker_id`) REFERENCES `workers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tickets_salon_date_idx` ON `tickets` (`salon_id`,`work_date`);--> statement-breakpoint
CREATE INDEX `tickets_worker_idx` ON `tickets` (`worker_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_external_idx` ON `tickets` (`salon_id`,`source`,`external_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`salon_id` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'owner' NOT NULL,
	`password_hash` text NOT NULL,
	`locale` text DEFAULT 'en' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`salon_id`) REFERENCES `salons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `workers` (
	`id` text PRIMARY KEY NOT NULL,
	`salon_id` text NOT NULL,
	`display_name` text NOT NULL,
	`legal_name` text NOT NULL,
	`address` text,
	`birth_date` text,
	`occupation` text DEFAULT 'Nail technician' NOT NULL,
	`classification` text DEFAULT 'w2' NOT NULL,
	`sex` text,
	`locale` text DEFAULT 'vi' NOT NULL,
	`pin_hash` text NOT NULL,
	`pin_failed_count` integer DEFAULT 0 NOT NULL,
	`pin_locked_until` text,
	`pay_basis` text DEFAULT 'day_rate_plus_commission' NOT NULL,
	`hourly_rate_cents` integer DEFAULT 0 NOT NULL,
	`day_rate_cents` integer DEFAULT 0 NOT NULL,
	`commission_pct` integer DEFAULT 0 NOT NULL,
	`guarantee_cents` integer DEFAULT 0 NOT NULL,
	`hired_on` text,
	`ended_on` text,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`salon_id`) REFERENCES `salons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `workers_salon_idx` ON `workers` (`salon_id`);