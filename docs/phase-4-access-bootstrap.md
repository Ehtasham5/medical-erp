# Phase 4 access bootstrap

The role migration deliberately gives existing staff the least-privilege
`CASHIER` role. Before using inventory or administration, designate one known
Clerk user as the initial owner:

```sql
UPDATE "StaffMember"
SET "role" = 'OWNER'
WHERE "clerkUserId" = '<your Clerk user ID>';
```

Run it only after verifying the user ID in Clerk. Owners can then manage roles
in Settings. Use `MANAGER` for reports and approved discounts,
`INVENTORY_STAFF` for inventory work, and `CASHIER` for POS only.
