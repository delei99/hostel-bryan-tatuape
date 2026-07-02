ALTER TABLE `bookings` ADD `isExtension` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `parentBookingId` int;--> statement-breakpoint
ALTER TABLE `bookings` ADD `extensionCleaningFee` int DEFAULT 0;