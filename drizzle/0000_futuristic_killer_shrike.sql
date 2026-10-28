CREATE TABLE `admins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `admins_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `areas` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(100),
	`country_id` int,
	`state_id` int,
	`city_id` int,
	CONSTRAINT `areas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cities` (
	`id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`state_id` int NOT NULL,
	CONSTRAINT `cities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `countries` (
	`id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`sortname` varchar(100) NOT NULL,
	CONSTRAINT `countries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `otp_verifications` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`otp` varchar(6) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`verified` boolean NOT NULL DEFAULT false,
	`attempts` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `otp_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`title` varchar(255),
	`square_ft` int,
	`beds` int,
	`baths` int,
	`price` decimal(10,2),
	`image` text,
	`property_location` varchar(255),
	`property_type` varchar(255),
	`residential_type` varchar(255),
	`property_For` varchar(255),
	`price_for` varchar(255),
	`country` int,
	`state` int,
	`city` int,
	`landmark` varchar(255),
	`address` varchar(500),
	`area` int,
	`google_location` text,
	`slug` varchar(255),
	`status` varchar(10),
	`paymentstatus` varchar(10),
	`premium` boolean DEFAULT false,
	`payment_type` varchar(50),
	`amount` int,
	`is_deleted` boolean DEFAULT false,
	`remark` varchar(255),
	`is_bank_property` varchar(10) DEFAULT 'no',
	`bank_property_type` varchar(255),
	`custom_bank_type` varchar(255),
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_article` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`image` text,
	`property_location` varchar(255),
	`property_type` varchar(255),
	`residential_type` varchar(255),
	`property_For` varchar(255),
	`country` int,
	`state` int,
	`city` int,
	`description` varchar(500),
	`area` int,
	`slug` varchar(255),
	`status` varchar(10),
	`is_deleted` boolean DEFAULT false,
	CONSTRAINT `property_article_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `states` (
	`id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`country_id` int NOT NULL,
	CONSTRAINT `states_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`memberId` int,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`image` varchar(255),
	`role` varchar(255),
	`address` varchar(255),
	`mobile` int NOT NULL DEFAULT 0,
	`country_id` int,
	`state_id` int,
	`city_id` int,
	`fcm_token` varchar(255) DEFAULT null,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
