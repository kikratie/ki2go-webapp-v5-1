-- Users
SELECT '=== USERS ===' as section;
SELECT * FROM users;

-- Organizations
SELECT '=== ORGANIZATIONS ===' as section;
SELECT * FROM organizations;

-- Organization Members
SELECT '=== ORGANIZATION MEMBERS ===' as section;
SELECT * FROM organizationMembers;

-- Categories
SELECT '=== CATEGORIES ===' as section;
SELECT * FROM categories;

-- Business Areas
SELECT '=== BUSINESS AREAS ===' as section;
SELECT * FROM businessAreas;

-- Task Templates
SELECT '=== TASK TEMPLATES ===' as section;
SELECT id, name, category, businessArea, isActive, createdAt FROM taskTemplates;

-- Metaprompt Templates
SELECT '=== METAPROMPT TEMPLATES ===' as section;
SELECT id, name, category, isActive, createdAt FROM metapromptTemplates;

-- Workflow Executions
SELECT '=== WORKFLOW EXECUTIONS ===' as section;
SELECT * FROM workflowExecutions;

-- Subscription Plans
SELECT '=== SUBSCRIPTION PLANS ===' as section;
SELECT * FROM subscriptionPlans;

-- Organization Subscriptions
SELECT '=== ORGANIZATION SUBSCRIPTIONS ===' as section;
SELECT * FROM organizationSubscriptions;

-- Organization Invitations
SELECT '=== ORGANIZATION INVITATIONS ===' as section;
SELECT * FROM organizationInvitations;

-- Credit Transactions
SELECT '=== CREDIT TRANSACTIONS ===' as section;
SELECT * FROM creditTransactions;

-- Process Audit Log
SELECT '=== PROCESS AUDIT LOG ===' as section;
SELECT * FROM processAuditLog;

-- Document Usage
SELECT '=== DOCUMENT USAGE ===' as section;
SELECT * FROM documentUsage;

-- Documents
SELECT '=== DOCUMENTS ===' as section;
SELECT id, userId, fileName, fileType, fileSize, createdAt FROM documents;

-- Task Requests
SELECT '=== TASK REQUESTS ===' as section;
SELECT * FROM taskRequests;
