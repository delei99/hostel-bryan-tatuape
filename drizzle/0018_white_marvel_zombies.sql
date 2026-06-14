CREATE TABLE `homeImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`imageUrl` text NOT NULL,
	`position` enum('left','right') NOT NULL,
	`title` varchar(255),
	`description` text,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `homeImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `homeImages` ADD CONSTRAINT `homeImages_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;