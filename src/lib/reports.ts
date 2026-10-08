import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";

export function reportRange(from?: string, to?: string) {
  const now = new Date();
  const end = to && !Number.isNaN(Date.parse(to)) ? new Date(`${to}T23:59:59.999Z`) : now;
  const start = from && !Number.isNaN(Date.parse(from)) ? new Date(`${from}T00:00:00.000Z`) : new Date(end.getTime() - 29 * 86400000);
  return start <= end ? { gte: start, lte: end } : { gte: end, lte: start };
}

export async function getReportData(branchId: string, from?: string, to?: string) {
  const createdAt = reportRange(from, to);
  const [sales, lowStock, expiring, valuation, topItems, slowMoving] = await Promise.all([
    prisma.sale.findMany({ where: { branchId, status: "COMPLETED", createdAt }, select: { createdAt: true, totalAmount: true } }),
    prisma.medicine.findMany({ where: { branchId, stockQuantity: { lte: 20 } }, select: { id: true, name: true, stockQuantity: true, reorderLevel: true } }),
    prisma.medicine.findMany({ where: { branchId, expiryDate: { lte: new Date(Date.now() + 90 * 86400000) } }, orderBy: { expiryDate: "asc" }, select: { id: true, name: true, expiryDate: true, stockQuantity: true } }),
    prisma.medicine.aggregate({ where: { branchId }, _sum: { stockQuantity: true } }),
    prisma.saleItem.groupBy({ by: ["medicineId"], where: { sale: { branchId, status: "COMPLETED", createdAt } }, _sum: { quantity: true, total: true }, orderBy: { _sum: { quantity: "desc" } }, take: 10 }),
    prisma.medicine.findMany({ where: { branchId, saleItems: { none: { sale: { status: "COMPLETED", createdAt } } } }, take: 20, orderBy: { stockQuantity: "desc" }, select: { id: true, name: true, stockQuantity: true } }),
  ]);
  const medicineIds = topItems.map((item) => item.medicineId);
  const medicines = await prisma.medicine.findMany({ where: { id: { in: medicineIds }, branchId }, select: { id: true, name: true } });
  const names = new Map(medicines.map((medicine) => [medicine.id, medicine.name]));
  const revenue = sales.reduce((sum, sale) => sum.add(sale.totalAmount), new Prisma.Decimal(0));
  const daily = new Map<string, Prisma.Decimal>();
  for (const sale of sales) { const key = sale.createdAt.toISOString().slice(0, 10); daily.set(key, (daily.get(key) ?? new Prisma.Decimal(0)).add(sale.totalAmount)); }
  const inventory = await prisma.medicine.findMany({ where: { branchId }, select: { stockQuantity: true, costPrice: true } });
  const stockValue = inventory.reduce((sum, medicine) => sum.add(medicine.costPrice.mul(medicine.stockQuantity)), new Prisma.Decimal(0));
  return { createdAt, revenue: revenue.toNumber(), transactions: sales.length, averageOrder: sales.length ? revenue.div(sales.length).toNumber() : 0, daily: [...daily.entries()].map(([date, amount]) => ({ date, amount: amount.toNumber() })), lowStock, expiring, stockValue: stockValue.toNumber(), topItems: topItems.map((item) => ({ name: names.get(item.medicineId) ?? "Removed medicine", quantity: item._sum.quantity ?? 0, revenue: Number(item._sum.total ?? 0) })), slowMoving, totalStock: valuation._sum.stockQuantity ?? 0 };
}
