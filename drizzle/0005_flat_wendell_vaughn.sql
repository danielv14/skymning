CREATE TABLE `explore_chat_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`order_index` integer NOT NULL,
	`created_at` text NOT NULL
);
