ALTER TABLE `bookings` ADD `documentType` enum('rg','passport') NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `documentNumber` varchar(20) NOT NULL;