"use server";
import { Prisma, SaleStatus, StaffRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { requireStaff } from "@/lib/branch";

type Item = { id: string; cartQty: number };
type PaymentMethod = "CASH" | "CARD" | "MOBILE_WALLET" | "SPLIT";
type CheckoutPayload = { items: Item[]; paymentMethod: PaymentMethod; payments?: { method: Exclude<PaymentMethod, "SPLIT">; amount: string }[]; discountAmount?: string; requestId: string };
const money = (value: string) => /^\d+(\.\d{1,2})?$/.test(value);

export async function checkoutSale(data: CheckoutPayload) {
  let actor;
  try { actor = await requireStaff([StaffRole.OWNER, StaffRole.MANAGER, StaffRole.CASHIER]); } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Unauthorized." }; }
  if (!data.requestId || !data.items.length || new Set(data.items.map((i) => i.id)).size !== data.items.length || data.items.some((i) => !i.id || !Number.isSafeInteger(i.cartQty) || i.cartQty < 1)) return { success: false, error: "The sale contains invalid details." };
  const discount = data.discountAmount && money(data.discountAmount) ? new Prisma.Decimal(data.discountAmount) : new Prisma.Decimal(0);
  try {
    const sale = await prisma.$transaction(async (tx) => {
      const prior = await tx.sale.findUnique({ where: { requestId: data.requestId } }); if (prior) return prior;
      const medicines = await tx.medicine.findMany({ where: { id: { in: data.items.map((i) => i.id) }, branchId: actor.branch.id }, select: { id: true, price: true, stockQuantity: true } }); const byId = new Map(medicines.map((m) => [m.id, m]));
      const items = data.items.map((i) => { const m = byId.get(i.id); if (!m || m.stockQuantity < i.cartQty) throw new Error("One or more items are no longer available."); return { medicineId: i.id, quantity: i.cartQty, unitPrice: m.price, total: m.price.mul(i.cartQty) }; });
      const subtotal = items.reduce((sum, i) => sum.add(i.total), new Prisma.Decimal(0)); if (discount.greaterThan(subtotal)) throw new Error("Discount cannot exceed the subtotal."); const totalAmount = subtotal.sub(discount);
      const payments = data.paymentMethod === "SPLIT" ? data.payments ?? [] : [{ method: data.paymentMethod, amount: totalAmount.toFixed(2) }]; const paid = payments.reduce((sum, p) => money(p.amount) ? sum.add(p.amount) : sum, new Prisma.Decimal(0)); if (!payments.length || !paid.equals(totalAmount)) throw new Error("Payment amounts must equal the sale total.");
      const created = await tx.sale.create({ data: { branchId: actor.branch.id, cashierId: actor.userId, subtotal, discountAmount: discount, totalAmount, paymentMethod: data.paymentMethod, paymentDetails: payments, status: SaleStatus.COMPLETED, receiptNumber: `R-${Date.now().toString(36).toUpperCase()}-${data.requestId.slice(0, 6).toUpperCase()}`, requestId: data.requestId } });
      for (const i of items) { const updated = await tx.medicine.updateMany({ where: { id: i.medicineId, branchId: actor.branch.id, stockQuantity: { gte: i.quantity } }, data: { stockQuantity: { decrement: i.quantity } } }); if (updated.count !== 1) throw new Error("Inventory changed. Please try again."); }
      await tx.saleItem.createMany({ data: items.map((i) => ({ ...i, saleId: created.id })) }); await tx.inventoryMovement.createMany({ data: items.map((i) => ({ branchId: actor.branch.id, medicineId: i.medicineId, type: "SALE", quantity: -i.quantity, reason: "Point of sale checkout", referenceId: created.id, actorId: actor.userId })) }); await tx.auditLog.create({ data: { branchId: actor.branch.id, actorId: actor.userId, action: "SALE_COMPLETED", entityType: "Sale", entityId: created.id } }); return created;
    });
    revalidatePath("/dashboard/pos"); revalidatePath("/dashboard/inventory"); revalidatePath("/dashboard/sales"); return { success: true, saleId: sale.id, receiptNumber: sale.receiptNumber, total: sale.totalAmount.toNumber(), paymentMethod: sale.paymentMethod };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Failed to process sale." }; }
}
