ALTER TABLE `bookings` ADD `dailyType` enum('couple','individual') DEFAULT 'couple' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `discountPercentage` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `bookings` ADD `discountAmount` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `bookings` ADD `cleaningFee` int DEFAULT 700;--> statement-breakpoint
ALTER TABLE `bookings` ADD `subtotal` int NOT NULL;