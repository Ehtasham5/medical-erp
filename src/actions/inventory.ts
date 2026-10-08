"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { inventoryRoles, requireStaff } from "@/lib/branch";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function addMedicine(formData: FormData) {
  let actor;
  try { actor = await requireStaff(inventoryRoles); } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Unauthorized." }; }

  const name = getString(formData, "name");
  const genericName = getString(formData, "genericName");
  const batchNumber = getString(formData, "batchNumber");
  const stockQuantity = Number(getString(formData, "stockQuantity"));
  const price = getString(formData, "price");
  const costPrice = getString(formData, "costPrice");
  const expiryDate = new Date(getString(formData, "expiryDate"));

  if (
    name.length < 2 ||
    batchNumber.length === 0 ||
    !Number.isSafeInteger(stockQuantity) ||
    stockQuantity < 0 ||
    !/^\d+(\.\d{1,2})?$/.test(price) ||
    !/^\d+(\.\d{1,2})?$/.test(costPrice) ||
    !Number.isFinite(expiryDate.getTime())
  ) {
    return { success: false, error: "Enter valid medicine details and try again." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const medicine = await tx.medicine.create({ data: {
        branchId: actor.branch.id,
        name,
        genericName: genericName || null,
        batchNumber,
        stockQuantity,
        price: new Prisma.Decimal(price),
        costPrice: new Prisma.Decimal(costPrice),
        expiryDate,
      }});
      await tx.inventoryMovement.create({ data: { branchId: actor.branch.id, medicineId: medicine.id, type: "PURCHASE_RECEIVED", quantity: stockQuantity, reason: "Initial stock received", actorId: actor.userId } });
      await tx.auditLog.create({ data: { branchId: actor.branch.id, actorId: actor.userId, action: "MEDICINE_CREATED", entityType: "Medicine", entityId: medicine.id } });
    });

    revalidatePath("/dashboard/inventory");

    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to add medicine to the database." };
  }
}

async function inventoryActor() {
  try { return await requireStaff(inventoryRoles); } catch { return null; }
}

export async function updateMedicine(formData: FormData) {
  const actor = await inventoryActor();
  if (!actor) return;
  const id = getString(formData, "id");
  const name = getString(formData, "name");
  const genericName = getString(formData, "genericName");
  const batchNumber = getString(formData, "batchNumber");
  const price = getString(formData, "price");
  const costPrice = getString(formData, "costPrice");
  const reorderLevel = Number(getString(formData, "reorderLevel"));
  const expiryDate = new Date(getString(formData, "expiryDate"));
  if (!id || name.length < 2 || !batchNumber || !/^\d+(\.\d{1,2})?$/.test(price) || !/^\d+(\.\d{1,2})?$/.test(costPrice) || !Number.isSafeInteger(reorderLevel) || reorderLevel < 0 || !Number.isFinite(expiryDate.getTime())) return;
  await prisma.$transaction(async (tx) => {
    const existing = await tx.medicine.findFirst({ where: { id, branchId: actor.branch.id } });
    if (!existing) throw new Error("Medicine was not found in this branch.");
    const medicine = await tx.medicine.update({ where: { id }, data: { name, genericName: genericName || null, batchNumber, price: new Prisma.Decimal(price), costPrice: new Prisma.Decimal(costPrice), reorderLevel, expiryDate } });
    await tx.auditLog.create({ data: { branchId: actor.branch.id, actorId: actor.userId, action: "MEDICINE_UPDATED", entityType: "Medicine", entityId: medicine.id } });
  });
  revalidatePath("/dashboard/inventory");
}

export async function adjustStock(formData: FormData) {
  const actor = await inventoryActor();
  if (!actor) return;
  const medicineId = getString(formData, "medicineId");
  const quantity = Number(getString(formData, "quantity"));
  const reason = getString(formData, "reason");
  const allowedReasons = new Set(["PURCHASE_RECEIVED", "DAMAGED", "EXPIRED", "CORRECTION", "RETURN"]);
  if (!medicineId || !Number.isSafeInteger(quantity) || quantity === 0 || !allowedReasons.has(reason)) return;
  await prisma.$transaction(async (tx) => {
    const medicine = await tx.medicine.findFirst({ where: { id: medicineId, branchId: actor.branch.id } });
    if (!medicine || medicine.stockQuantity + quantity < 0) throw new Error("Insufficient stock for this adjustment.");
    await tx.medicine.update({ where: { id: medicineId }, data: { stockQuantity: { increment: quantity } } });
    await tx.inventoryMovement.create({ data: { branchId: actor.branch.id, medicineId, type: reason as "PURCHASE_RECEIVED" | "DAMAGED" | "EXPIRED" | "CORRECTION" | "RETURN", quantity, reason, actorId: actor.userId } });
    await tx.auditLog.create({ data: { branchId: actor.branch.id, actorId: actor.userId, action: "STOCK_ADJUSTED", entityType: "Medicine", entityId: medicineId, metadata: { quantity, reason } } });
  });
  revalidatePath("/dashboard/inventory");
}
