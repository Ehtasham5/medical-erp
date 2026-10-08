import { auth } from "@clerk/nextjs/server";
import { StaffRole } from "@prisma/client";
import prisma from "@/lib/db";

export async function getDefaultBranch() {
  const branch = await prisma.branch.findFirst({ where: { isDefault: true } });
  if (!branch) throw new Error("No default branch has been configured.");
  return branch;
}

export async function requireStaff(allowedRoles?: StaffRole[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Authentication is required.");
  const branch = await getDefaultBranch();
  const staff = await prisma.staffMember.findUnique({ where: { clerkUserId: userId } });
  if (!staff || !staff.isActive || staff.branchId !== branch.id) throw new Error("You are not assigned to this branch.");
  if (allowedRoles && !allowedRoles.includes(staff.role)) throw new Error("You do not have permission to perform this action.");
  return { userId, branch, staff };
}

export const inventoryRoles: StaffRole[] = [StaffRole.OWNER, StaffRole.MANAGER, StaffRole.INVENTORY_STAFF];
export const managementRoles: StaffRole[] = [StaffRole.OWNER];
export const reportRoles: StaffRole[] = [StaffRole.OWNER, StaffRole.MANAGER];
