CREATE TABLE `beds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`bedNumber` int NOT NULL,
	`type` enum('single','double','bunk') NOT NULL,
	`status` enum('available','occupied','maintenance') NOT NULL DEFAULT 'available',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `beds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guestId` int NOT NULL,
	`roomId` int NOT NULL,
	`bedId` int,
	`checkInDate` timestamp NOT NULL,
	`checkOutDate` timestamp NOT NULL,
	`numberOfGuests` int NOT NULL,
	`totalPrice` int NOT NULL,
	`status` enum('pending','confirmed','checked_in','checked_out','cancelled') NOT NULL DEFAULT 'pending',
	`specialRequests` text,
	`paymentMethod` varchar(50),
	`paymentStatus` enum('pending','paid','refunded') NOT NULL DEFAULT 'pending',
	`confirmationCode` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `bookings_confirmationCode_unique` UNIQUE(`confirmationCode`)
);
--> statement-breakpoint
CREATE TABLE `guests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`cpf` varchar(14),
	`nationality` varchar(100),
	`dateOfBirth` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('private','shared','dorm') NOT NULL,
	`capacity` int NOT NULL,
	`pricePerNight` int NOT NULL,
	`description` text,
	`amenities` text,
	`imageUrl` text,
	`status` enum('available','maintenance','archived') NOT NULL DEFAULT 'available',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `beds` ADD CONSTRAINT `beds_roomId_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_guestId_guests_id_fk` FOREIGN KEY (`guestId`) REFERENCES `guests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_roomId_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_bedId_beds_id_fk` FOREIGN KEY (`bedId`) REFERENCES `beds`(`id`) ON DELETE set null ON UPDATE no action;