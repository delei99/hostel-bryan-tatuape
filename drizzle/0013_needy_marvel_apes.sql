ALTER TABLE `blockedDates` MODIFY COLUMN `startDate` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `blockedDates` MODIFY COLUMN `endDate` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `blockedDates` ADD `observation` text;