CREATE TABLE `blockedDates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`reason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blockedDates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `blockedDates` ADD CONSTRAINT `blockedDates_roomId_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE cascade ON UPDATE no action;