CREATE TABLE `testSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`testMode` enum('user','firma_admin','firma_member') NOT NULL,
	`testOrganizationId` int,
	`simulatedScenario` enum('normal','credits_low','credits_empty','subscription_expiring','subscription_expired','account_suspended') DEFAULT 'normal',
	`simulatedPlanId` int,
	`simulatedCreditsUsed` int,
	`simulatedCreditsTotal` int,
	`isActive` int NOT NULL DEFAULT 1,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	CONSTRAINT `testSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdByOwnerId` int NOT NULL,
	`testOrganizationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`testUserRole` enum('admin','member') NOT NULL DEFAULT 'member',
	`categoryId` int,
	`businessAreaId` int,
	`tasksExecuted` int DEFAULT 0,
	`lastActiveAt` timestamp,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testUsers_id` PRIMARY KEY(`id`)
);
