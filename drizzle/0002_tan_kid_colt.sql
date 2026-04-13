CREATE TABLE `roomPhotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`photoUrl` text NOT NULL,
	`caption` varchar(255),
	`displayOrder` int DEFAULT 0,
	`isMainPhoto` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roomPhotos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `rooms` ADD `additionalImages` text;--> statement-breakpoint
ALTER TABLE `roomPhotos` ADD CONSTRAINT `roomPhotos_roomId_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE cascade ON UPDATE no action;