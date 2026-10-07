CREATE INDEX `chat_messages_date_order_idx` ON `chat_messages` (`date`,`order_index`);--> statement-breakpoint
ALTER TABLE `user_context` DROP COLUMN `history_count`;