"use server";
import { StaffRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { managementRoles, requireStaff } from "@/lib/branch";

export async function updateStaffRole(formData: FormData) {
  const actor = await requireStaff(managementRoles);
  const clerkUserId = String(formData.get("clerkUserId") ?? "");
  const role = String(formData.get("role") ?? "") as StaffRole;
  const isActive = formData.get("isActive") === "true";
  if (!clerkUserId || !Object.values(StaffRole).includes(role)) throw new Error("Invalid staff update.");
  await prisma.staffMember.updateMany({ where: { clerkUserId, branchId: actor.branch.id }, data: { role, isActive } });
  revalidatePath("/dashboard/settings");
}

export async function updateBranchSettings(formData: FormData) {
  const actor = await requireStaff(managementRoles);
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const currency = String(formData.get("currency") ?? "").trim().toUpperCase();
  const receiptHeader = String(formData.get("receiptHeader") ?? "").trim();
  const receiptFooter = String(formData.get("receiptFooter") ?? "").trim();
  if (!name || !/^[A-Z]{3}$/.test(currency)) throw new Error("Enter a branch name and a three-letter currency code.");
  await prisma.branch.update({ where: { id: actor.branch.id }, data: { name, address: address || null, phone: phone || null, currency, receiptHeader: receiptHeader || null, receiptFooter: receiptFooter || null } });
  revalidatePath("/dashboard"); revalidatePath("/dashboard/settings"); revalidatePath("/dashboard/pos");
}
