CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'MANAGER', 'CASHIER', 'INVENTORY_STAFF');
ALTER TABLE "StaffMember" ADD COLUMN "role" "StaffRole" NOT NULL DEFAULT 'CASHIER';
ALTER TABLE "StaffMember" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
-- Existing staff retain the least-privilege default (CASHIER). Assign the first
-- OWNER deliberately after deployment using the documented bootstrap command.
CREATE UNIQUE INDEX "StaffMember_clerkUserId_branchId_key" ON "StaffMember"("clerkUserId", "branchId");
