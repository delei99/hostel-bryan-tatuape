CREATE TABLE `blockingExceptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blockedDateId` int NOT NULL,
	`exceptionDate` date NOT NULL,
	`reason` varchar(255),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blockingExceptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `blockingExceptions` ADD CONSTRAINT `blockingExceptions_blockedDateId_blockedDates_id_fk` FOREIGN KEY (`blockedDateId`) REFERENCES `blockedDates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blockingExceptions` ADD CONSTRAINT `blockingExceptions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;