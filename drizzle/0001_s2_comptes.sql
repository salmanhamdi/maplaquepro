CREATE TABLE `auth_attempts` (
	`key_hash` char(64) NOT NULL,
	`action` varchar(32) NOT NULL,
	`window_start` datetime(3) NOT NULL,
	`count` int NOT NULL,
	CONSTRAINT `auth_attempts_pk` PRIMARY KEY(`key_hash`,`action`,`window_start`)
);
--> statement-breakpoint
CREATE TABLE `customer_sessions` (
	`id` char(26) NOT NULL,
	`customer_id` char(26) NOT NULL,
	`token_hash` char(64) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`last_seen_at` datetime(3) NOT NULL,
	`revoked_at` datetime(3),
	CONSTRAINT `customer_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_sessions_token_hash_uq` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `customer_tokens` (
	`id` char(26) NOT NULL,
	`customer_id` char(26) NOT NULL,
	`purpose` enum('email_verification','password_reset') NOT NULL,
	`token_hash` char(64) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`consumed_at` datetime(3),
	CONSTRAINT `customer_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_tokens_token_hash_uq` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` char(26) NOT NULL,
	`email` varchar(254) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`email_verified_at` datetime(3),
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_email_uq` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `customer_sessions` ADD CONSTRAINT `customer_sessions_customer_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_tokens` ADD CONSTRAINT `customer_tokens_customer_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `auth_attempts_window_idx` ON `auth_attempts` (`window_start`);--> statement-breakpoint
CREATE INDEX `customer_sessions_customer_idx` ON `customer_sessions` (`customer_id`);--> statement-breakpoint
CREATE INDEX `customer_tokens_customer_purpose_idx` ON `customer_tokens` (`customer_id`,`purpose`);