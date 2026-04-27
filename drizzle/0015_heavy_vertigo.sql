ALTER TABLE `bookings` ADD `editedAt` timestamp;--> statement-breakpoint
ALTER TABLE `bookings` ADD `editedBy` varchar(100);--> statement-breakpoint
ALTER TABLE `blockedDates` DROP COLUMN `observation`;--> statement-breakpoint
ALTER TABLE `blockedDates` DROP COLUMN `observationUpdatedAt`;