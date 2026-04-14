CREATE TABLE `failedUnblockAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ipAddress` varchar(45) NOT NULL,
	`userAgent` text,
	`blockedDateId` int NOT NULL,
	`reason` varchar(255) NOT NULL DEFAULT 'Senha incorreta',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `failedUnblockAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `failedUnblockAttempts` ADD CONSTRAINT `failedUnblockAttempts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `failedUnblockAttempts` ADD CONSTRAINT `failedUnblockAttempts_blockedDateId_blockedDates_id_fk` FOREIGN KEY (`blockedDateId`) REFERENCES `blockedDates`(`id`) ON DELETE cascade ON UPDATE no action;